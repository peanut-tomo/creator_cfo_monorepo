const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-proxy-target",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders, status: 204 });
}

export async function POST(request: Request) {
  const targetUrl = request.headers.get("x-proxy-target");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing x-proxy-target header" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  try {
    new URL(targetUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid target URL" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const forwardHeaders: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
  };

  const authorization = request.headers.get("authorization");

  if (authorization) {
    forwardHeaders["Authorization"] = authorization;
  }

  try {
    const body = await request.text();
    const proxyResponse = await fetch(targetUrl, {
      body,
      headers: forwardHeaders,
      method: "POST",
    });

    const responseBody = await proxyResponse.text();

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": proxyResponse.headers.get("content-type") ?? "application/json",
      },
      status: proxyResponse.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Proxy request failed";

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 502,
    });
  }
}
