import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Hero from '../sections/Hero';
import About from '../sections/About';
import Services from '../sections/Services';
import { useLocation } from 'react-router-dom';
const MoreSections = lazy(() => import('../sections/MoreSections'));
export default function Home() {
  const ref = useRef(null),
    [load, setLoad] = useState(false),
    location = useLocation();
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '900px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (location.hash) {
      setLoad(true);
      const id = location.hash.slice(1);
      let tries = 0;
      const timer = setInterval(() => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'instant'
              : 'smooth',
          });
          clearInterval(timer);
        } else if (++tries > 30) clearInterval(timer);
      }, 80);
      return () => clearInterval(timer);
    }
  }, [location.hash]);
  return (
    <div className="container">
      <Hero />
      <About />
      <Services />
      <div ref={ref}>
        {load && (
          <Suspense fallback={<div className="loading-section" />}>
            <MoreSections />
          </Suspense>
        )}
      </div>
    </div>
  );
}
