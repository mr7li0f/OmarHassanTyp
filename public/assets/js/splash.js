(function () {
  const labels = {
    ar: { title: 'عمر حسن | Loading', name: 'عمر حسن', sub: 'جاري تجهيز مكتبة الخطوط...' },
    ku: { title: 'عومەر حەسەن | Loading', name: 'عومەر حەسەن', sub: 'ئامادەکردنی کتێبخانەی فۆنت...' },
    en: { title: 'Omar Hassan | Loading', name: 'Omar Hassan', sub: 'Preparing type library...' }
  };

  const pickLang = () => {
    const qsLang = String(new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
    const saved = (localStorage.getItem('oh_site_lang') || '').toLowerCase();
    const detect = (value) => {
      if (value.startsWith('ar')) return 'ar';
      if (value.startsWith('ku') || value.startsWith('ckb') || value.startsWith('kur')) return 'ku';
      if (value.startsWith('en')) return 'en';
      return '';
    };
    const byQuery = detect(qsLang);
    if (byQuery) return byQuery;
    const bySaved = detect(saved);
    if (bySaved) return bySaved;
    const browser = (navigator.languages && navigator.languages[0]) || navigator.language || 'ar';
    return detect(String(browser).toLowerCase()) || 'ar';
  };

  const lang = pickLang();
  document.documentElement.lang = lang === 'ku' ? 'ku' : lang;
  document.documentElement.dir = (lang === 'en') ? 'ltr' : 'rtl';

  const currentLabel = labels[lang] || labels.ar;
  const splashName = document.querySelector('.splash-name');
  const splashLogo = document.getElementById('splash-logo');
  const sub = document.getElementById('loading-sub');
  document.title = currentLabel.title;
  if (splashName) splashName.textContent = currentLabel.name;
  if (splashLogo) splashLogo.alt = currentLabel.name;
  if (sub) sub.textContent = currentLabel.sub;

  setTimeout(() => {
    window.location.replace(`./home.html?v=20260418.8&lang=${encodeURIComponent(lang)}`);
  }, 2600);
})();
