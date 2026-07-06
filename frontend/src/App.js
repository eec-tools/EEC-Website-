import "@/App.css";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// These 6 routes are prerendered (react-snap) and must be present in the main bundle,
// not React.lazy()-loaded: createRoot() discards the prerendered static HTML on mount
// and re-renders from scratch, so if these were lazy, the Suspense fallback (null) would
// blank the page for as long as the route's chunk takes to download+execute — on a slow
// connection that's a multi-second gap where a real user sees nothing. Bundling them
// eagerly means the real component tree is ready the instant React mounts, so there's
// nothing to suspend on and no blank window. See .audit-screenshots/content-blanking-scoping-note.md.
import Home from "@/pages/Home";
import ForBuyers from "@/pages/ForBuyers";
import ForSuppliers from "@/pages/ForSuppliers";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Categories from "@/pages/Categories";

const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const BuyerPortal = lazy(() => import("@/pages/BuyerPortal"));
const BuyerIntake = lazy(() => import("@/pages/BuyerIntake"));
const SupplierPortal = lazy(() => import("@/pages/SupplierPortal"));
const SupplierApply = lazy(() => import("@/pages/SupplierApply"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useLayoutEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search, hash]);
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
                <Route path="/categories/:slug" element={<CategoryPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/buyer" element={<ProtectedRoute role="buyer"><BuyerPortal /></ProtectedRoute>} />
                <Route path="/buyer/intake" element={<BuyerIntake />} />
                <Route path="/supplier" element={<ProtectedRoute role="supplier"><SupplierPortal /></ProtectedRoute>} />
                <Route path="/supplier/apply" element={<ProtectedRoute role="supplier"><SupplierApply /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
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
