import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { API, api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";

export default function Register() {
  const [params] = useSearchParams();
  const initialRole = params.get("role") === "supplier" ? "supplier" : "buyer";
  const [form, setForm] = useState({
    name: "", email: "", password: "", company: "", role: initialRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { ...form, email: form.email.toLowerCase() });
      setUser(data);
      toast.success("Account created");
      navigate(data.role === "supplier" ? "/supplier/apply" : "/buyer/intake", { replace: true });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = () => {
    window.location.href = `${API}/auth/google/login?role=${form.role}`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16" data-testid="register-page">
      <Seo title="Create Account | Elan Exports Consultancy" description="Create a buyer or supplier account at Elan Exports Consultancy." robots="noindex" />
      <div className="w-full max-w-lg border hairline p-10 bg-surface">
        <div className="overline mb-3">Create account</div>
        <h1 className="font-display text-3xl text-[#012D76] tracking-tight mb-2">Join EEC.</h1>
        <p className="text-sm text-[#3A4759] mb-8">Buyers and suppliers. Choose your role.</p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { v: "buyer", label: "Buyer Account" },
            { v: "supplier", label: "Supplier Account" },
          ].map((r) => (
            <button
              key={r.v}
              type="button"
              onClick={() => set("role", r.v)}
              data-testid={`register-role-${r.v}`}
              className={`py-3 text-xs uppercase tracking-widest border transition-colors ${
                form.role === r.v ? "border-[#C9A23F] bg-[#C9A23F]/10 text-[#012D76]" : "border-[#E5EBF2] text-[#3A4759] hover:text-[#012D76]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" testid="register-name">
              <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                className="input-eec" data-testid="register-name-input" />
            </Field>
            <Field label="Company" testid="register-company">
              <input value={form.company} onChange={(e) => set("company", e.target.value)}
                className="input-eec" data-testid="register-company-input" />
            </Field>
          </div>
          <Field label="Email">
            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              className="input-eec" data-testid="register-email-input" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
                className="input-eec pr-12" data-testid="register-password-input" minLength={6} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#012D76]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                data-testid="register-password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <button type="submit" disabled={loading} className="eec-btn-primary w-full" data-testid="register-submit">
            {loading ? "Creating account…" : "Create account"} <ArrowUpRight size={14} />
          </button>
        </form>

        <div className="my-6 flex items-center gap-4 text-xs text-[#012D76]/35 uppercase tracking-widest">
          <span className="h-px flex-1 bg-[#012D76]/10" /> or <span className="h-px flex-1 bg-[#012D76]/10" />
        </div>
        <button onClick={googleSignup} className="eec-btn-secondary w-full" data-testid="register-google">
          Sign up with Google
        </button>

        <div className="mt-6 text-sm text-[#3A4759] text-center">
          Already registered? <Link to="/login" className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] hover:text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]">Sign in</Link>
        </div>
      </div>
      <style>{`.input-eec{margin-top:0.5rem;width:100%;background:#05050A;border:1px solid rgba(255,255,255,0.08);padding:0.75rem 1rem;color:#fff;outline:none;}.input-eec:focus{border-color:rgba(212,175,55,0.5);}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="overline text-[#3A4759]">{label}</span>
      {children}
    </label>
  );
}
