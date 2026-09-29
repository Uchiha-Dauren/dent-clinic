import { useT } from '../i18n';
import { Button } from '../components/ui/Primitives';
export default function Privacy() {
  const { t } = useT();
  return (
    <div className="container legal-page">
      <p className="eyebrow">{t('common.demo')}</p>
      <h1>{t('privacy.title')}</h1>
      <p>{t('privacy.intro')}</p>
      {t('privacy.sections').map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
      <Button to="/">{t('common.home')}</Button>
    </div>
  );
}