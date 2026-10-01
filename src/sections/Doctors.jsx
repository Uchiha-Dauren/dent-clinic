import { useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { siteConfig as c } from '../config/siteConfig';
import { useT } from '../i18n';
import { Button, PhotoPlaceholder, Reveal, SectionTitle } from '../components/ui/Primitives';
export default function Doctors() {
  const { t, lang } = useT();
  const ref = useRef(null);
  const [slide, setSlide] = useState(0);
  return (
    <section id="doctors" className="section" aria-labelledby="doctors-title">
      <Reveal>
        <SectionTitle
          eyebrow={t('doctors.eyebrow')}
          title={<span id="doctors-title">{t('doctors.title')}</span>}
          subtitle={t('doctors.subtitle')}
        />
      </Reveal>
      <div
        className="doctor-grid"
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setSlide(
            Math.round(
              el.scrollLeft / (el.firstElementChild?.getBoundingClientRect().width + 20 || 1),
            ),
          );
        }}
      >
        {c.doctors.map((d, i) => (
          <article className="doctor-card" key={d.id}>
            <div className={'doctor-portrait portrait-' + i}>
              {d.photo ? (
                <img
                  src={d.photo}
                  alt={d.name[lang]}
                  width="400"
                  height="500"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <PhotoPlaceholder label={t('common.photo')} />
              )}
              <span className="portrait-initial">
                {d.name[lang]
                  .split(' ')
                  .map((x) => x[0])
                  .join('')}
              </span>
              <span className="experience-tag">
                {t('doctors.experience', { years: d.experience })}
              </span>
              <div className="doctor-overlay">
                <h4>{t('doctors.profile')}</h4>
                <p>{d.education[lang]}</p>
                <Button to={`/booking?doctor=${d.id}`} variant="silver">
                  {t('doctors.book')}
                </Button>
              </div>
            </div>
            <div className="doctor-info">
              <h3>{d.name[lang]}</h3>
              <p>{t('doctors.' + d.specialty)}</p>
              <div className="doctor-tags">
                {d.tags.map((tag) => (
                  <span key={tag}>{t('doctors.' + tag)}</span>
                ))}
              </div>
              <Button to={`/booking?doctor=${d.id}`} variant="ghost">
                {t('doctors.book')}
                <ArrowUpRight size={16} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="carousel-dots">
        {c.doctors.map((d, i) => (
          <button
            key={d.id}
            aria-label={t('doctors.slide', { number: i + 1 })}
            aria-pressed={slide === i}
            onClick={() =>
              ref.current.children[i].scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'instant'
                  : 'smooth',
                block: 'nearest',
                inline: 'start',
              })
            }
          >
            <span />
          </button>
        ))}
      </div>
      <p className="demo-caption">{t('common.sample')}</p>
    </section>
  );
}