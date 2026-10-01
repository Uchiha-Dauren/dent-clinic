import { useT } from '../i18n';
import { siteConfig as c } from '../config/siteConfig';
import { SpotlightCard, SparkleField, Button, Reveal } from '../components/ui/Primitives';
import { SocialIcon } from '../components/ui/Icons';
export default function CtaBand() {
  const { t } = useT();
  return (
    <section className="section" aria-labelledby="cta-title">
      <Reveal>
        <SpotlightCard className="cta-card">
          <SparkleField />
          <div>
            <p className="eyebrow">{t('cta.eyebrow')}</p>
            <h2 id="cta-title">{t('cta.title')}</h2>
          </div>
          <div className="cta-content">
            <p>{t('cta.body')}</p>
            <Button to="/booking" variant="silver" magnetic>
              {t('common.book')}
            </Button>
            <div className="cta-links">
              <a href={c.contacts.telegram} target="_blank" rel="noopener noreferrer">
                <SocialIcon name="telegram" />
                Telegram
              </a>
              <a href={c.contacts.whatsapp} target="_blank" rel="noopener noreferrer">
                <SocialIcon name="whatsapp" />
                WhatsApp
              </a>
              <a href={`tel:${c.contacts.phone}`}>{t('contacts.call')}</a>
            </div>
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
}