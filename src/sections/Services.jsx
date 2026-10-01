import { useState, useRef } from 'react';
import { ArrowUpRight, Check, Clock } from 'lucide-react';
import { siteConfig as c } from '../config/siteConfig';
import { useT } from '../i18n';
import {
  SpotlightCard,
  SparkleField,
  Button,
  Reveal,
  SectionTitle,
} from '../components/ui/Primitives';
import { ServiceIcon } from '../components/ui/Icons';
import Modal from '../components/ui/Modal';
import Accordion from '../components/ui/Accordion';
export default function Services() {
  const { t, lang } = useT();
  const [selected, setSelected] = useState(null);
  const opener = useRef(null);
  const text = selected ? t('services.' + selected.id) : null;
  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <Reveal>
        <SectionTitle
          eyebrow={t('services.eyebrow')}
          title={<span id="services-title">{t('services.title')}</span>}
          subtitle={t('services.subtitle')}
        />
        <SpotlightCard className="services-card">
          <SparkleField />
          <div className="service-grid">
            {c.services.map((service, i) => (
              <article className="service" key={service.id}>
                <div className="service-top">
                  <span className="service-icon">
                    <ServiceIcon name={service.icon} />
                  </span>
                  <span className="service-num">0{i + 1}</span>
                </div>
                <h3>{t(`services.${service.id}.title`)}</h3>
                <p>{t(`services.${service.id}.short`)}</p>
                <button
                  className="service-more"
                  onClick={(e) => {
                    opener.current = e.currentTarget;
                    setSelected(service);
                  }}
                >
                  {t('common.more')}
                  <ArrowUpRight size={15} />
                </button>
              </article>
            ))}
            <article className="service service-consult">
              <span className="consult-star">✦</span>
              <h3>{t('services.notFound')}</h3>
              <p>{t('services.consult')}</p>
              <Button variant="silver" to="/booking">
                {t('services.leave')}
              </Button>
            </article>
          </div>
        </SpotlightCard>
      </Reveal>
      <Modal
        returnFocusRef={opener}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={text?.title}
        description={text?.long}
      >
        {selected && (
          <>
            <div className="service-meta">
              <span>
                <Clock size={17} />
                {selected.duration} {t('common.min')}
              </span>
              <strong>
                {lang === 'ru' ? `${t('services.price')}: ${t('common.from')} ` : ''}
                {selected.priceFrom.toLocaleString('ru-KZ')} ₸
                {lang === 'kk' ? ` ${t('common.from')}` : ''}
              </strong>
            </div>
            <p className="small muted">
              {t('services.exact')} · {t('common.sample')}
            </p>
            <h3>{t('services.includes')}</h3>
            <ul className="check-list">
              {text.includes.map((x) => (
                <li key={x}>
                  <Check size={16} />
                  {x}
                </li>
              ))}
            </ul>
            <h3>{t('services.steps')}</h3>
            <ol className="step-list">
              {text.steps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
            <Accordion items={text.faq} />
            <Button
              to={`/booking?service=${selected.id}`}
              className="full-width"
              onClick={() => setSelected(null)}
            >
              {t('services.book')}
            </Button>
          </>
        )}
      </Modal>
    </section>
  );
}
