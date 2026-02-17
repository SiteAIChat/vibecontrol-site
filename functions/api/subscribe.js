export async function onRequestPost(context) {
  const { request, env } = context;

  const GROUNDHOGG_URL = env.GROUNDHOGG_URL;
  const GH_PUBLIC_KEY = env.GH_PUBLIC_KEY;
  const GH_TOKEN = env.GH_TOKEN;

  // Helper to return JSON responses safely
  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
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

  var debug = [];

  try {
    // Step 1: Look up contact by email
    var lookupUrl = ghBase + "?id_or_email=" + encodeURIComponent(email) + "&by_user_id=false";
    var lookupRes = await fetch(lookupUrl, {
      method: "GET",
      headers: ghHeaders,
    });
    var lookupText = await lookupRes.text();

    debug.push({
      step: "lookup",
      status: lookupRes.status,
      body: lookupText.substring(0, 1500),
    });

    var existingId = null;

    if (lookupRes.ok) {
      try {
        var lookupData = JSON.parse(lookupText);
        // V4 may return { items: [...] } or { contacts: { id: {...} } }
        if (lookupData.items && Array.isArray(lookupData.items) && lookupData.items.length > 0) {
          existingId = lookupData.items[0].ID || lookupData.items[0].id;
        } else if (lookupData.contacts) {
          var ids = Object.keys(lookupData.contacts);
          if (ids.length > 0) {
            existingId = ids[0];
          }
        } else if (lookupData.contact) {
          existingId = lookupData.contact.ID || lookupData.contact.id;
        }
        debug.push({ step: "lookup_parsed", existingId: existingId, topKeys: Object.keys(lookupData) });
      } catch (parseErr) {
        debug.push({ step: "lookup_parse_error", message: parseErr.message });
      }
    }

    if (existingId) {
      // Step 2a: Contact exists — update via PATCH
      var updateUrl = ghBase + "/" + existingId;
      var updateRes = await fetch(updateUrl, {
        method: "PATCH",
        headers: ghHeaders,
        body: JSON.stringify(contactPayload),
      });
      var updateText = await updateRes.text();

      debug.push({
        step: "update",
        url: updateUrl,
        status: updateRes.status,
        body: updateText.substring(0, 1500),
      });

      if (updateRes.ok) {
        return jsonResponse({ success: true, id: existingId, debug: debug });
      }

      return jsonResponse({ error: "Failed to update contact", debug: debug }, 502);
    }

    // Step 2b: Contact doesn't exist — create
    var createRes = await fetch(ghBase, {
      method: "POST",
      headers: ghHeaders,
      body: JSON.stringify(contactPayload),
    });
    var createText = await createRes.text();

    debug.push({
      step: "create",
      status: createRes.status,
      body: createText.substring(0, 1500),
    });

    if (createRes.ok) {
      var contactId = null;
      try {
        var createData = JSON.parse(createText);
        contactId = (createData.contact && createData.contact.ID) ||
                    (createData.item && createData.item.ID) ||
                    null;
      } catch (e) {
        // ignore parse errors
      }
      return jsonResponse({ success: true, id: contactId, debug: debug });
    }

    return jsonResponse({ error: "Failed to create contact", debug: debug }, 502);
  } catch (err) {
    debug.push({ step: "exception", message: err.message });
    return jsonResponse({ error: "Service unavailable", debug: debug }, 502);
  }
}
