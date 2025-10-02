import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { notificationsAPI } from "../utils/api";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadCourses = async () => {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/classroom/courses");
        const data = await res.json();
        if (!res.ok) {
          const apiErr = data?.error;
          const msg = typeof apiErr === "string" ? apiErr : (apiErr?.message || "Error al obtener cursos");
          throw new Error(msg);
        }
        setCourses(data.courses || []);
      } catch (e) {
        const msg = typeof e === "string" ? e : (e?.message || e?.toString?.() || "Error al obtener cursos");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [session]);

  useEffect(() => {
    const resolveRole = async () => {
      if (!session?.user?.email) return;
      try {
        const res = await fetch("/api/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data?.id) {
            try {
              localStorage.setItem("backendUserId", String(data.id));
              setUserId(data.id);
            } catch {}
          }
          if (data?.role) setRole(data.role);
        }
      } catch (e) {
        // silencioso: el dashboard sigue funcionando sin rol
      }
    };
    resolveRole();
  }, [session?.user?.email]);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        let uid = userId;
        if (!uid) {
          const stored = localStorage.getItem("backendUserId");
          if (stored) uid = parseInt(stored);
        }
        if (!uid) return;
        const notifs = await notificationsAPI.getAll({ user_id: uid, is_read: false });
        setUnreadCount(Array.isArray(notifs) ? notifs.length : 0);
      } catch {
        // ignorar
      }
    };
    loadUnread();
  }, [userId]);

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
      <header className="header">
        <h1>Dashboard</h1>
        <div>
          <span className="muted"> · Rol: {role || "resolviendo..."}</span>
        </div>
        <nav className="nav">
          <Link href="/courses" className="btn-link">Cursos</Link>
          <Link href="/students" className="btn-link">Estudiantes</Link>
          <Link href="/assignments" className="btn-link">Tareas</Link>
          <Link href="/notifications" className="btn-link">{`Notificaciones${unreadCount ? ` (${unreadCount})` : ""}`}</Link>
        </nav>
      </header>

      <section>
        <h2>Cursos (Google Classroom)</h2>
        {loading && <p>Cargando cursos...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && (
          <ul className="list">
            {courses.length === 0 && <li>No se encontraron cursos</li>}
            {courses.map((c) => (
              <li key={c.id} className="list-item">
                <strong>{c.name}</strong>
                <div className="muted">ID: {c.id}</div>
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
