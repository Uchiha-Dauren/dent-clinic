import { useRef, useEffect } from 'react';
export function useSpotlight() {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return {
    onPointerMove: (e) => {
      if (
        e.pointerType !== 'mouse' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty('--mx', x + 'px');
        el.style.setProperty('--my', y + 'px');
      });
    },
  };
}
