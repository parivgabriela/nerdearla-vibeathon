import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import InPageMenu from "../components/InPageMenu";
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

  const normalizeError = (e) => {
    try {
      const detail = e?.response?.data?.detail ?? e?.data?.detail;
      if (detail) {
        if (typeof detail === "string") return detail;
        if (Array.isArray(detail)) {
          const msgs = detail
            .map((d) => (d && typeof d === "object" ? d.msg || d.message : d))
            .filter(Boolean);
          if (msgs.length) return msgs.join(" | ");
          return JSON.stringify(detail);
        }
        if (typeof detail === "object") {
          if (detail.msg || detail.message) return detail.msg || detail.message;
          return JSON.stringify(detail);
        }
        return String(detail);
      }
      if (e?.message) return e.message;
      return "Error inesperado";
    } catch {
      return "Error inesperado";
    }
  };

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
      setError(normalizeError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Validate course_id is present and a valid integer
      const parsedCourseId = parseInt(formData.course_id, 10);
      if (!formData.course_id || Number.isNaN(parsedCourseId)) {
        setError("Debes seleccionar un curso válido.");
        return;
      }

      const assignmentData = {
        ...formData,
        course_id: parsedCourseId,
        max_score: formData.max_score ? parseFloat(formData.max_score) : null,
        due_date: formData.due_date || null,
      };
      await assignmentsAPI.create(assignmentData);
      setShowCreateForm(false);
      setFormData({ title: "", description: "", course_id: "", due_date: "", max_score: "" });
      loadData();
    } catch (e) {
      setError(normalizeError(e));
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
      setError(normalizeError(e));
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;
    try {
      await assignmentsAPI.delete(assignmentId);
      loadData();
    } catch (e) {
      setError(normalizeError(e));
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
      <div className="flex justify-end mb-3">
        <InPageMenu />
      </div>
      <header className="header">
        <h1>Gestión de Tareas</h1>
        <div>
          <span>{session.user?.email}</span>
        </div>
      </header>

      <section>
        <div className="actions">
          <button onClick={() => setShowCreateForm(true)}>
            Crear Nueva Tarea
          </button>
        </div>

        {error && <p className="error">{String(error)}</p>}

        {loading && <p>Cargando datos...</p>}

        {/* Create Assignment Form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="form" aria-labelledby="create-assignment-title">
            <h3 id="create-assignment-title">Crear Tarea</h3>
            <p className="form-subtitle">Completa los campos para crear una nueva tarea para un curso.</p>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="title">Título</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Ej: Trabajo Práctico 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <small className="helper">Un nombre breve y claro para la tarea.</small>
              </div>

              <div className="form-field">
                <label htmlFor="course_id">Curso</label>
                <select
                  id="course_id"
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
                <small className="helper">Selecciona el curso al que pertenece la tarea.</small>
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  placeholder="Instrucciones, criterios de evaluación, recursos, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="form-field">
                <label htmlFor="due_date">Fecha de Entrega</label>
                <input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
                <small className="helper">Opcional. Si se define, se mostrará como vencimiento.</small>
              </div>

              <div className="form-field">
                <label htmlFor="max_score">Puntuación Máxima</label>
                <input
                  id="max_score"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 10"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                />
                <small className="helper">Opcional. Valor máximo que puede obtenerse.</small>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Crear tarea</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Edit Assignment Form */}
        {editingAssignment && (
          <form onSubmit={handleUpdate} className="form" aria-labelledby="edit-assignment-title">
            <h3 id="edit-assignment-title">Editar Tarea</h3>
            <p className="form-subtitle">Actualiza los datos y guarda los cambios.</p>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="title-edit">Título</label>
                <input
                  id="title-edit"
                  type="text"
                  placeholder="Ej: Trabajo Práctico 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="course_id-edit">Curso</label>
                <select
                  id="course_id-edit"
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

              <div className="form-field form-field-full">
                <label htmlFor="description-edit">Descripción</label>
                <textarea
                  id="description-edit"
                  placeholder="Instrucciones, criterios de evaluación, recursos, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="form-field">
                <label htmlFor="due_date-edit">Fecha de Entrega</label>
                <input
                  id="due_date-edit"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="max_score-edit">Puntuación Máxima</label>
                <input
                  id="max_score-edit"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 10"
                  value={formData.max_score}
                  onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Actualizar</button>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
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
      <style jsx>{`
        .actions button {
          background: #111827;
          color: #fff;
          border: none;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
        }
        .form {
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .form h3 {
          margin: 0 0 4px;
        }
        .form-subtitle {
          margin: 0 0 12px;
          color: #6b7280;
          font-size: 0.95rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px 16px;
        }
        @media (min-width: 720px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
          .form-field-full {
            grid-column: 1 / -1;
          }
        }
        .form-field label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .form-field input,
        .form-field select,
        .form-field textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.95rem;
          outline: none;
          background: #fff;
        }
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        .helper {
          display: block;
          color: #6b7280;
          font-size: 0.85rem;
          margin-top: 6px;
        }
        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .btn {
          appearance: none;
          border-radius: 8px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-primary {
          background: #2563eb;
          color: #fff;
          border: 1px solid #2563eb;
        }
        .btn-primary:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }
        .btn-ghost {
          background: transparent;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .btn-ghost:hover {
          background: #f9fafb;
        }
        .assignment-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
        }
        .assignment-header h5 {
          margin: 0;
        }
      `}</style>
    </main>
  );
}
