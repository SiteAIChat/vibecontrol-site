export async function onRequestPost(context) {
  const { request, env } = context;

  const GROUNDHOGG_URL = env.GROUNDHOGG_URL; // e.g. https://auto.mation.cc/vibecontrol
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

  const { email, first_name, last_name, source, interests } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return Response.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }

  const tags = ["vibecontrol-early-access"];
  if (source) {
    tags.push(source);
  }

  // Append validated interest tags
  const validInterests = [
    "interest-task-board",
    "interest-self-hosted",
    "interest-persistent-memory",
    "interest-multi-model",
    "interest-team-collab",
    "interest-multi-agent",
  ];
  if (Array.isArray(interests)) {
    for (const tag of interests) {
      if (validInterests.includes(tag)) {
        tags.push(tag);
      }
    }
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
          first_name: first_name || "",
          last_name: last_name || "",
          optin_status: 2,
          tags,
          meta: {
            source: source || "vibecontrol-landing",
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
