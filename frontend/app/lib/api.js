// lib/api.js
// Axios client with auto token refresh and error handling
// Place this at: app/lib/api.js

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Main axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ── Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, Promise.reject);

// ── Auto refresh on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────
export const authAPI = {
  signupStudent: (data) => api.post("/api/auth/signup-student", data),
  signupHost:    (data) => api.post("/api/auth/signup-host", data),
  login:         (data) => api.post("/api/auth/login", data),
  logout:        (data) => api.post("/api/auth/logout", data),
  refresh:       (token) => api.post("/api/auth/refresh-token", { refreshToken: token }),
};

// ─────────────────────────────────────────────────────────────
// HOSTELS (public)
// ─────────────────────────────────────────────────────────────
export const hostelAPI = {
  list:       (params) => api.get("/api/hostels", { params }),
  detail:     (id)     => api.get(`/api/hostels/${id}`),
  rooms:      (id)     => api.get(`/api/hostels/${id}/rooms`),
  addView:    (id)     => api.post("/api/hostels/increment-views", { hostelId: id }),
};

// ─────────────────────────────────────────────────────────────
// STUDENT
// ─────────────────────────────────────────────────────────────
export const studentAPI = {
  me:             ()       => api.get("/api/students/me"),
  updateProfile:  (data)   => api.put("/api/students/update-profile", data),
  changePassword: (data)   => api.put("/api/students/change-password", data),
  savedHostels:   ()       => api.get("/api/students/saved-hostels"),
  saveHostel:     (id)     => api.post("/api/students/save-hostel", { hostelId: id }),
};

// ─────────────────────────────────────────────────────────────
// HOST
// ─────────────────────────────────────────────────────────────
export const hostAPI = {
  me:           ()         => api.get("/api/hosts/me"),
  myHostels:    ()         => api.get("/api/hosts/my-hostels"),
  addHostel:    (formData) => api.post("/api/hosts/add-hostel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updateHostel: (id, data) => api.put(`/api/hosts/update-hostel/${id}`, data),
  deleteHostel: (id)       => api.delete(`/api/hosts/delete-hostel/${id}`),
  addRoom:      (data)     => api.post("/api/hosts/rooms", data),
  updateRoom:   (id, data) => api.put(`/api/hosts/rooms/${id}`, data),
};

// ─────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────
export const bookingAPI = {
  create:        (data)         => api.post("/api/bookings", data),
  myBookings:    ()             => api.get("/api/bookings/student/me"),
  hostBookings:  ()             => api.get("/api/bookings/host/me"),
  updateStatus:  (id, status)   => api.put(`/api/bookings/${id}/status`, { status }),
};

// ─────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────
export const messageAPI = {
  send:           (data)   => api.post("/api/messages", data),
  conversation:   (userId) => api.get(`/api/messages/conversation/${userId}`),
  inbox:          ()       => api.get("/api/messages/inbox"),
  unreadCount:    ()       => api.get("/api/messages/unread-count"),
};

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:      ()       => api.get("/api/admin/dashboard"),
  pendingHostels: ()       => api.get("/api/admin/hostels/pending"),
  allHostels:     (status) => api.get("/api/admin/hostels", { params: { status } }),
  approve:        (id)     => api.put(`/api/admin/hostels/${id}/approve`),
  reject:         (id, r)  => api.put(`/api/admin/hostels/${id}/reject`, { reason: r }),
  feature:        (id)     => api.put(`/api/admin/hostels/${id}/feature`),
  students:       ()       => api.get("/api/admin/students"),
  hosts:          ()       => api.get("/api/admin/hosts"),
};

export default api;