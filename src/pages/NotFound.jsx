import { useT } from '../i18n';
import { Button, SpotlightCard, SparkleField } from '../components/ui/Primitives';
export default function NotFound() {
  const { t } = useT();
  return (
    <div className="container not-found">
      <SpotlightCard>
        <SparkleField />
        <span className="error-code">404</span>
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.body')}</p>
        <Button to="/" variant="silver">
          {t('common.home')}
        </Button>
      </SpotlightCard>
    </div>
  );
}
