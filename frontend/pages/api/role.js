import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });
  try {
    const backend = process.env.BACKEND_URL || "http://localhost:8000";
    const r = await axios.post(`${backend}/users/resolve`, { email });
    return res.status(200).json(r.data);
  } catch (e) {
    console.error("/api/role error", e?.response?.data || e.message);
    return res.status(500).json({ error: "Failed to resolve role" });
  }
}
