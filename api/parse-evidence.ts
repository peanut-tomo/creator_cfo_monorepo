import {
  assertDirectUploadSize,
  assertRemoteFileSize,
  createErrorResponse,
  jsonResponse,
  normalizeFilename,
  normalizeMimeType,
  parseAuthorizationBearerToken,
  parseSourcePlatform,
  RouteError,
  type ParseRouteInput,
} from "./_lib/contracts";
import { parseEvidenceWithOpenAI } from "./_lib/openai";

export async function POST(request: Request) {
  try {
    const apiKey = parseAuthorizationBearerToken(request.headers.get("authorization"));
    const input = await parseIncomingRequest(request);
    const parsed = await parseEvidenceWithOpenAI(input, apiKey);

    return jsonResponse(parsed);
  } catch (error) {
    if (error instanceof RouteError) {
      return createErrorResponse(error);
    }

    return createErrorResponse(
      new RouteError(500, "unexpected_parse_error", error instanceof Error ? error.message : "Unexpected parse failure."),
    );
  }
}

async function parseIncomingRequest(request: Request): Promise<ParseRouteInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartRequest(request);
  }

  if (contentType.includes("application/json")) {
    return parseJsonRequest(request);
  }

  throw new RouteError(
    415,
    "unsupported_content_type",
    "Use multipart/form-data with a file field or JSON with fileUrl.",
  );
}

async function parseMultipartRequest(request: Request): Promise<ParseRouteInput> {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new RouteError(400, "missing_file", "multipart/form-data requires a file field.");
  }

  assertDirectUploadSize(file.size);

  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    filename: normalizeFilename(formData.get("filename") ?? file.name),
    mimeType: normalizeMimeType(formData.get("mimeType") ?? file.type),
    sourcePlatform: parseSourcePlatform(formData.get("sourcePlatform")),
  };
}

async function parseJsonRequest(request: Request): Promise<ParseRouteInput> {
  const body = (await request.json()) as {
    fileUrl?: unknown;
    filename?: unknown;
    mimeType?: unknown;
    sourcePlatform?: unknown;
  };
  const fileUrl = String(body.fileUrl ?? "").trim();

  if (!fileUrl) {
    throw new RouteError(400, "missing_file_url", "fileUrl is required for JSON parse requests.");
  }

  const url = new URL(fileUrl);

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new RouteError(400, "invalid_file_url", "fileUrl must start with https:// or http://.");
  }

  if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new RouteError(400, "invalid_file_url", "Production fileUrl values must use https://.");
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new RouteError(400, "file_url_fetch_failed", `Unable to fetch fileUrl: ${response.status}.`);
  }

  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);

  if (Number.isFinite(contentLength)) {
    assertRemoteFileSize(contentLength);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  assertRemoteFileSize(bytes.byteLength);

  return {
    bytes,
    filename: normalizeFilename(body.filename),
    mimeType: normalizeMimeType(body.mimeType ?? response.headers.get("content-type")),
    sourcePlatform: parseSourcePlatform(body.sourcePlatform),
  };
}
