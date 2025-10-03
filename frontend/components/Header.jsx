import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { notificationsAPI } from "../utils/api";
import Button from "./Button";

export default function Header() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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
    const id = setInterval(load, 90000);
    return () => clearInterval(id);
  }, [session?.user?.email]);

  const userLabel = session?.user?.name || session?.user?.email || "Usuario";
  const initial = userLabel.charAt(0).toUpperCase();

  return (
    <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-link">Inicio</Link>
          <Link href="/dashboard" className="btn-link">Dashboard</Link>
          <Link href="/notifications" className="btn-link relative">
            Notificaciones
            {count ? (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-2 py-0.5">{count}</span>
            ) : null}
          </Link>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 hover:bg-white/15"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white font-semibold">{initial}</span>
            <span className="text-sm text-[var(--text)] hidden sm:inline">{userLabel}</span>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] rounded-lg bg-[var(--card)]/95 p-2 shadow-xl ring-1 ring-white/10 backdrop-blur z-50 max-h-[min(60vh,20rem)] overflow-auto"
              role="menu"
              aria-orientation="vertical"
            >
              <Link href="/" className="block rounded-md px-3 py-2 text-sm hover:bg-white/10 focus:bg-white/10 focus:outline-none">Inicio</Link>
              <Link href="/dashboard" className="block rounded-md px-3 py-2 text-sm hover:bg-white/10 focus:bg-white/10 focus:outline-none">Dashboard</Link>
              <button className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-white/10 focus:bg-white/10 focus:outline-none" onClick={() => signOut()}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
