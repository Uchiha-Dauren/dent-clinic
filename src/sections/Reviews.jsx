import { useState } from 'react';
import { Pause, Play, Star } from 'lucide-react';
import { useT } from '../i18n';
import { siteConfig as c } from '../config/siteConfig';
import { Button, SectionTitle, Reveal } from '../components/ui/Primitives';
import { dateLabel } from '../lib/time';
export default function Reviews() {
  const { t, lang } = useT(),
    [paused, setPaused] = useState(false);
  return (
    <section id="reviews" className="section" aria-labelledby="reviews-title">
      <Reveal>
        <SectionTitle
          eyebrow={t('reviews.eyebrow')}
          title={<span id="reviews-title">{t('reviews.title')}</span>}
        >
          <Button
            href={c.contacts.twoGis}
            variant="ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('reviews.all')}
          </Button>
        </SectionTitle>
        <div className={`review-window ${paused ? 'paused' : ''}`}>
          <div className="review-track">
            {[...c.reviews, ...c.reviews].map((r, i) => (
              <article
                className="review-card"
                key={`${r.id}-${i}`}
                aria-hidden={i >= c.reviews.length ? true : undefined}
              >
                <div className="review-stars" aria-label={`${r.stars}/5`}>
                  {Array.from({ length: r.stars }, (_, j) => (
                    <Star key={j} size={12} fill="currentColor" />
                  ))}
                </div>
                <p>«{r.text[lang]}»</p>
                <div className="review-author">
                  <span className="review-avatar">{r.name[0]}</span>
                  <div>
                    <strong>{r.name}</strong>
                    <span>{t('services.' + r.service + '.title')}</span>
                  </div>
                  <time dateTime={r.date}>
                    {dateLabel(r.date, lang, { day: 'numeric', month: '2-digit' })}
                  </time>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="review-controls">
          <p className="demo-caption">{t('reviews.demo')}</p>
          <button className="pause-button" onClick={() => setPaused((v) => !v)}>
            {paused ? <Play size={14} /> : <Pause size={14} />}{' '}
            {t(paused ? 'common.play' : 'common.pause')}
          </button>
        </div>
      </Reveal>
    </section>
  );
}
