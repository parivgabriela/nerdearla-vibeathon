import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { coursesAPI } from "../utils/api";

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

  const handleDelete = async (courseId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este curso?")) return;
    try {
      await coursesAPI.delete(courseId);
      loadCourses();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al eliminar curso");
    }
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

  if (status === "loading") return <p>Cargando...</p>;
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
        <div>
          <span>{session.user?.email}</span>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </header>

      <section>
        <div className="actions">
          <button onClick={() => setShowCreateForm(true)}>
            Crear Nuevo Curso
          </button>
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
        <div className="courses-list">
          <h2>Cursos</h2>
          {courses.length === 0 && !loading && <p>No hay cursos disponibles</p>}
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <h3>{course.name}</h3>
                <div className="course-actions">
                  <button onClick={() => startEdit(course)}>Editar</button>
                  <button onClick={() => handleDelete(course.id)}>Eliminar</button>
                </div>
              </div>
              <p className="course-description">{course.description || "Sin descripción"}</p>
              <div className="course-meta">
                <span>Profesor: {course.teacher.email}</span>
                <span>Estudiantes: {course.enrollment_count}</span>
                <span>Tareas: {course.assignment_count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
