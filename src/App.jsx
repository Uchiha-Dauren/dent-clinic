import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import FloatingContact from './components/layout/FloatingContact';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Seo from './components/Seo';
import { useT } from './i18n';
const Admin = lazy(() => import('./pages/Admin'));
const Booking = lazy(() => import('./pages/Booking'));
export default function App() {
  const location = useLocation(),
    reduced = useReducedMotion(),
    { t } = useT();
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname]);
  const isAdmin = location.pathname === '/admin';
  const Main = isAdmin ? 'div' : 'main';
  return (
    <>
      <Seo />
      {!isAdmin && <Header />}
      <Main id="main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.23 }}
          >
            <Suspense
              fallback={
                <div className="container page-loading" role="status">
                  {t('common.loading')}
                </div>
              }
            >
              <Routes location={location}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/" element={<Home />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Main>
      {!isAdmin && <Footer />}
      {!isAdmin && <FloatingContact />}
    </>
  );
}
