const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "CallPilot AI",
        mode: "simulation"
      });
    }

    if (url.pathname === "/api/chat" &&
        request.method === "POST") {
      if (!env.OMNIROUTE_API_KEY) {
        return json({
          error: "OMNIROUTE_API_KEY secret is missing"
        }, 503);
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

      const base = (
        env.OMNIROUTE_BASE_URL || "http://127.0.0.1:20128"
      ).replace(/\/+$/, "");

      try {
        const response = await fetch(
          base + "/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + env.OMNIROUTE_API_KEY,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: env.OMNIROUTE_MODEL || "YOUR_MODEL_ID",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a polite AI assistant for consent-based " +
                    "calling campaigns. Respect opt-outs and never pressure " +
                    "people. Campaign purpose: " +
                    String(body.purpose || "General assistance") +
                    ". Respond in " +
                    String(body.language || "English") + "."
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
            error: "OmniRoute request failed",
            details: data.error?.message || data.message ||
              "Check the API URL and model ID"
          }, 502);
        }

        return json({
          reply: data.choices?.[0]?.message?.content || "",
          model: data.model || "unknown"
        });
      } catch {
        return json({
          error: "Cannot connect to OmniRoute",
          details: "Check that its API URL is publicly reachable"
        }, 502);
      }
    }

    return json({ error: "Not found" }, 404);
  }
};
