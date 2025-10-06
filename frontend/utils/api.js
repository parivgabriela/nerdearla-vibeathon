import axios from "axios";

const API_BASE = process.env.BACKEND_URL || "http://localhost:8000";

// Courses API
export const coursesAPI = {
  // Get all courses
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/courses`, { params });
    return response.data;
  },

  // Get course by ID
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/courses/${id}`);
    return response.data;
  },

  // Create course
  create: async (courseData) => {
    const response = await axios.post(`${API_BASE}/courses`, courseData);
    return response.data;
  },

  // Update course
  update: async (id, courseData) => {
    const response = await axios.put(`${API_BASE}/courses/${id}`, courseData);
    return response.data;
  },

  // Delete course (soft delete)
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE}/courses/${id}`);
    return response.data;
  },
};

// Enrollments API
export const enrollmentsAPI = {
  // Get all enrollments
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/enrollments`, { params });
    return response.data;
  },

  // Get enrollment by ID
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/enrollments/${id}`);
    return response.data;
  },

  // Enroll student in course
  enroll: async (enrollmentData) => {
    const response = await axios.post(`${API_BASE}/enrollments`, enrollmentData);
    return response.data;
  },

  // Unenroll student from course
  unenroll: async (id) => {
    const response = await axios.delete(`${API_BASE}/enrollments/${id}`);
    return response.data;
  },
};

// Assignments API
export const assignmentsAPI = {
  // Get all assignments
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/assignments`, { params });
    return response.data;
  },

  // Get assignment by ID
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/assignments/${id}`);
    return response.data;
  },

  // Create assignment
  create: async (assignmentData) => {
    const response = await axios.post(`${API_BASE}/assignments`, assignmentData);
    return response.data;
  },

  // Update assignment
  update: async (id, assignmentData) => {
    const response = await axios.put(`${API_BASE}/assignments/${id}`, assignmentData);
    return response.data;
  },

  // Delete assignment (soft delete)
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE}/assignments/${id}`);
    return response.data;
  },
};

// Submissions API
export const submissionsAPI = {
  // Get all submissions
  getAll: async (params = {}) => {
    // sanitize query params: remove empty strings and coerce numeric-like values
    const sanitized = Object.fromEntries(
      Object.entries(params)
        .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => {
          if (typeof v === "string" && /^\d+$/.test(v)) return [k, Number(v)];
          return [k, v];
        })
    );
    const response = await axios.get(`${API_BASE}/assignments/submissions`, { params: sanitized });
    return response.data;
  },

  // Get submission by ID
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/assignments/submissions/${id}`);
    return response.data;
  },

  // Create submission
  create: async (submissionData) => {
    const response = await axios.post(`${API_BASE}/assignments/submissions`, submissionData);
    return response.data;
  },

  // Update submission (for grading)
  update: async (id, submissionData) => {
    const response = await axios.put(`${API_BASE}/assignments/submissions/${id}`, submissionData);
    return response.data;
  },

  // Delete submission
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE}/assignments/submissions/${id}`);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  // List notifications
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/notifications`, { params });
    return response.data;
  },
  // Create notification
  create: async (payload) => {
    const response = await axios.post(`${API_BASE}/notifications`, payload);
    return response.data;
  },
  // Update notification
  update: async (id, payload) => {
    const response = await axios.put(`${API_BASE}/notifications/${id}`, payload);
    return response.data;
  },
  // Mark as read/unread
  markRead: async (id, is_read = true) => {
    const response = await axios.patch(`${API_BASE}/notifications/${id}/read`, { is_read });
    return response.data;
  },
  // Delete notification
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE}/notifications/${id}`);
    return response.data;
  },
  // Upcoming alerts (non-persistent)
  upcomingAlerts: async (user_id, within_hours = 48) => {
    const response = await axios.get(`${API_BASE}/notifications/alerts/upcoming`, {
      params: { user_id, within_hours },
    });
    return response.data;
  },
  // Overdue alerts (non-persistent)
  overdueAlerts: async (user_id) => {
    const response = await axios.get(`${API_BASE}/notifications/alerts/overdue`, {
      params: { user_id },
    });
    return response.data;
  },
};

// Announcements API
export const announcementsAPI = {
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/announcements`, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/announcements/${id}`);
    return response.data;
  },
  create: async (payload) => {
    const response = await axios.post(`${API_BASE}/announcements`, payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await axios.put(`${API_BASE}/announcements/${id}`, payload);
    return response.data;
  },
  deactivate: async (id) => {
    const response = await axios.delete(`${API_BASE}/announcements/${id}`);
    return response.data;
  },
};
