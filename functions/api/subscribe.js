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

  const ghHeaders = {
    "Content-Type": "application/json",
    "gh-token": GH_TOKEN,
    "gh-public-key": GH_PUBLIC_KEY,
  };

  const ghBase = `${GROUNDHOGG_URL}/wp-json/gh/v4/contacts`;

  const contactPayload = {
    data: {
      email,
      first_name: first_name || "",
      last_name: last_name || "",
      optin_status: 2,
    },
    tags,
    meta: {
      source: source || "vibecontrol-landing",
    },
  };

  try {
    // Check if contact already exists
    const lookupRes = await fetch(
      `${ghBase}?id_or_email=${encodeURIComponent(email)}&by_user_id=false`,
      { method: "GET", headers: ghHeaders }
    );

    if (lookupRes.ok) {
      const lookupData = await lookupRes.json();

      // Extract contact ID from the response — contacts are keyed by ID
      const contacts = lookupData.contacts || lookupData.items || {};
      const contactIds = Object.keys(contacts);

      if (contactIds.length > 0) {
        // Contact exists — update via PATCH
        const contactId = contactIds[0];
        const updateRes = await fetch(
          `${ghBase}/${contactId}`,
          {
            method: "PATCH",
            headers: ghHeaders,
            body: JSON.stringify(contactPayload),
          }
        );

        if (updateRes.ok) {
          const data = await updateRes.json();
          return Response.json({ success: true, id: contactId });
        }

        const err = await updateRes.text();
        console.error("Groundhogg V4 update failed:", updateRes.status, err);
        return Response.json(
          { error: "Failed to subscribe" },
          { status: 502 }
        );
      }
    }

    // Contact doesn't exist (or lookup failed) — create new
    const createRes = await fetch(ghBase, {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify(contactPayload),
    });

    if (createRes.ok) {
      const data = await createRes.json();
      const contactId = data.contact?.ID || data.item?.ID;
      return Response.json({ success: true, id: contactId });
    }

    const err = await createRes.text();
    console.error("Groundhogg V4 create failed:", createRes.status, err);
    return Response.json(
      { error: "Failed to subscribe" },
      { status: 502 }
    );
  } catch (err) {
    console.error("Groundhogg request failed:", err);
    return Response.json(
      { error: "Service unavailable" },
      { status: 502 }
    );
  }
}
