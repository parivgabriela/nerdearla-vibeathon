import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { coursesAPI } from "../utils/api";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import ConfirmModal from "../components/ConfirmModal";
import CourseCard from "../components/CourseCard";

export default function Courses() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teacher_id: "",
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  useEffect(() => {
    // Load backend user id stored in index.js
    try {
      const id = localStorage.getItem("backendUserId");
      if (id) setCurrentUserId(parseInt(id));
    } catch {}
    loadCourses();
  }, [session]);

  const loadCourses = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const data = await coursesAPI.getAll();
      setCourses(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar cursos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const teacherId = parseInt(formData.teacher_id) || currentUserId;
      if (!teacherId) throw new Error("Falta el ID del profesor (backendUserId)");
      await coursesAPI.create({
        ...formData,
        teacher_id: teacherId,
      });
      setShowCreateForm(false);
      setFormData({ name: "", description: "", teacher_id: "" });
      loadCourses();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al crear curso");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.update(editingCourse.id, formData);
      setEditingCourse(null);
      setFormData({ name: "", description: "", teacher_id: "" });
      loadCourses();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al actualizar curso");
    }
  };

  const requestDelete = (courseId) => {
    setToDeleteId(courseId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDeleteId) return;
    try {
      await coursesAPI.delete(toDeleteId);
      setConfirmOpen(false);
      setToDeleteId(null);
      loadCourses();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al eliminar curso");
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setToDeleteId(null);
  };

  const startEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || "",
      teacher_id: (course.teacher_id || currentUserId || "").toString(),
    });
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setFormData({ name: "", description: "", teacher_id: "" });
  };

  if (status === "loading") return (
    <main className="container">
      <h1 className="mb-4">Gestión de Cursos</h1>
      <div className="grid gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </main>
  );
  if (!session) {
    return (
      <main className="container">
        <p>No autenticado.</p>
        <Link href="/">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Gestión de Cursos</h1>
      </header>

      <section>
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowCreateForm(true)}>Crear Nuevo Curso</Button>
        </div>

        {error && <p className="error">{error}</p>}

        {loading && <p>Cargando cursos...</p>}

        {/* Create Course Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="form">
            <h3>Crear Curso</h3>
            <div>
              <label>Nombre del Curso:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Descripción:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label>ID del Profesor:</label>
              <input
                type="number"
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                placeholder={session.user.id.toString()}
              />
            </div>
            <div className="form-actions">
              <button type="submit">Crear</button>
              <button type="button" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Edit Course Form */}
        {editingCourse && (
          <form onSubmit={handleUpdate} className="form">
            <h3>Editar Curso</h3>
            <div>
              <label>Nombre del Curso:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Descripción:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label>ID del Profesor:</label>
              <input
                type="number"
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit">Actualizar</button>
              <button type="button" onClick={cancelEdit}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Courses List */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Cursos</h2>
          {loading && (
            <div className="grid gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {!loading && courses.length === 0 && (
            <EmptyState
              title="No hay cursos disponibles"
              description="Crea tu primer curso para comenzar a gestionar estudiantes y tareas."
              actionLabel="Crear Curso"
              onAction={() => setShowCreateForm(true)}
            />
          )}
          {!loading && courses.length > 0 && (
            <div className="grid gap-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onEdit={startEdit} onDelete={requestDelete} />
              ))}
            </div>
          )}
        </div>
      </section>
      <ConfirmModal
        open={confirmOpen}
        title="Eliminar curso"
        description="Esta acción eliminará el curso. ¿Deseas continuar?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </main>
  );
}
