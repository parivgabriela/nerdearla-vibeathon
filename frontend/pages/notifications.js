import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { notificationsAPI, announcementsAPI } from "../utils/api";
import InPageMenu from "../components/InPageMenu";

export default function NotificationsCenter() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const id = localStorage.getItem("backendUserId");
      if (id) setUserId(parseInt(id));
    } catch {}
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      if (!session || !userId) return;
      setLoading(true);
      setError(null);
      try {
        const [notifs, ups, ovs, anns, cal] = await Promise.all([
          notificationsAPI.getAll({ user_id: userId }),
          notificationsAPI.upcomingAlerts(userId, 72),
          notificationsAPI.overdueAlerts(userId),
          announcementsAPI.getAll({ is_active: true }),
          fetch("/api/calendar/events").then((r) => r.json()),
        ]);
        setNotifications(notifs || []);
        setAlerts(ups || []);
        setOverdue(ovs || []);
        setAnnouncements(anns || []);
        setEvents(Array.isArray(cal?.items) ? cal.items : []);
      } catch (e) {
        setError(e?.response?.data?.detail || e?.message || "Error al cargar notificaciones");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [session, userId]);

  const handleMarkRead = async (id, is_read) => {
    try {
      await notificationsAPI.markRead(id, is_read);
      setNotifications((items) => items.map((n) => (n.id === id ? { ...n, is_read } : n)));
    } catch (e) {
      setError(e?.response?.data?.detail || "No se pudo actualizar la notificación");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar notificación?")) return;
    try {
      await notificationsAPI.delete(id);
      setNotifications((items) => items.filter((n) => n.id !== id));
    } catch (e) {
      setError(e?.response?.data?.detail || "No se pudo eliminar la notificación");
    }
  };

  if (status === "loading") return <p>Cargando...</p>;
  if (!session)
    return (
      <main className="container">
        <p>No autenticado.</p>
        <Link href="/">Volver al inicio</Link>
      </main>
    );

  return (
    <main className="container">
      <div className="flex justify-end mb-3">
        <InPageMenu />
      </div>
      <header className="header">
        <h1>Centro de Notificaciones</h1>
      </header>

      {error && <p className="error">{error}</p>}
      {loading && <p>Cargando...</p>}

      <section>
        <h2>Anuncios Importantes</h2>
        {announcements.length === 0 ? (
          <p>No hay anuncios activos</p>
        ) : (
          <ul className="list">
            {announcements.map((a) => (
              <li key={a.id} className="list-item">
                <strong>{a.title}</strong>
                <div className="muted">
                  Publicado: {new Date(a.created_at).toLocaleString()}
                </div>
                {a.content && <p>{a.content}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Alertas de Entregas Próximas (72h)</h2>
        {alerts.length === 0 ? (
          <p>No hay alertas próximas</p>
        ) : (
          <ul className="list">
            {alerts.map((n, idx) => (
              <li key={`alert-${idx}`} className="list-item">
                <strong>{n.title}</strong>
                {n.due_date && (
                  <div className="muted">Vence: {new Date(n.due_date).toLocaleString()}</div>
                )}
                {n.content && <p>{n.content}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Entregas Vencidas</h2>
        {overdue.length === 0 ? (
          <p>No hay entregas vencidas</p>
        ) : (
          <ul className="list">
            {overdue.map((n, idx) => (
              <li key={`overdue-${idx}`} className="list-item">
                <strong>{n.title}</strong>
                {n.due_date && (
                  <div className="muted">Venció: {new Date(n.due_date).toLocaleString()}</div>
                )}
                {n.content && <p>{n.content}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Eventos de Google Calendar (7 días)</h2>
        {events.length === 0 ? (
          <p>No hay eventos próximos</p>
        ) : (
          <ul className="list">
            {events.map((ev) => {
              const start = ev.start?.dateTime || ev.start?.date;
              const end = ev.end?.dateTime || ev.end?.date;
              return (
                <li key={ev.id} className="list-item">
                  <strong>{ev.summary || "(Sin título)"}</strong>
                  <div className="muted">
                    {start ? new Date(start).toLocaleString() : ""}
                    {end ? ` - ${new Date(end).toLocaleString()}` : ""}
                  </div>
                  {ev.description && <p>{ev.description}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2>Mis Notificaciones</h2>
        {notifications.length === 0 ? (
          <p>No tienes notificaciones</p>
        ) : (
          <ul className="list">
            {notifications.map((n) => (
              <li key={n.id} className="list-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{n.title}</strong>
                    <div className="muted">
                      {new Date(n.created_at).toLocaleString()} • {n.category}
                      {n.is_read ? " • Leída" : " • No leída"}
                    </div>
                    {n.content && <p>{n.content}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!n.is_read ? (
                      <button onClick={() => handleMarkRead(n.id, true)}>Marcar leída</button>
                    ) : (
                      <button onClick={() => handleMarkRead(n.id, false)}>Marcar no leída</button>
                    )}
                    <button onClick={() => handleDelete(n.id)}>Eliminar</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer>
        <Link href="/" className="btn-link">Inicio</Link>
      </footer>
    </main>
  );
}
