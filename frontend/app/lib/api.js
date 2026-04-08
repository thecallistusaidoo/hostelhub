// lib/api.js  — every API call in the app goes through here. No mock data.
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Token helpers ─────────────────────────────────────────────────────────────
const getToken  = () => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
const getRefresh = () => (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null);
const getUser   = () => {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("user");
  return s ? JSON.parse(s) : null;
};
const setTokens = (access, refresh) => {
  localStorage.setItem("accessToken", access);
  if (refresh) localStorage.setItem("refreshToken", refresh);
};
const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

// ── Core fetch with auto-refresh ──────────────────────────────────────────────
let refreshing = null;

async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...opts.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${BASE}${path}`, { ...opts, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefresh()) {
    if (!refreshing) {
      refreshing = fetch(`${BASE}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: getRefresh() }),
      }).then(async r => {
        if (!r.ok) { clearAuth(); window.location.href = "/login"; return null; }
        const d = await r.json();
        setTokens(d.accessToken, null);
        return d.accessToken;
      }).finally(() => { refreshing = null; });
    }
    const newToken = await refreshing;
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${BASE}${path}`, { ...opts, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }

  // Handle no-content responses
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ── File upload (multipart) ───────────────────────────────────────────────────
async function apiUpload(path, formData) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message || "Upload failed");
  }
  return res.json();
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const auth = {
  signupStudent: (data) => apiFetch("/api/auth/signup-student", { method: "POST", body: JSON.stringify(data) }),
  signupHost:    (data) => apiFetch("/api/auth/signup-host",    { method: "POST", body: JSON.stringify(data) }),
  login:         (data) => apiFetch("/api/auth/login",          { method: "POST", body: JSON.stringify(data) }),
  logout:        ()     => apiFetch("/api/auth/logout",         { method: "POST", body: JSON.stringify({ refreshToken: getRefresh(), role: getUser()?.role }) }),
};

// ── HOSTELS (public) ──────────────────────────────────────────────────────────
export const hostels = {
  list:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/hostels${q ? `?${q}` : ""}`);
  },
  detail: (id)   => apiFetch(`/api/hostels/${id}`),
  rooms:  (id)   => apiFetch(`/api/hostels/${id}/rooms`),
};

// ── STUDENT ───────────────────────────────────────────────────────────────────
export const student = {
  me:            ()         => apiFetch("/api/students/me"),
  updateProfile: (data)     => apiFetch("/api/students/update-profile",  { method: "PUT",  body: JSON.stringify(data) }),
  changePassword:(data)     => apiFetch("/api/students/change-password", { method: "PUT",  body: JSON.stringify(data) }),
  saveHostel:    (hostelId) => apiFetch("/api/students/save-hostel",     { method: "POST", body: JSON.stringify({ hostelId }) }),
  trackView:     (hostelId) => apiFetch(`/api/students/track-view/${hostelId}`, { method: "POST" }),
  bookings:      ()         => apiFetch("/api/students/bookings"),
  sendMessage:   (data)     => apiFetch("/api/messages",                 { method: "POST", body: JSON.stringify(data) }),
  inbox:         ()         => apiFetch("/api/messages/inbox"),
  conversation:  (userId)   => apiFetch(`/api/messages/conversation/${userId}`),
  book:          (data)     => apiFetch("/api/bookings",                 { method: "POST", body: JSON.stringify(data) }),
};

// ── HOST ──────────────────────────────────────────────────────────────────────
export const host = {
  me:             ()              => apiFetch("/api/hosts/me"),
  myData:         ()              => apiFetch("/api/hosts/my-hostels"),
  updateProfile:  (data)          => apiFetch("/api/hosts/update-profile",  { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (data)          => apiFetch("/api/hosts/change-password", { method: "PUT", body: JSON.stringify(data) }),
  addHostel:      (formData)      => apiUpload("/api/hosts/add-hostel", formData),
  updateHostel:   (id, data)      => apiFetch(`/api/hosts/hostels/${id}`,   { method: "PUT", body: JSON.stringify(data) }),
  bookings:       ()              => apiFetch("/api/hosts/bookings"),
  updateBooking:  (id, status)    => apiFetch(`/api/hosts/bookings/${id}`,  { method: "PUT", body: JSON.stringify({ status }) }),
  addRoom:        (data)          => apiFetch("/api/hosts/rooms",            { method: "POST", body: JSON.stringify(data) }),
  updateRoom:     (id, data)      => apiFetch(`/api/hosts/rooms/${id}`,     { method: "PUT", body: JSON.stringify(data) }),
  messages:       ()              => apiFetch("/api/hosts/messages"),
  sendMessage:    (data)          => apiFetch("/api/hosts/messages",         { method: "POST", body: JSON.stringify(data) }),
  conversation:   (userId)        => apiFetch(`/api/messages/conversation/${userId}`),
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export const admin = {
  dashboard:     ()        => apiFetch("/api/admin/dashboard"),
  pendingHostels:()        => apiFetch("/api/admin/hostels/pending"),
  allHostels:    (params)  => { const q = new URLSearchParams(params || {}).toString(); return apiFetch(`/api/admin/hostels${q ? `?${q}` : ""}`); },
  hostelDetail:  (id)      => apiFetch(`/api/admin/hostels/${id}`),
  approve:       (id)      => apiFetch(`/api/admin/hostels/${id}/approve`, { method: "PUT" }),
  reject:        (id, reason) => apiFetch(`/api/admin/hostels/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) }),
  feature:       (id)      => apiFetch(`/api/admin/hostels/${id}/feature`, { method: "PUT" }),
  removeHostel:  (id)      => apiFetch(`/api/admin/hostels/${id}`,         { method: "DELETE" }),
  students:      (search)  => apiFetch(`/api/admin/students${search ? `?search=${search}` : ""}`),
  removeStudent: (id)      => apiFetch(`/api/admin/students/${id}`,        { method: "DELETE" }),
  hosts:         (search)  => apiFetch(`/api/admin/hosts${search ? `?search=${search}` : ""}`),
  verifyHost:    (id)      => apiFetch(`/api/admin/hosts/${id}/verify`,    { method: "PUT" }),
  removeHost:    (id)      => apiFetch(`/api/admin/hosts/${id}`,           { method: "DELETE" }),
  payments:      ()        => apiFetch("/api/admin/payments"),
};

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
export const payments = {
  verify:  (data) => apiFetch("/api/payments/verify",  { method: "POST", body: JSON.stringify(data) }),
  history: ()     => apiFetch("/api/payments/history"),
};

export { getUser, clearAuth, setTokens };