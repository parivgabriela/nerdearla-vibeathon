import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    // List primary calendar events in the next 7 days
    const now = new Date().toISOString();
    const max = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", now);
    url.searchParams.set("timeMax", max);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    return res.status(200).json(data);
  } catch (e) {
    console.error("/api/calendar/events error", e);
    return res.status(500).json({ error: "Failed to fetch calendar events" });
  }
}
