import axios from "axios";

// In production, calls go to a relative "/api" path on the frontend's own origin —
// vercel.json rewrites that to the backend deployment at Vercel's edge, so the
// browser only ever sees one origin and auth cookies stay first-party (two separate
// *.vercel.app subdomains are treated as different sites by browsers, since Vercel
// registers vercel.app on the public suffix list — real cross-site cookies get
// dropped there regardless of SameSite/Secure). Set REACT_APP_BACKEND_URL explicitly
// only if you want to bypass the proxy (e.g. pointing at a custom API domain).
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

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
