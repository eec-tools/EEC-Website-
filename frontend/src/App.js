import "@/App.css";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home"));
const ForBuyers = lazy(() => import("@/pages/ForBuyers"));
const ForSuppliers = lazy(() => import("@/pages/ForSuppliers"));
const About = lazy(() => import("@/pages/About"));
const Services = lazy(() => import("@/pages/Services"));
const Categories = lazy(() => import("@/pages/Categories"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const BuyerPortal = lazy(() => import("@/pages/BuyerPortal"));
const BuyerIntake = lazy(() => import("@/pages/BuyerIntake"));
const SupplierPortal = lazy(() => import("@/pages/SupplierPortal"));
const SupplierApply = lazy(() => import("@/pages/SupplierApply"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);
  return null;
}

function AppRouter() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const hasRenderedOnce = useRef(false);
  const isInitialRender = !hasRenderedOnce.current;
  useEffect(() => {
    hasRenderedOnce.current = true;
  }, []);

  const pageMotion = shouldReduceMotion || isInitialRender
    ? {
        initial: false,
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <Layout>
      <ScrollToTop />
      <LazyMotion features={domAnimation}>
        <AnimatePresence initial={false}>
          <m.div
            key={`${location.pathname}${location.search}`}
            initial={pageMotion.initial}
            animate={pageMotion.animate}
            exit={pageMotion.exit}
            transition={pageMotion.transition}
            style={{ willChange: shouldReduceMotion ? "auto" : "opacity, transform" }}
          >
            <Suspense fallback={null}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/for-buyers" element={<ForBuyers />} />
                <Route path="/for-suppliers" element={<ForSuppliers />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/buyer" element={<ProtectedRoute role="buyer"><BuyerPortal /></ProtectedRoute>} />
                <Route path="/buyer/intake" element={<BuyerIntake />} />
                <Route path="/supplier" element={<ProtectedRoute role="supplier"><SupplierPortal /></ProtectedRoute>} />
                <Route path="/supplier/apply" element={<ProtectedRoute role="supplier"><SupplierApply /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Routes>
            </Suspense>
          </m.div>
        </AnimatePresence>
      </LazyMotion>
    </Layout>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster theme="dark" position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
