import { Phone, ArrowUpRight } from 'lucide-react';
import { siteConfig as c } from '../../config/siteConfig';
import { useT } from '../../i18n';
import { SocialIcon } from '../ui/Icons';
export function Socials({ whatsapp = false }) {
  return (
    <div className="socials">
      {['instagram', 'telegram', ...(whatsapp ? ['whatsapp'] : [])].map((name) => (
        <a
          className="icon-button"
          href={c.contacts[name]}
          key={name}
          aria-label={
            name === 'instagram' ? 'Instagram' : name === 'telegram' ? 'Telegram' : 'WhatsApp'
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          <SocialIcon name={name} />
        </a>
      ))}
    </div>
  );
}
export function GisLink({ className = '' }) {
  const { t } = useT();
  return (
    <a
      className={`gis-link ${className}`}
      href={c.contacts.twoGis}
      target="_blank"
      rel="noopener noreferrer"
    >
      <SocialIcon name="gis" />
      {t('contacts.gis')}
      <ArrowUpRight size={15} />
    </a>
  );
}
export function ContactDock() {
  return (
    <div className="contact-dock">
      <div className="dock-first">
        <a href={`tel:${c.contacts.phone}`} className="phone-link">
          <Phone size={15} />
          {c.contacts.phoneDisplay}
        </a>
        <Socials />
      </div>
      <GisLink />
    </div>
  );
}
