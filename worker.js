const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "CallPilot AI", provider: "Groq" });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      if (!env.GROQ_API_KEY) {
        return json({ error: "GROQ_API_KEY secret is missing" }, 503);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      if (!body.message) {
        return json({ error: "Message is required" }, 400);
      }

      const model = env.GROQ_MODEL || "openai/gpt-oss-20b";

      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + env.GROQ_API_KEY,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a polite AI assistant for consent-based calling campaigns. " +
                    "Respect opt-outs and never pressure people. Campaign purpose: " +
                    String(body.purpose || "General assistance") +
                    ". Respond in " + String(body.language || "English") + "."
                },
                {
                  role: "user",
                  content: String(body.message).slice(0, 4000)
                }
              ]
            })
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          return json({
            error: "Groq API request failed",
            status: response.status,
            details: data.error?.message || data.message || "Check the Groq API key and model ID"
          }, 502);
        }

        return json({
          reply: data.choices?.[0]?.message?.content || "",
          model: data.model || model,
          provider: "Groq"
        });
      } catch {
        return json({
          error: "Cannot connect to Groq API",
          details: "Check network access and try again"
        }, 502);
      }
    }

    return json({ error: "Not found" }, 404);
  }
};
