import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import Skeleton from "../components/Skeleton";

export default function Home() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const resolveRole = async () => {
      if (session?.user?.email) {
        try {
          const res = await axios.post("/api/role", { email: session.user.email });
          // Persist backend user id for Etapa 2 flows (courses/students)
          if (res?.data?.id) {
            try {
              localStorage.setItem("backendUserId", String(res.data.id));
            } catch {}
          }
          setRole(res.data.role);
        } catch (e) {
          console.error("Error resolving role:", e);
        }
      }
    };
    resolveRole();
  }, [session?.user?.email]);

  if (status === "loading") {
    return (
      <main className="container">
        <h1 className="mb-2">Cargando...</h1>
        <Skeleton className="h-5 w-1/2 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-2" />
        <Skeleton className="h-10 w-40" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="container">
        <h1>Semillero Digital Platform</h1>
        <p>Complemento de Google Classroom</p>
        <button onClick={() => signIn("google")}>Ingresar con Google</button>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Bienvenido/a</h1>
      <p>
        {session.user?.name} ({session.user?.email})
      </p>
      <p>Rol: {role || "resolviendo..."}</p>
      <div className="actions">
        <Link href="/dashboard">Ir al Dashboard</Link>
      </div>
    </main>
  );
}

