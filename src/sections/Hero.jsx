import { useRef } from 'react';
import { MapPin, Check, Star, ArrowDownRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useT } from '../i18n';
import { siteConfig as c } from '../config/siteConfig';
import { SpotlightCard, SparkleField, Button } from '../components/ui/Primitives';
import { GisLink } from '../components/layout/ContactDock';
import { Hours, OpenStatus } from '../components/layout/Header';
export default function Hero() {
  const { t } = useT(),
    reduced = useReducedMotion();
  const photo = useRef(null);
  return (
    <>
      <section id="top" className="hero-shell" aria-labelledby="hero-title">
        <SpotlightCard className="hero">
          <SparkleField />
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <MapPin size={14} />
              {t('hero.eyebrow')}
            </p>
            <h1 id="hero-title">
              {[t('hero.line1'), t('hero.line2')].map((s, i) => (
                <span key={s} className="hero-line">
                  {s.split(' ').map((w, j) => (
                    <motion.span
                      key={j}
                      initial={reduced ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (i * 3 + j) * 0.07, duration: 0.6 }}
                    >
                      {w}{' '}
                    </motion.span>
                  ))}
                </span>
              ))}
              <span className="silver-word">
                {t('hero.highlight')}
                <svg viewBox="0 0 290 16" aria-hidden="true">
                  <motion.path
                    d="M3 11 Q120 -3 285 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    initial={reduced ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </svg>
              </span>
              <span className="headline-star" aria-hidden="true">
                ✦
              </span>
            </h1>
            <p className="hero-description">{t('hero.body')}</p>
            <div className="hero-actions">
              <Button to="/booking" variant="silver" magnetic>
                {t('common.book')}
              </Button>
              <Button to="/#services" variant="outline">
                {t('hero.services')}
              </Button>
            </div>
            <div className="trust-chips">
              {[
                t('hero.experience', { years: c.minExperience }),
                t('hero.warranty'),
                t('hero.installment'),
              ].map((x) => (
                <span key={x}>
                  <Check size={13} />
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div
            className="hero-visual"
            ref={photo}
            onPointerMove={(e) => {
              if (reduced || e.pointerType !== 'mouse') return;
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                '--parallax',
                ((e.clientX - r.left) / r.width - 0.5) * 12 + 'px',
              );
            }}
            onPointerLeave={(e) => e.currentTarget.style.setProperty('--parallax', '0px')}
          >
            <div className="hero-orbit" />
            <img
              src={c.images.team}
              alt={t('common.teamPhoto')}
              width="1161"
              height="1355"
              fetchPriority="high"
              className="team-photo"
            />
            <div className="glass-badge rating-badge">
              <Star size={20} fill="currentColor" />
              <div>
                <strong>{c.rating}</strong>
                <span>{t('hero.rating')}</span>
              </div>
            </div>
            <div className="glass-badge patients-badge">
              <span className="badge-sparkle">✦</span>
              <div>
                <strong>{c.stats[1].value.toLocaleString('ru-KZ')}+</strong>
                <span>{t('hero.patients')}</span>
              </div>
            </div>
            <span className="image-disclosure">{t('common.photoDemo')}</span>
          </div>
        </SpotlightCard>
      </section>
      <section className="quick-info" aria-label={t('quick.appointment')}>
        <div>
          <span className="info-index">01 /</span>
          <h3>
            {t('quick.appointment')} <ArrowDownRight size={17} />
          </h3>
          <p>{t('quick.body', { minutes: c.responseMinutes })}</p>
          <Button to="/booking" variant="ghost">
            {t('common.consult')}
          </Button>
        </div>
        <div>
          <span className="info-index">02 /</span>
          <h3>{t('contacts.address')}</h3>
          <Address />
          <p className="parking">
            <Check size={14} />
            {t('contacts.parking')}
          </p>
          <GisLink />
        </div>
        <div>
          <span className="info-index">03 /</span>
          <h3>{t('contacts.hours')}</h3>
          <Hours />
          <OpenStatus />
        </div>
      </section>
    </>
  );
}
function Address() {
  const { lang } = useT();
  return <p>{c.address[lang]}</p>;
}