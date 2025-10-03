import Link from "next/link";
import { useRouter } from "next/router";

export default function InPageMenu() {
  const router = useRouter();
  const path = router.pathname;

  const items = [
    { href: "/courses", label: "Cursos" },
    { href: "/students", label: "Estudiantes" },
    { href: "/assignments", label: "Tareas" },
    { href: "/notifications", label: "Notificaciones" },
  ];

  return (
    <nav className="w-full">
      <div className="flex justify-end">
        <div className="min-w-0 max-w-full overflow-x-auto">
          <div className="flex items-center gap-2">
            {items.map((it) => {
              const active = path === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "btn-link whitespace-nowrap transition " +
                    (active ? "!bg-accent !text-white" : "")
                  }
                  aria-current={active ? "page" : undefined}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
