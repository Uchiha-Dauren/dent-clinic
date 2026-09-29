import { useState } from 'react';
import { useT } from '../i18n';
import { siteConfig as c } from '../config/siteConfig';
import { Reveal, SectionTitle } from '../components/ui/Primitives';
import BeforeAfter from '../components/ui/BeforeAfter';
export default function BeforeAfterSection() {
  const { t } = useT();
  const [selected, setSelected] = useState(0);
  return (
    <section className="section" aria-labelledby="results-title">
      <Reveal>
        <SectionTitle
          eyebrow={t('results.eyebrow')}
          title={<span id="results-title">{t('results.title')}</span>}
        />
        <BeforeAfter key={selected} item={c.cases[selected]} />
        <div className="case-switcher">
          {c.cases.map((item, i) => (
            <button key={item.id} aria-pressed={i === selected} onClick={() => setSelected(i)}>
              <span className={'case-thumb thumb-' + i}>✦</span>
              <span>{t('services.' + item.key + '.title')}</span>
              <b>0{i + 1}</b>
            </button>
          ))}
        </div>
        {c.legal.showResultsNote && <p className="demo-caption">{t('results.note')}</p>}
      </Reveal>
    </section>
  );
}
