import { getStore } from "@netlify/blobs";

const json = (o, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const store = getStore({ name: "gangfund", consistency: "strong" });

  // Anyone can read
  if (req.method === "GET") {
    const data = await store.get("state", { type: "json" });
    return json(data || {});
  }

  // Only the admin password can write
  if (req.method === "POST") {
    const pw = process.env.ADMIN_PASSWORD || "1337";
    if (req.headers.get("x-admin-password") !== pw) return json({ error: "unauthorized" }, 401);

    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }

    if (body.check) return json({ ok: true }); // used by the login screen

    const s = body.state;
    if (!s || typeof s !== "object" || !Array.isArray(s.members) || typeof s.paid !== "object")
      return json({ error: "bad state" }, 400);

    await store.setJSON("state", s);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/data" };
