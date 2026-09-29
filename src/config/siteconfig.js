export const siteConfig = {
  isDemo: true, // TODO: replace with real data
  brand: {
    name: 'Nova Dent',
    city: { ru: 'Астана', kk: 'Астана' },
    cityLocative: { ru: 'Астане', kk: 'Астанадағы' },
    url: 'https://nova-dent-astana.daurenserikbay61.chatgpt.site',
  }, // TODO: replace with real data
  contacts: {
    phone: '+77010000000',
    phoneDisplay: '+7 (701) 000-00-00',
    instagram: 'https://www.instagram.com/',
    telegram: 'https://t.me/',
    whatsapp: 'https://wa.me/77010000000',
    twoGis: 'https://2gis.kz/astana',
    email: 'hello@example.com',
  }, // TODO: replace with real data
  address: { ru: 'проспект Мәңгілік Ел, 36', kk: 'Мәңгілік Ел даңғылы, 36', parking: true }, // TODO: replace with real data
  hours: {
    timezone: 'Asia/Almaty',
    weekly: {
      mon: ['09:00', '21:00'],
      tue: ['09:00', '21:00'],
      wed: ['09:00', '21:00'],
      thu: ['09:00', '21:00'],
      fri: ['09:00', '21:00'],
      sat: ['10:00', '20:00'],
      sun: ['10:00', '20:00'],
    },
    slotMinutes: 30,
    closedDates: [],
  }, // TODO: replace with real data
  responseMinutes: 5, // TODO: replace with real data
  rating: '4.9', // TODO: replace with real data
  minExperience: 8, // TODO: replace with real data
  stats: [
    { value: 10, suffix: '+', key: 'years' },
    { value: 5000, suffix: '+', key: 'patients' },
    { value: 6, suffix: '', key: 'specialists' },
    { value: 5, suffix: '', key: 'warranty' },
  ], // TODO: replace with real data
  guarantees: [
    { value: '5', unit: 'years', key: 'work' },
    { value: '10', unit: 'years', key: 'restorations' },
    { value: '∞', unit: 'lifetime', key: 'implants' },
    { value: '0%', unit: 'installment', key: 'payments' },
  ], // TODO: replace with real data
  services: [
    { id: 'caries', icon: 'tooth', duration: 60, priceFrom: 25000 }, // TODO: replace with real data
    { id: 'implants', icon: 'implant', duration: 90, priceFrom: 180000 }, // TODO: replace with real data
    { id: 'orthodontics', icon: 'braces', duration: 45, priceFrom: 150000 }, // TODO: replace with real data
    { id: 'prosthetics', icon: 'crown', duration: 60, priceFrom: 90000 }, // TODO: replace with real data
    { id: 'hygiene', icon: 'sparkle', duration: 60, priceFrom: 20000 }, // TODO: replace with real data
  ],
  doctors: [
    {
      id: 'aidos',
      name: { ru: 'Айдос Нурланов', kk: 'Айдос Нұрланов' },
      specialty: 'surgeon',
      experience: 12,
      tags: ['implants', 'surgery'],
      education: {
        ru: 'Учебный профиль: медицинский университет, курсы по имплантологии.',
        kk: 'Үлгі профиль: медицина университеті, имплантология курстары.',
      },
      photo: null,
    }, // TODO: replace with real data
    {
      id: 'aliya',
      name: { ru: 'Алия Садыкова', kk: 'Әлия Садықова' },
      specialty: 'therapist',
      experience: 9,
      tags: ['therapy', 'microscope'],
      education: {
        ru: 'Учебный профиль: медицинский университет, курсы по эндодонтии.',
        kk: 'Үлгі профиль: медицина университеті, эндодонтия курстары.',
      },
      photo: null,
    }, // TODO: replace with real data
    {
      id: 'timur',
      name: { ru: 'Тимур Аскаров', kk: 'Тимур Асқаров' },
      specialty: 'orthodontist',
      experience: 8,
      tags: ['braces', 'aligners'],
      education: {
        ru: 'Учебный профиль: медицинский университет, курсы по ортодонтии.',
        kk: 'Үлгі профиль: медицина университеті, ортодонтия курстары.',
      },
      photo: null,
    }, // TODO: replace with real data
    {
      id: 'madina',
      name: { ru: 'Мадина Омарова', kk: 'Мәдина Омарова' },
      specialty: 'prosthodontist',
      experience: 10,
      tags: ['veneers', 'crowns'],
      education: {
        ru: 'Учебный профиль: медицинский университет, курсы по ортопедии.',
        kk: 'Үлгі профиль: медицина университеті, ортопедия курстары.',
      },
      photo: null,
    }, // TODO: replace with real data
  ],
  reviews: [
    {
      id: 'r1',
      name: 'Анастасия К.',
      date: '2026-08-14',
      service: 'caries',
      text: {
        ru: 'Впервые на приёме было спокойно. Врач объяснил каждый шаг, а стоимость обсудили до начала лечения.',
        kk: 'Қабылдауда өзімді жайлы сезіндім. Дәрігер әр қадамды түсіндіріп, ем құнын алдын ала айтты.',
      },
      stars: 5,
    }, // PLACEHOLDER: replace with real reviews // TODO: replace with real data
    {
      id: 'r2',
      name: 'Ерлан М.',
      date: '2026-08-08',
      service: 'hygiene',
      text: {
        ru: 'Пришёл на гигиену. Всё аккуратно, без спешки. Получил понятные рекомендации по уходу.',
        kk: 'Тіс тазалатуға келдім. Бәрін ұқыпты, асықпай жасады. Күтім туралы түсінікті кеңес алдым.',
      },
      stars: 5,
    }, // PLACEHOLDER: replace with real reviews // TODO: replace with real data
    {
      id: 'r3',
      name: 'Айгерим С.',
      date: '2026-07-29',
      service: 'orthodontics',
      text: {
        ru: 'Подробно сравнили варианты исправления прикуса. Было время задать все вопросы и подумать.',
        kk: 'Тістемді түзету жолдарын толық салыстырдық. Барлық сұрағымды қойып, ойлануға уақыт берді.',
      },
      stars: 5,
    }, // PLACEHOLDER: replace with real reviews // TODO: replace with real data
    {
      id: 'r4',
      name: 'Дмитрий А.',
      date: '2026-07-20',
      service: 'implants',
      text: {
        ru: 'Понравилось, что план лечения разбили на этапы. Всегда понимал, что будет на следующем приёме.',
        kk: 'Емдеу жоспарын кезеңдерге бөлгені ұнады. Келесі қабылдауда не болатынын біліп отырдым.',
      },
      stars: 5,
    }, // PLACEHOLDER: replace with real reviews // TODO: replace with real data
    {
      id: 'r5',
      name: 'Дана Т.',
      date: '2026-07-12',
      service: 'prosthetics',
      text: {
        ru: 'Внимательная команда и спокойная атмосфера. Результат обсудили заранее, подобрали естественный оттенок.',
        kk: 'Ұжым мұқият, орта тыныш. Нәтижені алдын ала талқылап, табиғи реңк таңдадық.',
      },
      stars: 5,
    }, // PLACEHOLDER: replace with real reviews // TODO: replace with real data
  ],
  faq: ['pain', 'prepare', 'child', 'booking', 'installment', 'frequency'], // TODO: replace with real data
  cases: [
    { id: 'case1', key: 'hygiene', before: null, after: null },
    { id: 'case2', key: 'prosthetics', before: null, after: null },
    { id: 'case3', key: 'orthodontics', before: null, after: null },
  ], // TODO: replace with real data
  images: { team: '/images/team.webp', clinic: '/images/clinic.webp' }, // TODO: replace with real data
  legal: {
    license: {
      ru: 'Лицензия на медицинскую деятельность № [номер]',
      kk: 'Медициналық қызмет лицензиясы № [нөмір]',
    },
    showResultsNote: true,
  }, // TODO: replace with real data
};
