import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { useT } from '../i18n';
import { siteConfig as c } from '../config/siteConfig';
import { SpotlightCard, SectionTitle, Reveal, Button } from '../components/ui/Primitives';
import { Socials, GisLink } from '../components/layout/ContactDock';
import { Hours, OpenStatus } from '../components/layout/Header';
import { ToothMark } from '../components/ui/Icons';
export default function Contacts() {
  const { t, lang } = useT();
  return (
    <section className="section contacts-section" id="contacts" aria-labelledby="contacts-title">
      <Reveal>
        <SectionTitle
          eyebrow={t('contacts.caption')}
          title={<span id="contacts-title">{t('contacts.title')}</span>}
        />
        <div className="contacts-grid">
          <SpotlightCard className="contacts-card">
            <p className="eyebrow">{c.brand.city[lang]}</p>
            <h3>{c.address[lang]}</h3>
            <p className="contact-parking">
              <MapPin size={16} />
              {t('contacts.parking')}
            </p>
            <a href={`tel:${c.contacts.phone}`} className="contact-big-phone">
              {c.contacts.phoneDisplay}
            </a>
            <Socials whatsapp />
            <div className="contact-hours">
              <Hours />
              <OpenStatus />
            </div>
            <div className="contact-map-links">
              <GisLink />
              <a href={c.contacts.twoGis} target="_blank" rel="noopener noreferrer">
                {t('contacts.route')}
                <ArrowUpRight size={15} />
              </a>
            </div>
          </SpotlightCard>
          <a
            href={c.contacts.twoGis}
            target="_blank"
            rel="noopener noreferrer"
            className="map-card"
            aria-label={t('contacts.mapNote')}
          >
            {}
            <div className="map-grid" />
            <div className="map-water" />
            <div className="map-road road-one" />
            <div className="map-road road-two" />
            <span className="map-city">{c.brand.city[lang]}</span>
            <div className="map-pin">
              <ToothMark size={32} />
            </div>
            <div className="map-clinic">
              {c.brand.name}
              <span>{c.address[lang]}</span>
            </div>
            <span className="map-open">
              {t('contacts.gis')}
              <ArrowUpRight size={18} />
            </span>
            <span className="map-demo">{t('common.sample')}</span>
          </a>
        </div>
      </Reveal>
    </section>
  );
}
