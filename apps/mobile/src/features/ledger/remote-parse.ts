import type {
  ParseEvidenceApiErrorBody,
  ParseEvidenceApiSuccess,
  ParseSourcePlatform,
} from "@creator-cfo/schemas";

import { loadParseApiSettings } from "../app-shell/storage";

interface BaseParseInput {
  fileName: string;
  mimeType: string | null;
  sourcePlatform: ParseSourcePlatform;
}

interface NativeMultipartParseInput extends BaseParseInput {
  fileUri: string;
}

interface BlobMultipartParseInput extends BaseParseInput {
  blob: Blob;
}

interface FileUrlParseInput extends BaseParseInput {
  fileUrl: string;
}

export async function parseEvidenceMultipartFromNative(
  input: NativeMultipartParseInput,
): Promise<ParseEvidenceApiSuccess> {
  const settings = await loadRequiredParseApiSettings();
  const formData = new FormData();
  const mimeType = input.mimeType ?? inferMimeType(input.fileName);

  formData.append("filename", input.fileName);
  formData.append("mimeType", mimeType);
  formData.append("sourcePlatform", input.sourcePlatform);
  formData.append(
    "file",
    {
      name: input.fileName,
      type: mimeType,
      uri: input.fileUri,
    } as never,
  );

  return sendParseRequest(settings, {
    body: formData,
    headers: {},
  });
}

export async function parseEvidenceMultipartFromBlob(
  input: BlobMultipartParseInput,
): Promise<ParseEvidenceApiSuccess> {
  const settings = await loadRequiredParseApiSettings();
  const formData = new FormData();
  const mimeType = input.mimeType ?? input.blob.type ?? inferMimeType(input.fileName);

  formData.append("filename", input.fileName);
  formData.append("mimeType", mimeType);
  formData.append("sourcePlatform", input.sourcePlatform);
  formData.append("file", new File([input.blob], input.fileName, { type: mimeType }));

  return sendParseRequest(settings, {
    body: formData,
    headers: {},
  });
}

export async function parseEvidenceFromFileUrl(
  input: FileUrlParseInput,
): Promise<ParseEvidenceApiSuccess> {
  const settings = await loadRequiredParseApiSettings();

  return sendParseRequest(settings, {
    body: JSON.stringify({
      fileUrl: input.fileUrl,
      filename: input.fileName,
      mimeType: input.mimeType ?? inferMimeType(input.fileName),
      sourcePlatform: input.sourcePlatform,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function loadRequiredParseApiSettings() {
  const settings = await loadParseApiSettings();

  if (!settings.parseApiBaseUrl) {
    throw new Error("Set your Vercel API Base URL in Settings before parsing uploads.");
  }

  if (!settings.openAiApiKey) {
    throw new Error("Set your OpenAI API key in Settings before parsing uploads.");
  }

  return settings;
}

async function sendParseRequest(
  settings: Awaited<ReturnType<typeof loadRequiredParseApiSettings>>,
  input: {
    body: BodyInit;
    headers: HeadersInit;
  },
): Promise<ParseEvidenceApiSuccess> {
  const response = await fetch(`${settings.parseApiBaseUrl}/api/parse-evidence`, {
    body: input.body,
    headers: {
      Authorization: `Bearer ${settings.openAiApiKey}`,
      ...input.headers,
    },
    method: "POST",
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? ((await response.json()) as ParseEvidenceApiSuccess | ParseEvidenceApiErrorBody) : null;

  if (!response.ok) {
    const message =
      payload && "error" in payload
        ? payload.error.message
        : `Remote parse failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (!payload || "error" in payload) {
    throw new Error("Remote parse returned an invalid response.");
  }

  return payload;
}

function inferMimeType(fileName: string): string {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".heic") || normalized.endsWith(".heif")) {
    return "image/heic";
  }

  return "image/jpeg";
}
