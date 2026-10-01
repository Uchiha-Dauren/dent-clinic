import { useRef } from 'react';
import { motion, useScroll, useReducedMotion } from 'motion/react';
import { useT } from '../i18n';
import { SpotlightCard, SparkleField, Reveal } from '../components/ui/Primitives';
export default function Process() {
  const { t } = useT();
  const ref = useRef(null),
    reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  return (
    <section className="section process" aria-labelledby="process-title" ref={ref}>
      <Reveal>
        <SpotlightCard className="process-card">
          <SparkleField />
          <p className="eyebrow">{t('process.eyebrow')}</p>
          <h2 id="process-title">{t('process.title')}</h2>
          <div className="timeline">
            <div className="timeline-track">
              <motion.div style={{ scaleX: reduced ? 1 : scrollYProgress }} />
            </div>
            {t('process.steps').map(([title, body], i) => (
              <div className="timeline-step" key={title}>
                <span className="timeline-number">0{i + 1}</span>
                <span className="timeline-dot" />
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
}