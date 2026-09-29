import { Link } from 'react-router-dom';
import { useT } from '../../i18n';
import { siteConfig as c } from '../../config/siteConfig';
import { Logo, LanguageSwitcher } from './Header';
import { Socials } from './ContactDock';
export default function Footer() {
  const { t, lang } = useT();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Logo />
            <p>{t('footer.description')}</p>
          </div>
          <nav aria-label={t('common.menu')}>
            {Object.keys(t('nav')).map((id) => (
              <Link key={id} to={`/#${id}`}>
                {t('nav.' + id)}
              </Link>
            ))}
          </nav>
          <div className="footer-contact">
            <a href={`tel:${c.contacts.phone}`}>{c.contacts.phoneDisplay}</a>
            <span>{c.address[lang]}</span>
            <Socials whatsapp />
          </div>
          <LanguageSwitcher />
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {c.brand.name}
          </span>
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/admin">{t('admin.navigation')}</Link>
          <span>{c.legal.license[lang]}</span>
        </div>
        <p className="footer-disclaimer">{t('footer.disclaimer')}</p>
        {c.isDemo && <p className="footer-demo">{t('common.demoFull')}</p>}
      </div>
    </footer>
  );
}
