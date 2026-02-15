export async function onRequestPost(context) {
  const { request, env } = context;

  const GROUNDHOGG_URL = env.GROUNDHOGG_URL; // e.g. https://auto.mation.cc/taskai
  const GH_PUBLIC_KEY = env.GH_PUBLIC_KEY;
  const GH_TOKEN = env.GH_TOKEN;

  if (!GROUNDHOGG_URL || !GH_PUBLIC_KEY || !GH_TOKEN) {
    return Response.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { email, source } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return Response.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }

  const tags = ["taskai-early-access"];
  if (source) {
    tags.push(source);
  }

  try {
    const res = await fetch(
      `${GROUNDHOGG_URL}/wp-json/gh/v3/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "gh-token": GH_TOKEN,
          "gh-public-key": GH_PUBLIC_KEY,
        },
        body: JSON.stringify({
          email,
          optin_status: 2,
          tags,
          meta: {
            source: source || "taskai-landing",
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Groundhogg API error:", res.status, err);
      return Response.json(
        { error: "Failed to subscribe" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return Response.json({ success: true, id: data.contact?.ID });
  } catch (err) {
    console.error("Groundhogg request failed:", err);
    return Response.json(
      { error: "Service unavailable" },
      { status: 502 }
    );
  }
}
