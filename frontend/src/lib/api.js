import axios from "axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Treat 401 on /auth/me as "not logged in" — an expected state, not an error.
// Without this, axios throws a rejected promise that the browser logs to the
// DevTools console on every page load for logged-out visitors, failing
// Lighthouse Best Practices ("No browser errors logged to the console").
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCheck =
      error.config?.url?.includes("/auth/me");
    const is401 = error.response?.status === 401;
    if (isAuthCheck && is401) {
      // Return a resolved response with null data so AuthContext sets user=false cleanly
      return Promise.resolve({ data: null });
    }
    return Promise.reject(error);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
