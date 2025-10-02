import "../styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { notificationsAPI } from "../utils/api";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <HeaderGlobal />
      <Component {...pageProps} />
    </SessionProvider>
  );
}

function HeaderGlobal() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        let uid = null;
        try {
          const stored = localStorage.getItem("backendUserId");
          if (stored) uid = parseInt(stored);
        } catch {}
        if (!uid) return;
        const notifs = await notificationsAPI.getAll({ user_id: uid, is_read: false });
        setCount(Array.isArray(notifs) ? notifs.length : 0);
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 90000); // refresh cada 90s
    return () => clearInterval(id);
  }, [session?.user?.email]);

  return (
    <div className="header" style={{ padding: "8px 12px", background: "#0f172a" }}>
      <div className="nav">
        <Link href="/" className="btn-link">Inicio</Link>
        <Link href="/dashboard" className="btn-link">Dashboard</Link>
        <Link href="/notifications" className="btn-link">{`Notificaciones${count ? ` (${count})` : ""}`}</Link>
      </div>
      <div className="row">
        <span className="muted">{session?.user?.email || "No autenticado"}</span>
        {session?.user?.email && (
          <button onClick={() => signOut()}>Cerrar sesión</button>
        )}
      </div>
    </div>
  );
}
