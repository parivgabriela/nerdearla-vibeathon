import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { coursesAPI, enrollmentsAPI } from "../utils/api";

export default function Students() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollFormData, setEnrollFormData] = useState({
    student_id: "",
    course_id: "",
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    try {
      const id = localStorage.getItem("backendUserId");
      if (id) {
        setCurrentUserId(parseInt(id));
        setEnrollFormData((f) => ({ ...f, student_id: id }));
      }
    } catch {}
    loadData();
  }, [session]);

  const loadData = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [coursesData, enrollmentsData] = await Promise.all([
        coursesAPI.getAll(),
        enrollmentsAPI.getAll(),
      ]);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      const sid = parseInt(enrollFormData.student_id) || currentUserId;
      if (!sid) throw new Error("Falta el ID de estudiante (backendUserId)");
      await enrollmentsAPI.enroll({
        student_id: sid,
        course_id: parseInt(enrollFormData.course_id),
      });
      setShowEnrollForm(false);
      setEnrollFormData({ student_id: "", course_id: "" });
      loadData();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al inscribir estudiante");
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    if (!confirm("¿Estás seguro de que deseas desinscribir a este estudiante?")) return;
    try {
      await enrollmentsAPI.unenroll(enrollmentId);
      loadData();
    } catch (e) {
      setError(e.response?.data?.detail || "Error al desinscribir estudiante");
    }
  };

  const getCourseEnrollments = (courseId) => {
    return enrollments.filter((enrollment) => enrollment.course.id === courseId);
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
        <h1>Gestión de Estudiantes</h1>
        <div>
          <span>{session.user?.email}</span>
          <Link href="/courses">Cursos</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </header>

      <section>
        <div className="actions">
          <button onClick={() => setShowEnrollForm(true)}>
            Inscribir Estudiante
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {loading && <p>Cargando datos...</p>}

        {/* Enroll Student Form */}
        {showEnrollForm && (
          <form onSubmit={handleEnroll} className="form">
            <h3>Inscribir Estudiante</h3>
            <div>
              <label>ID del Estudiante:</label>
              <input
                type="number"
                value={enrollFormData.student_id}
                onChange={(e) => setEnrollFormData({ ...enrollFormData, student_id: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Curso:</label>
              <select
                value={enrollFormData.course_id}
                onChange={(e) => setEnrollFormData({ ...enrollFormData, course_id: e.target.value })}
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
            <div className="form-actions">
              <button type="submit">Inscribir</button>
              <button type="button" onClick={() => setShowEnrollForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Courses and Students */}
        <div className="courses-students">
          {courses.map((course) => {
            const courseEnrollments = getCourseEnrollments(course.id);
            return (
              <div key={course.id} className="course-students-card">
                <h3>{course.name}</h3>
                <p className="course-description">{course.description || "Sin descripción"}</p>
                <p className="course-teacher">Profesor: {course.teacher.email}</p>

                <h4>Estudiantes Inscritos ({courseEnrollments.length})</h4>
                {courseEnrollments.length === 0 ? (
                  <p className="no-students">No hay estudiantes inscritos</p>
                ) : (
                  <ul className="students-list">
                    {courseEnrollments.map((enrollment) => (
                      <li key={enrollment.id} className="student-item">
                        <div className="student-info">
                          <span className="student-email">{enrollment.student.email}</span>
                          <span className="student-role">({enrollment.student.role})</span>
                        </div>
                        <button
                          onClick={() => handleUnenroll(enrollment.id)}
                          className="unenroll-btn"
                        >
                          Desinscribir
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
