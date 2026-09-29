import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, Phone } from 'lucide-react';
import { useT } from '../../i18n';
import { siteConfig as c } from '../../config/siteConfig';
import { ContactDock } from './ContactDock';
import { ToothMark } from '../ui/Icons';
import { Button } from '../ui/Primitives';
import { useOpenStatus } from '../../hooks/useOpenStatus';
import { dateLabel } from '../../lib/time';
export function Logo() {
  const words = c.brand.name.split(' ');
  return (
    <Link to="/" className="logo" aria-label={c.brand.name}>
      <ToothMark />
      <span>
        <em>{words[0]}</em> {words.slice(1).join(' ')}
      </span>
    </Link>
  );
}
export function LanguageSwitcher() {
  const { lang, setLang } = useT();
  return (
    <div className="language-switch" aria-label="Language / Тіл">
      {['ru', 'kk'].map((l) => (
        <button key={l} lang={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l === 'ru' ? 'RU' : 'KZ'}
        </button>
      ))}
    </div>
  );
}
export function OpenStatus() {
  const { t, lang } = useT();
  const status = useOpenStatus();
  return (
    <span className={`open-status ${status.open ? 'is-open' : ''}`}>
      <span className="status-dot" />
      {t(`contacts.${status.key}`, {
        time: status.time,
        date: status.date ? dateLabel(status.date, lang) : '',
      })}
    </span>
  );
}
export function Hours() {
  const { t } = useT();
  return (
    <div className="hours-lines">
      <span>
        {t('contacts.weekdays')}
        <b>{c.hours.weekly.mon?.join('–')}</b>
      </span>
      <span>
        {t('contacts.weekends')}
        <b>{c.hours.weekly.sat?.join('–')}</b>
      </span>
    </div>
  );
}
export default function Header() {
  const { t } = useT();
  const [open, setOpen] = useState(false),
    [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 320);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);
  const nav = Object.keys(t('nav'));
  return (
    <>
      <a className="skip-link" href="#main">
        {t('common.skip')}
      </a>
      <header className="header container">
        <div className="header-brand">
          <Logo />
          <OpenStatus />
        </div>
        <nav className="desktop-nav" aria-label={t('common.menu')}>
          {nav.map((id) => (
            <Link key={id} to={`/#${id}`}>
              {t(`nav.${id}`)}
            </Link>
          ))}
        </nav>
        <div className="header-lang">
          <LanguageSwitcher />
        </div>
        <ContactDock />
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="icon-button menu-trigger" aria-label={t('common.menu')}>
              <Menu size={22} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="modal-overlay" />
            <Dialog.Content className="mobile-menu">
              <Dialog.Title>
                <Logo />
              </Dialog.Title>
              <Dialog.Description className="sr-only">{t('common.menu')}</Dialog.Description>
              <Dialog.Close className="icon-button menu-close" aria-label={t('common.close')}>
                <X />
              </Dialog.Close>
              <nav>
                {nav.map((id, i) => (
                  <Link key={id} to={`/#${id}`} onClick={() => setOpen(false)}>
                    <span>0{i + 1}</span>
                    {t(`nav.${id}`)}
                  </Link>
                ))}
              </nav>
              <LanguageSwitcher />
              <Button to="/booking" variant="silver" onClick={() => setOpen(false)}>
                {t('common.book')}
              </Button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>
      <div className={`mini-bar ${scrolled ? 'visible' : ''}`} inert={!scrolled ? true : undefined}>
        <div className="container">
          <Logo />
          <a href={`tel:${c.contacts.phone}`} className="mini-phone">
            <Phone size={16} />
            <span>{c.contacts.phoneDisplay}</span>
          </a>
          <LanguageSwitcher />
          <Button to="/booking">{t('common.bookShort')}</Button>
        </div>
      </div>
    </>
  );
}
