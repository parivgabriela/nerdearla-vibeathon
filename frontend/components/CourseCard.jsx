import Button from "./Button";
import Card from "./Card";

export default function CourseCard({ course, onEdit, onDelete }) {
  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{course.name}</h3>
          <p className="text-[var(--muted)]">{course.description || "Sin descripción"}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            <span>Profesor: {course.teacher.email}</span>
            <span>Estudiantes: {course.enrollment_count}</span>
            <span>Tareas: {course.assignment_count}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onEdit(course)}>Editar</Button>
          <Button variant="danger" onClick={() => onDelete(course.id)}>Eliminar</Button>
        </div>
      </div>
    </Card>
  );
}
