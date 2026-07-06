import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { API, api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Seo from "@/components/Seo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email: email.toLowerCase(), password });
      setUser(data);
      toast.success("Welcome back");
      const dest = location.state?.from || (data.role === "admin" ? "/admin" : data.role === "supplier" ? "/supplier" : "/buyer");
      navigate(dest, { replace: true });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    window.location.href = `${API}/auth/google/login?role=buyer`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16" data-testid="login-page">
      <Seo title="Sign In | Elan Exports Consultancy" description="Sign in to access your buyer or supplier dashboard." robots="noindex" />
      <div className="w-full max-w-md border hairline p-10 bg-surface">
        <div className="overline mb-3">Sign in</div>
        <h1 className="font-display text-3xl text-[#012D76] tracking-tight mb-2">Welcome back to EEC.</h1>
        <p className="text-sm text-[#3A4759] mb-8">Access your buyer or supplier portal.</p>
        {params.get("error") === "oauth" && (
          <div className="mb-4 text-sm text-red-400">Google sign-in failed. Please try again.</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="overline text-[#3A4759]">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full bg-[#FFFFFF] border hairline px-4 py-3 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
              data-testid="login-email"
            />
          </div>
          <div>
            <label className="overline text-[#3A4759]">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FFFFFF] border hairline px-4 py-3 pr-12 text-[#012D76] focus:outline-none focus:border-[#C9A23F]/70"
                data-testid="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-3.5 text-[#6B7280] hover:text-[#012D76]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                data-testid="login-password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="eec-btn-primary w-full" data-testid="login-submit">
            {loading ? "Signing in…" : "Sign in"} <ArrowUpRight size={14} />
          </button>
        </form>
        <div className="my-6 flex items-center gap-4 text-xs text-[#012D76]/35 uppercase tracking-widest">
          <span className="h-px flex-1 bg-[#012D76]/10" /> or <span className="h-px flex-1 bg-[#012D76]/10" />
        </div>
        <button onClick={googleLogin} className="eec-btn-secondary w-full" data-testid="login-google">
          Continue with Google
        </button>
        <div className="mt-6 text-sm text-[#3A4759] text-center">
          New to EEC? <Link to="/register" className="text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))] hover:text-[rgb(201_162_63_/_var(--tw-text-opacity,_1))]" data-testid="login-to-register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
