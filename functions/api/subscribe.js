const ALLOWED_ORIGINS = [
  "https://vibecontrol.app",
  "https://www.vibecontrol.app",
  "https://getvibecontrol.com",
  "https://www.getvibecontrol.com",
];

function corsHeaders(origin) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get("Origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";

  const GROUNDHOGG_URL = env.GROUNDHOGG_URL;
  const GH_PUBLIC_KEY = env.GH_PUBLIC_KEY;
  const GH_TOKEN = env.GH_TOKEN;

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: corsHeaders(origin),
    });
  }

  if (!GROUNDHOGG_URL || !GH_PUBLIC_KEY || !GH_TOKEN) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { email, first_name, last_name, source, interests } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return jsonResponse({ error: "Valid email is required" }, 400);
  }

  const tags = ["vibecontrol-early-access"];
  if (source) {
    tags.push(source);
  }

  var validInterests = [
    "interest-task-board",
    "interest-self-hosted",
    "interest-persistent-memory",
    "interest-multi-model",
    "interest-team-collab",
    "interest-multi-agent",
  ];
  if (Array.isArray(interests)) {
    for (var i = 0; i < interests.length; i++) {
      if (validInterests.indexOf(interests[i]) !== -1) {
        tags.push(interests[i]);
      }
    }
  }

  var ghHeaders = {
    "Content-Type": "application/json",
    "Gh-Token": GH_TOKEN,
    "Gh-Public-Key": GH_PUBLIC_KEY,
  };

  var ghBase = GROUNDHOGG_URL + "/wp-json/gh/v4/contacts";

  var contactPayload = {
    data: {
      email: email,
      first_name: first_name || "",
      last_name: last_name || "",
      optin_status: 2,
    },
    tags: tags,
    meta: {
      source: source || "vibecontrol-landing",
    },
  };

  try {
    // Step 1: Try to create the contact
    var createRes = await fetch(ghBase, {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify(contactPayload),
    });

    if (createRes.ok) {
      var createData = await createRes.json();
      var contactId = (createData.contact && createData.contact.ID) ||
                      (createData.item && createData.item.ID) ||
                      null;
      return jsonResponse({ success: true, id: contactId });
    }

    // Step 2: Create failed (likely contact exists) — look up by email
    var lookupUrl = ghBase + "/" + encodeURIComponent(email);
    var lookupRes = await fetch(lookupUrl, {
      method: "GET",
      headers: ghHeaders,
    });

    if (!lookupRes.ok) {
      return jsonResponse({ error: "Failed to subscribe" }, 502);
    }

    var lookupData = await lookupRes.json();

    // Extract the contact ID from the response
    var existingId = null;
    if (lookupData.contact) {
      existingId = lookupData.contact.ID || lookupData.contact.id;
    } else if (lookupData.item) {
      existingId = lookupData.item.ID || lookupData.item.id;
    } else if (lookupData.ID) {
      existingId = lookupData.ID;
    }

    if (!existingId) {
      return jsonResponse({ error: "Failed to subscribe" }, 502);
    }

    // Step 3: Update the existing contact with tags and data
    var updateUrl = ghBase + "/" + existingId;
    var updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: ghHeaders,
      body: JSON.stringify(contactPayload),
    });

    if (updateRes.ok) {
      return jsonResponse({ success: true, id: existingId });
    }

    // If PATCH fails, try PUT as fallback
    var putRes = await fetch(updateUrl, {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify(contactPayload),
    });

    if (putRes.ok) {
      return jsonResponse({ success: true, id: existingId });
    }

    return jsonResponse({ error: "Failed to update contact" }, 502);
  } catch (err) {
    console.error("Groundhogg request failed:", err);
    return jsonResponse({ error: "Service unavailable" }, 502);
  }
}
