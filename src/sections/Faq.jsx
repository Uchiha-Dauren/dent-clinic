import { useT } from '../i18n';
import { siteConfig as c } from '../config/siteConfig';
import { Reveal } from '../components/ui/Primitives';
import Accordion from '../components/ui/Accordion';
export default function Faq() {
  const { t } = useT();
  return (
    <section className="section faq-section" aria-labelledby="faq-title">
      <Reveal>
        <p className="eyebrow">{t('faq.eyebrow')}</p>
        <h2 id="faq-title">{t('faq.title')}</h2>
        <span className="faq-sparkle" aria-hidden="true">
          ✦
        </span>
      </Reveal>
      <Reveal>
        <Accordion items={c.faq.map((key) => t('faq.' + key))} />
      </Reveal>
    </section>
  );
}
