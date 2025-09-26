import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourses = async () => {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/classroom/courses");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al obtener cursos");
        setCourses(data.courses || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [session]);

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
          <span>{session.user?.email}</span>
          <button onClick={() => signOut()}>Cerrar sesión</button>
        </div>
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
        <Link href="/">Inicio</Link>
      </footer>
    </main>
  );
}
