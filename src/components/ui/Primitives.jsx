import { useMemo, useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion, useInView, animate } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import clsx from 'clsx';
import { useSpotlight } from '../../hooks/useSpotlight';
import { useT } from '../../i18n';
export function Button({
  children,
  to,
  href,
  variant = 'black',
  className,
  arrow = true,
  loading = false,
  magnetic = false,
  ...props
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const Comp = to ? Link : href ? 'a' : 'button';
  function move(e) {
    if (!magnetic || reduced || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    ref.current.style.transform = `translate(${Math.max(-8, Math.min(8, (e.clientX - r.left - r.width / 2) * 0.08))}px,${Math.max(-8, Math.min(8, (e.clientY - r.top - r.height / 2) * 0.12))}px)`;
  }
  return (
    <Comp
      ref={ref}
      to={to}
      href={href}
      type={!to && !href ? 'button' : undefined}
      className={clsx('button', `button-${variant}`, className)}
      onPointerMove={move}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = '';
      }}
      {...props}
    >
      {loading ? <LoaderCircle className="spin" size={18} /> : null}
      <span>{children}</span>
      {arrow && !loading ? <ArrowUpRight size={18} /> : null}
    </Comp>
  );
}
export const MagneticButton = (props) => <Button magnetic {...props} />;
export function SpotlightCard({ children, className = '', ...props }) {
  const handlers = useSpotlight();
  return (
    <div className={`dark-card spotlight ${className}`} {...handlers} {...props}>
      {children}
    </div>
  );
}
export function Reveal({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
export function SparkleField() {
  const stars = useMemo(() => {
    let seed = 937;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    return Array.from({ length: 48 }, (_, i) => ({
      x: 35 + random() * 65,
      y: 15 + Math.sqrt(random()) * 85,
      size: [8, 14, 26][i % 3],
      opacity: 0.05 + random() * 0.13,
      rotation: random() * 75,
      delay: random() * 5,
      duration: 3 + random() * 3,
    }));
  }, []);
  return (
    <div className="sparkle-field" aria-hidden="true">
      {stars.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={i < 8 ? 'twinkle' : ''}
          style={{
            left: s.x + '%',
            top: s.y + '%',
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            rotate: s.rotation + 'deg',
            animationDelay: s.delay + 's',
            animationDuration: s.duration + 's',
          }}
        >
          <path
            d="M12 0C13.5 8.5 15.5 10.5 24 12C15.5 13.5 13.5 15.5 12 24C10.5 15.5 8.5 13.5 0 12C8.5 10.5 10.5 8.5 12 0Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}
export function SectionTitle({ eyebrow, title, subtitle, children, className = '' }) {
  return (
    <div className={`section-title ${className}`}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export function CountUp({ value, suffix = '' }) {
  const ref = useRef(null),
    seen = useInView(ref, { once: true }),
    reduced = useReducedMotion();
  const [n, setN] = useState(value);
  useEffect(() => {
    if (!seen || reduced) return;
    const controls = animate(0, value, { duration: 1.4, onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [seen, reduced, value]);
  return (
    <span ref={ref}>
      {n.toLocaleString('ru-KZ')}
      {suffix}
    </span>
  );
}
export function PhotoPlaceholder({ label, className = '' }) {
  const { t } = useT();
  return (
    <div
      className={`photo-placeholder ${className}`}
      role="img"
      aria-label={label || t('common.photo')}
    >
      <span className="placeholder-plus">✦</span>
      <span>{label || t('common.photo')}</span>
    </div>
  );
}
