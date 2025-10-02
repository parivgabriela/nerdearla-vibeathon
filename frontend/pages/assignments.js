import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { coursesAPI, assignmentsAPI, submissionsAPI } from "../utils/api";

export default function Assignments() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_id: "",
    due_date: "",
    max_score: "",
  });

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [coursesData, assignmentsData, submissionsData] = await Promise.all([
        coursesAPI.getAll(),
        assignmentsAPI.getAll(),
        submissionsAPI.getAll(),
      ]);
      setCourses(coursesData);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const assignmentData = {
        ...formData,
        course_id: parseInt(formData.course_id),
        max_score: formData.max_score ? parseFloat(formData.max_score) : null,
        due_date: formData.due_date || null,
      };
      await assignmentsAPI.create(assignmentData);
      setShowCreateForm(false);
      setFormData({ title: "", description: "", course_id: "", due_date: "", max_score: "" });
      loadData();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al crear tarea");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const assignmentData = {
        ...formData,
        max_score: formData.max_score ? parseFloat(formData.max_score) : null,
        due_date: formData.due_date || null,
      };
      await assignmentsAPI.update(editingAssignment.id, assignmentData);
      setEditingAssignment(null);
      setFormData({ title: "", description: "", course_id: "", due_date: "", max_score: "" });
      loadData();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al actualizar tarea");
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;
    try {
      await assignmentsAPI.delete(assignmentId);
      loadData();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al eliminar tarea");
    }
  };

  const startEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      course_id: assignment.course_id.toString(),
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : "",
      max_score: assignment.max_score ? assignment.max_score.toString() : "",
    });
  };

  const cancelEdit = () => {
    setEditingAssignment(null);
    setFormData({ title: "", description: "", course_id: "", due_date: "", max_score: "" });
  };

  const getCourseAssignments = (courseId) => {
    return assignments.filter((assignment) => assignment.course.id === courseId);
  };

  const getAssignmentSubmissions = (assignmentId) => {
    return submissions.filter((submission) => submission.assignment.id === assignmentId);
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
        <h1>Gestión de Tareas</h1>
        <div>
          <span>{session.user?.email}</span>
          <Link href="/courses">Cursos</Link>
          <Link href="/students">Estudiantes</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </header>

      <section>
        <div className="actions">
          <button onClick={() => setShowCreateForm(true)}>
            Crear Nueva Tarea
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {loading && <p>Cargando datos...</p>}

        {/* Create Assignment Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="form">
            <h3>Crear Tarea</h3>
            <div>
              <label>Título:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <label>Curso:</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                required
              >
                <option value="">Seleccionar curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Fecha de Entrega:</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <label>Puntuación Máxima:</label>
              <input
                type="number"
                step="0.1"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
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

        {/* Edit Assignment Form */}
        {editingAssignment && (
          <form onSubmit={handleUpdate} className="form">
            <h3>Editar Tarea</h3>
            <div>
              <label>Título:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <label>Curso:</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                required
              >
                <option value="">Seleccionar curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Fecha de Entrega:</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <label>Puntuación Máxima:</label>
              <input
                type="number"
                step="0.1"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
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

        {/* Assignments by Course */}
        <div className="courses-assignments">
          {courses.map((course) => {
            const courseAssignments = getCourseAssignments(course.id);
            return (
              <div key={course.id} className="course-assignments-card">
                <h3>{course.name}</h3>
                <p className="course-description">{course.description || "Sin descripción"}</p>

                <h4>Tareas ({courseAssignments.length})</h4>
                {courseAssignments.length === 0 ? (
                  <p className="no-assignments">No hay tareas asignadas</p>
                ) : (
                  <div className="assignments-list">
                    {courseAssignments.map((assignment) => {
                      const assignmentSubmissions = getAssignmentSubmissions(assignment.id);
                      return (
                        <div key={assignment.id} className="assignment-card">
                          <div className="assignment-header">
                            <h5>{assignment.title}</h5>
                            <div className="assignment-actions">
                              <button onClick={() => startEdit(assignment)}>Editar</button>
                              <button onClick={() => handleDelete(assignment.id)}>Eliminar</button>
                            </div>
                          </div>
                          <p className="assignment-description">{assignment.description || "Sin descripción"}</p>
                          <div className="assignment-meta">
                            <span>Entregas: {assignmentSubmissions.length}</span>
                            {assignment.due_date && (
                              <span>Vencimiento: {new Date(assignment.due_date).toLocaleDateString()}</span>
                            )}
                            {assignment.max_score && (
                              <span>Puntuación: {assignment.max_score}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
