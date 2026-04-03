import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./parse-evidence";

const originalFetch = global.fetch;

describe("POST /api/parse-evidence", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("rejects missing authorization", async () => {
    const request = new Request("http://localhost/api/parse-evidence", {
      body: JSON.stringify({
        fileUrl: "https://example.com/receipt.pdf",
        filename: "receipt.pdf",
        mimeType: "application/pdf",
        sourcePlatform: "ios",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      error: {
        code: "missing_authorization",
        message: "Authorization: Bearer <OpenAI API key> is required.",
      },
    });
  });

  it("parses multipart image uploads into structured JSON", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          model: "gpt-5",
          output: [
            {
              content: [
                {
                  text: JSON.stringify({
                    fields: {
                      amountCents: 5299,
                      category: "expense",
                      date: "2026-04-01",
                      description: "Apple Store receipt",
                      notes: null,
                      source: "Business card",
                      target: "Apple Store",
                      taxCategory: "office",
                    },
                    rawSummary: "Receipt for Apple Store purchase.",
                    rawText: "Apple Store\n04/01/2026\n$52.99",
                    warnings: [],
                  }),
                  type: "output_text",
                },
              ],
            },
          ],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        },
      ),
    );

    const formData = new FormData();
    formData.append("filename", "receipt.jpg");
    formData.append("mimeType", "image/jpeg");
    formData.append("sourcePlatform", "ios");
    formData.append("file", new File(["image-bytes"], "receipt.jpg", { type: "image/jpeg" }));

    const request = new Request("http://localhost/api/parse-evidence", {
      body: formData,
      headers: {
        Authorization: "Bearer sk-test",
      },
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      fields: {
        amountCents: 5299,
        date: "2026-04-01",
      },
      model: "gpt-5",
      parser: "openai_gpt",
      rawSummary: "Receipt for Apple Store purchase.",
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("supports JSON fileUrl parsing for PDFs", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response("pdf-binary", {
          headers: {
            "Content-Length": "10",
            "Content-Type": "application/pdf",
          },
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            model: "gpt-5",
            output_text: JSON.stringify({
              fields: {
                amountCents: 124500,
                category: "income",
                date: "2026-03-31",
                description: "Platform payout",
                notes: null,
                source: "YouTube",
                target: "Business checking",
                taxCategory: null,
              },
              rawSummary: "Monthly platform payout PDF.",
              rawText: "March payout statement",
              warnings: ["Target inferred from payout language."],
            }),
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );

    const request = new Request("http://localhost/api/parse-evidence", {
      body: JSON.stringify({
        fileUrl: "https://example.com/statement.pdf",
        filename: "statement.pdf",
        mimeType: "application/pdf",
        sourcePlatform: "web",
      }),
      headers: {
        Authorization: "Bearer sk-test",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      fields: {
        amountCents: 124500,
        category: "income",
      },
      parser: "openai_gpt",
      warnings: ["Target inferred from payout language."],
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns a controlled error for unsupported mime types", async () => {
    const formData = new FormData();
    formData.append("filename", "receipt.gif");
    formData.append("mimeType", "image/gif");
    formData.append("sourcePlatform", "ios");
    formData.append("file", new File(["gif-bytes"], "receipt.gif", { type: "image/gif" }));

    const request = new Request("http://localhost/api/parse-evidence", {
      body: formData,
      headers: {
        Authorization: "Bearer sk-test",
      },
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(415);
    expect(payload).toEqual({
      error: {
        code: "unsupported_mime_type",
        message: "Supported file types are PDF, JPG, JPEG, PNG, and HEIC.",
      },
    });
  });

  it("surfaces OpenAI authentication failures without leaking implementation details", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: "Incorrect API key provided.",
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 401,
        },
      ),
    );

    const formData = new FormData();
    formData.append("filename", "receipt.jpg");
    formData.append("mimeType", "image/jpeg");
    formData.append("sourcePlatform", "android");
    formData.append("file", new File(["image-bytes"], "receipt.jpg", { type: "image/jpeg" }));

    const request = new Request("http://localhost/api/parse-evidence", {
      body: formData,
      headers: {
        Authorization: "Bearer sk-invalid",
      },
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      error: {
        code: "invalid_openai_key",
        message: "Incorrect API key provided.",
      },
    });
  });
});
