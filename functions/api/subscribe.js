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

  // DEBUG: Collect diagnostic info for each step
  const debug = { steps: [] };

  try {
    // Step 1: Check if contact already exists
    const lookupRes = await fetch(
      `${ghBase}?id_or_email=${encodeURIComponent(email)}&by_user_id=false`,
      { method: "GET", headers: ghHeaders }
    );

    const lookupBody = await lookupRes.text();
    debug.steps.push({
      step: "lookup",
      status: lookupRes.status,
      ok: lookupRes.ok,
      body: lookupBody.slice(0, 2000),
    });

    let lookupData;
    try { lookupData = JSON.parse(lookupBody); } catch { lookupData = null; }

    if (lookupRes.ok && lookupData) {
      const contacts = lookupData.contacts || lookupData.items || {};
      const contactIds = Object.keys(contacts);

      debug.steps.push({
        step: "lookup_parsed",
        keys_tried: ["contacts", "items"],
        found_keys: Object.keys(lookupData),
        contact_ids: contactIds,
      });

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

        const updateBody = await updateRes.text();
        debug.steps.push({
          step: "update",
          url: `${ghBase}/${contactId}`,
          status: updateRes.status,
          ok: updateRes.ok,
          body: updateBody.slice(0, 2000),
          payload_sent: contactPayload,
        });

        if (updateRes.ok) {
          return Response.json({ success: true, id: contactId, debug });
        }

        return Response.json(
          { error: "Failed to update existing contact", debug },
          { status: 502 }
        );
      }
    }

    // Step 2: Contact doesn't exist — create new
    const createRes = await fetch(ghBase, {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify(contactPayload),
    });

    const createBody = await createRes.text();
    debug.steps.push({
      step: "create",
      status: createRes.status,
      ok: createRes.ok,
      body: createBody.slice(0, 2000),
      payload_sent: contactPayload,
    });

    if (createRes.ok) {
      let createData;
      try { createData = JSON.parse(createBody); } catch { createData = null; }
      const contactId = createData?.contact?.ID || createData?.item?.ID;
      return Response.json({ success: true, id: contactId, debug });
    }

    return Response.json(
      { error: "Failed to create contact", debug },
      { status: 502 }
    );
  } catch (err) {
    debug.steps.push({ step: "exception", message: err.message, stack: err.stack });
    return Response.json(
      { error: "Service unavailable", debug },
      { status: 502 }
    );
  }
}
