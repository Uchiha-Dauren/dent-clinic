import { motion, useReducedMotion } from 'motion/react';
import { useT } from '../i18n';
import { siteConfig as c } from '../config/siteConfig';
import { Reveal, SectionTitle, CountUp } from '../components/ui/Primitives';
export default function Guarantees() {
  const { t } = useT();
  const reduced = useReducedMotion();
  return (
    <section className="section" aria-labelledby="guarantees-title">
      <Reveal>
        <SectionTitle
          eyebrow={t('guarantees.eyebrow')}
          title={<span id="guarantees-title">{t('guarantees.title')}</span>}
        />
        <div className="guarantees-grid">
          {c.guarantees.map((g) => (
            <div key={g.key}>
              <strong>
                {/^\d+$/.test(g.value) ? <CountUp value={Number(g.value)} /> : g.value}
                <small>{t('guarantees.' + g.unit)}</small>
              </strong>
              <motion.div
                className="guarantee-rule"
                initial={reduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              />
              <p>{t('guarantees.' + g.key)}</p>
            </div>
          ))}
        </div>
        <p className="demo-caption">{t('guarantees.note')}</p>
      </Reveal>
    </section>
  );
}