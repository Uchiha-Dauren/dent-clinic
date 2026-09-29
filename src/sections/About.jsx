import { Microscope, Heart, ShieldCheck, Receipt } from 'lucide-react';
import { siteConfig as c } from '../config/siteConfig';
import { useT } from '../i18n';
import { Reveal, SectionTitle, CountUp } from '../components/ui/Primitives';
export default function About() {
  const { t } = useT();
  const icons = [Microscope, Heart, ShieldCheck, Receipt];
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="about-grid">
        <Reveal>
          <p className="eyebrow">{t('about.eyebrow')}</p>
          <h2 id="about-title">{t('about.title')}</h2>
          <p className="about-intro">{t('about.p1')}</p>
          <p className="about-body">{t('about.p2')}</p>
          <div className="stats-grid">
            {c.stats.map((s) => (
              <div key={s.key}>
                <strong>
                  <CountUp value={s.value} suffix={s.suffix} />
                </strong>
                <span>{t('about.' + s.key)}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal className="about-collage" delay={0.08}>
          <div className="collage-main">
            <img
              src={c.images.clinic}
              alt={t('common.clinicPhoto')}
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
            />
            <div className="collage-label">
              <span>✦</span>
              {t('about.photoLabel')}
            </div>
          </div>
          <div className="collage-detail">
            <img
              src={c.images.clinic}
              alt={t('common.clinicPhoto')}
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="collage-third">
            <img
              src={c.images.clinic}
              alt={t('common.clinicPhoto')}
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="collage-note">{t('common.photoDemo')}</p>
        </Reveal>
      </div>
      <div className="why-grid">
        {t('about.why').map(([title, body], i) => {
          const Icon = icons[i];
          return (
            <Reveal key={title} delay={i * 0.08}>
              <Icon size={26} strokeWidth={1.3} />
              <h3>{title}</h3>
              <p>{body}</p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
