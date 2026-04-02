import type {
  EvidenceFieldCandidates,
  ParseEvidenceApiSuccess,
} from "../../packages/schemas/src/index";

import { RouteError, parseModel, type ParseRouteInput } from "./contracts";

const parseResponseSchema = {
  additionalProperties: false,
  properties: {
    fields: {
      additionalProperties: false,
      properties: {
        amountCents: { type: ["integer", "null"] },
        category: { type: ["string", "null"] },
        date: { type: ["string", "null"] },
        description: { type: ["string", "null"] },
        notes: { type: ["string", "null"] },
        source: { type: ["string", "null"] },
        target: { type: ["string", "null"] },
        taxCategory: { type: ["string", "null"] },
      },
      required: [
        "amountCents",
        "category",
        "date",
        "description",
        "notes",
        "source",
        "target",
        "taxCategory",
      ],
      type: "object",
    },
    rawSummary: { type: "string" },
    rawText: { type: "string" },
    warnings: {
      items: { type: "string" },
      type: "array",
    },
  },
  required: ["fields", "rawSummary", "rawText", "warnings"],
  type: "object",
} as const;

const systemPrompt = [
  "You parse creator-finance evidence such as receipts, invoices, payout screenshots, and PDFs.",
  "Return strict JSON only.",
  "Extract the full readable text into rawText as completely as possible.",
  "Use warnings for uncertainty, guesses, missing values, or ambiguous currency/date interpretation.",
  "If a field cannot be confirmed from the file, return null.",
  "date must be YYYY-MM-DD when known.",
  "amountCents must be an integer in cents when known.",
  "description should be a short merchant or transaction summary.",
].join(" ");

export async function parseEvidenceWithOpenAI(
  input: ParseRouteInput,
  apiKey: string,
): Promise<ParseEvidenceApiSuccess> {
  const base64 = Buffer.from(input.bytes).toString("base64");
  const filePart =
    input.mimeType === "application/pdf"
      ? {
          file_data: `data:${input.mimeType};base64,${base64}`,
          filename: input.filename,
          type: "input_file",
        }
      : {
          detail: "high",
          image_url: `data:${input.mimeType};base64,${base64}`,
          type: "input_image",
        };
  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content: [
            {
              text: systemPrompt,
              type: "input_text",
            },
          ],
          role: "system",
        },
        {
          content: [
            {
              text: `filename: ${input.filename}\nmimeType: ${input.mimeType}\nsourcePlatform: ${input.sourcePlatform}`,
              type: "input_text",
            },
            filePart,
          ],
          role: "user",
        },
      ],
      max_output_tokens: 1600,
      model: parseModel,
      store: false,
      text: {
        format: {
          name: "receipt_parse",
          schema: parseResponseSchema,
          strict: true,
          type: "json_schema",
        },
      },
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const providerMessage = extractProviderMessage(payload);
    throw new RouteError(
      response.status === 401 ? 401 : 502,
      response.status === 401 ? "invalid_openai_key" : "openai_request_failed",
      providerMessage ?? "OpenAI parsing request failed.",
    );
  }

  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new RouteError(502, "invalid_openai_response", "OpenAI returned no parseable output text.");
  }

  let parsedOutput: unknown;

  try {
    parsedOutput = JSON.parse(outputText);
  } catch {
    throw new RouteError(502, "invalid_openai_json", "OpenAI returned invalid JSON for the parse response.");
  }

  return {
    fields: sanitizeFields(parsedOutput),
    model: typeof payload.model === "string" && payload.model ? payload.model : parseModel,
    parser: "openai_gpt",
    rawSummary: readString(parsedOutput, "rawSummary"),
    rawText: readString(parsedOutput, "rawText"),
    warnings: readStringArray(parsedOutput, "warnings"),
  };
}

function extractProviderMessage(payload: Record<string, unknown>): string | null {
  const error = payload.error;

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return null;
}

function extractOutputText(payload: Record<string, unknown>): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const textParts: string[] = [];

  for (const item of output) {
    const content =
      item && typeof item === "object" && "content" in item && Array.isArray(item.content)
        ? item.content
        : [];

    for (const part of content) {
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        textParts.push(part.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function sanitizeFields(payload: unknown): EvidenceFieldCandidates {
  const fields =
    payload && typeof payload === "object" && "fields" in payload && payload.fields && typeof payload.fields === "object"
      ? payload.fields
      : {};

  return {
    amountCents: readNullableInteger(fields, "amountCents"),
    category: readNullableString(fields, "category"),
    date: normalizeIsoDate(readNullableString(fields, "date")),
    description: readNullableString(fields, "description"),
    notes: readNullableString(fields, "notes"),
    source: readNullableString(fields, "source"),
    target: readNullableString(fields, "target"),
    taxCategory: readNullableString(fields, "taxCategory"),
  };
}

function readString(payload: unknown, key: string): string {
  const record = isRecord(payload) ? payload : null;

  if (record && typeof record[key] === "string") {
    return record[key].trim();
  }

  return "";
}

function readNullableString(payload: unknown, key: string): string | null {
  const record = isRecord(payload) ? payload : null;

  if (record) {
    const value = record[key];

    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized || null;
    }
  }

  return null;
}

function readNullableInteger(payload: unknown, key: string): number | null {
  const record = isRecord(payload) ? payload : null;

  if (record) {
    const value = record[key];

    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }

    if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
      return Number.parseInt(value.trim(), 10);
    }
  }

  return null;
}

function readStringArray(payload: unknown, key: string): string[] {
  const record = isRecord(payload) ? payload : null;

  if (record) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeIsoDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}
