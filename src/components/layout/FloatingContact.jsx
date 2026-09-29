import { useState } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '../../i18n';
import { siteConfig as c } from '../../config/siteConfig';
import { SocialIcon } from '../ui/Icons';
export default function FloatingContact() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <div
      className="floating-contact"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      {open && (
        <>
          <button
            className="floating-dismiss"
            aria-label={t('common.close')}
            onClick={() => setOpen(false)}
          />
          <div className="floating-menu" id="floating-options">
            <Link to="/booking" onClick={() => setOpen(false)}>
              {t('common.bookShort')}
            </Link>
            <a href={`tel:${c.contacts.phone}`}>
              <Phone size={18} />
              {t('contacts.call')}
            </a>
            <a href={c.contacts.telegram} target="_blank" rel="noopener noreferrer">
              <SocialIcon name="telegram" />
              Telegram
            </a>
            <a href={c.contacts.whatsapp} target="_blank" rel="noopener noreferrer">
              <SocialIcon name="whatsapp" />
              WhatsApp
            </a>
          </div>
        </>
      )}
      <button
        className="floating-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={t(open ? 'common.close' : 'contacts.contactUs')}
        aria-expanded={open}
        aria-controls="floating-options"
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
      </button>
    </div>
  );
}
