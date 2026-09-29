import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { siteConfig as c } from '../config/siteConfig';
import { useT } from '../i18n';
export default function Seo() {
  const { t, lang } = useT(),
    location = useLocation();
  useEffect(() => {
    const title =
      location.pathname === '/admin'
        ? t('admin.title')
        : location.pathname === '/booking'
          ? t('booking.heading')
          : location.pathname === '/privacy'
            ? t('privacy.title')
            : location.pathname === '/'
              ? t('seo.title', { city: c.brand.cityLocative[lang] })
              : '404';
    document.title = title + ' — ' + c.brand.name;
    const desc = t('hero.body');
    const set = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
        document.head.append(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    };
    set('meta[name="description"]', { name: 'description', content: desc });
    const canonical = c.brand.url + location.pathname;
    set('link[rel="canonical"]', { rel: 'canonical', href: canonical });
    for (const [property, content] of Object.entries({
      'og:title': document.title,
      'og:description': desc,
      'og:type': 'website',
      'og:url': canonical,
      'og:locale': lang === 'ru' ? 'ru_KZ' : 'kk_KZ',
      'og:image': c.brand.url + '/og-placeholder.svg',
    }))
      set(`meta[property="${property}"]`, { property, content });
    for (const [name, content] of Object.entries({
      'twitter:card': 'summary_large_image',
      'twitter:title': document.title,
      'twitter:description': desc,
      'twitter:image': c.brand.url + '/og-placeholder.svg',
    }))
      set(`meta[name="${name}"]`, { name, content });
    let schema = document.getElementById('dentist-schema');
    if (!schema) {
      schema = document.createElement('script');
      schema.id = 'dentist-schema';
      schema.type = 'application/ld+json';
      document.head.append(schema);
    }
    const days = {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday',
    };
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      name: c.brand.name,
      url: c.brand.url,
      telephone: c.contacts.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: c.address[lang],
        addressLocality: c.brand.city[lang],
        addressCountry: 'KZ',
      },
      openingHoursSpecification: Object.entries(c.hours.weekly)
        .filter(([, v]) => v)
        .map(([key, v]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: days[key],
          opens: v[0],
          closes: v[1],
        })),
      sameAs: [c.contacts.instagram, c.contacts.telegram, c.contacts.twoGis],
    });
  }, [location.pathname, lang, t]);
  return null;
}
