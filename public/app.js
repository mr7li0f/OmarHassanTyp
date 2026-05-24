let token = null;
let authenticatedAdminUsername = '';
let contentData = {};
let currentFontId = null;
let _pickerTarget = null;
let isStaticMode = false;
let detailGalleryImages = [];
let detailGalleryTitle = '';
let detailGalleryActiveIndex = 0;
let viewerIndex = 0;
let currentLanguage = 'ar';
let currentThemeMode = 'auto';
let hasThemeMediaListener = false;
let publicFontStatsById = {};
let displayFontSourceIdsById = {};
let downloadNameResolver = null;
let currentFontDownloadUrl = '';
let currentFontDownloadTitle = '';
let currentFontZipUrl = '';
let currentFontWeightOptions = [];
let currentWeightPreviewFamilyByWeight = {};
let currentWeightPreviewFamilyByIndex = {};
let jsZipLoadPromise = null;
let isPageNavigating = false;
const fontFilterState = { query: '', weight: 'all', license: 'all', price: 'all' };

const STATIC_CONTENT_URL = './content.json';
const API_ROOT = '/api';
const OWNER_ADMIN_USERNAME = '';
const URL_SCHEME_RE = /^(?:https?:|data:|blob:|mailto:|tel:)/i;
const URL_PROTOCOL_RELATIVE_RE = /^(?:[a-z]+:)?\/\//i;
const LANGUAGE_STORAGE_KEY = 'oh_site_lang';
const THEME_STORAGE_KEY = 'oh_site_theme';
const VISITOR_NAME_STORAGE_KEY = 'oh_visitor_name';
const VISITOR_COUNT_CACHE_STORAGE_KEY = 'oh_visitor_count_cache';
const VISITOR_COUNT_LOCAL_STORAGE_KEY = 'oh_visitor_count_local';
const VISITOR_COUNT_HIT_SESSION_KEY = 'oh_visitor_count_hit_session';
const VISITOR_COUNT_LOCAL_SESSION_KEY = 'oh_visitor_count_local_session';
const VISITOR_COUNTER_TIMEOUT_MS = 7000;
const CONTENT_CACHE_STORAGE_KEY = 'oh_cached_content';
const USER_PREVIEW_PHRASE_STORAGE_KEY = 'oh_user_preview_phrase';
const PAGE_TRANSITION_STORAGE_KEY = 'oh_page_transition_pending';
const FALLBACK_IMAGE_URL = './logo.jpeg';
const IMAGE_ONERROR_ATTR = "this.onerror=null;this.classList.add('broken-image');this.src='./logo.jpeg';";
const PAGE_TRANSITION_MS = 260;
const RTL_LANGS = ['ar', 'ku'];
const THEME_MODES = ['auto', 'morning', 'night'];
const PAGE_ROUTES = {
  home: './home.html',
  fonts: './fonts.html',
  accounts: './home.html',
  font: './font.html'
};
const QAHWA_ALLOWED_WEIGHTS = ['Medium', 'Bold', 'Black'];
const ALL_FONTS_ZIP_DIRECT_URL = '/data/All-Fonts/All-OmarHassanType-Fonts.zip';
const KNOWN_FONT_ZIP_FALLBACKS = [
  { pattern: /(^|\s)(قهوة|qahwa)(\s|$)/i, url: '/data/qahwa/fonts/Qahwa-fonts.zip' },
  { pattern: /(^|\s)(المهندس|engineer)(\s|$)/i, url: '/data/Engineer Font/fonts/Engineer-fonts.zip' }
];
const SEO_LANGS = ['ar', 'en', 'ku'];
const SEO_OG_LOCALE_BY_LANG = {
  ar: 'ar_AR',
  en: 'en_US',
  ku: 'ku_Arab_IQ'
};
const SEO_TEXT = {
  ar: {
    siteName: 'عمر حسن تايب',
    homeTitle: 'عمر حسن تايب | مصمم خطوط عربية',
    homeDescription: 'موقع عمر حسن لتصميم الخطوط العربية: عرض الخطوط، الأوزان، التفاصيل، وروابط الحسابات الرسمية.',
    fontsTitle: 'مكتبة الخطوط | عمر حسن تايب',
    fontsDescription: 'مكتبة كاملة لخطوط عمر حسن مع معاينات بصرية، تفاصيل كل خط، والأوزان المتاحة للتحميل.',
    fontDescriptionFallback: 'تفاصيل خط عربي من تصميم عمر حسن مع صور معاينة، الأوزان، وخيارات التحميل.'
  },
  en: {
    siteName: 'Omar Hassan Type',
    homeTitle: 'Omar Hassan Type | Arabic Type Designer',
    homeDescription: 'Official Omar Hassan Type portfolio for Arabic fonts, font weights, previews, and verified account links.',
    fontsTitle: 'Font Library | Omar Hassan Type',
    fontsDescription: 'Browse Omar Hassan Arabic fonts with visual previews, detailed pages, and downloadable weight options.',
    fontDescriptionFallback: 'Arabic font details by Omar Hassan with previews, available weights, and download options.'
  },
  ku: {
    siteName: 'عومەر حەسەن تایپ',
    homeTitle: 'عومەر حەسەن تایپ | دیزاینەری فۆنتی عەرەبی',
    homeDescription: 'ماڵپەڕی عومەر حەسەن بۆ فۆنتی عەرەبی: پیشاندانی فۆنت، کێشەکان، وردەکاری و بەستەری هەژمارە فەرمییەکان.',
    fontsTitle: 'کتێبخانەی فۆنت | عومەر حەسەن تایپ',
    fontsDescription: 'کتێبخانەی تەواوی فۆنتەکانی عومەر حەسەن لەگەڵ پیشاندانی بینراو، وردەکاری هەر فۆنت و کێشە بەردەستەکان.',
    fontDescriptionFallback: 'وردەکاری فۆنتی عەرەبی لەلایەن عومەر حەسەن، لەگەڵ وێنەی پیشاندان، کێشەکان و هەڵبژاردەکانی داگرتن.'
  }
};
const SEO_GLOBAL_KEYWORDS = [
  'Omar Hassan',
  'Omar Hassan Type',
  'Arabic fonts',
  'Arabic typeface',
  'Kufi font',
  'Font weights',
  'Type designer',
  'خطوط عربية',
  'تصميم خطوط',
  'أوزان الخط',
  'تحميل خط',
  'مصمم خطوط',
  'فۆنتی عەرەبی',
  'دیزاینی فۆنت',
  'کێشەکانی فۆنت',
  'داگرتنی فۆنت',
  'عمر حسن',
  'عُمَر حسَن',
  'عومەر حەسەن'
];
const BRAND_NAME_BY_LANG = {
  ar: 'عُمَر حسَن',
  en: 'Omar Hassan',
  ku: 'عومەر حەسەن'
};
const SEO_KEYWORDS_BY_LANG = {
  ar: ['الخطوط', 'الخط العربي', 'مكتبة الخطوط', 'حسابات عمر حسن', 'روابط المصمم'],
  en: ['font library', 'Arabic calligraphy font', 'font showcase', 'designer accounts', 'type portfolio'],
  ku: ['کتێبخانەی فۆنت', 'فۆنتی عەرەبی', 'پیشاندانی فۆنت', 'هەژمارەکانی دیزاینەر', 'پۆرتفۆلیۆی تایپ']
};
const QAHWA_DESCRIPTION_BY_LANG = {
  en: 'Qahwa Arabic is a beautiful, modern Arabic typeface with a refined look, crafted to shine in headlines and logos. Designed and programmed by Omar Hassan in 2026.',
  ar: 'خط قهوة العربي هو خط عربي جميل وعصري بطابع أنيق، ومصمم خصيصا ليبرز في العناوين والشعارات. تم تصميمه وبرمجته بواسطة عمر حسن في عام 2026.',
  ku: 'فۆنتی عەرەبی قەھوە فۆنتێکی عەرەبی جوان و مۆدێرنە بە شێوازێکی نازدار، و تایبەتمەندە بۆ ناونیشان و لۆگۆ. لە ساڵی 2026 لەلایەن عومەر حەسەنەوە دیزاین و پڕۆگرام کراوە.'
};
const EMERGENCY_CONTENT_FALLBACK = {
  fonts: [
    {
      id: 1,
      title: 'قهوة',
      title_en: 'Qahwa Arabic',
      description_ar: 'خط قهوة العربي هو خط عربي جميل وعصري بطابع أنيق، ومصمم خصيصا ليبرز في العناوين والشعارات. تم تصميمه وبرمجته بواسطة عمر حسن في عام 2026.',
      description_en: 'Qahwa Arabic is a beautiful, modern Arabic typeface with a refined look, crafted to shine in headlines and logos. Designed and programmed by Omar Hassan in 2026.',
      description_ku: 'فۆنتی عەرەبی قەھوە فۆنتێکی عەرەبی جوان و مۆدێرنە بە شێوازێکی نازدار، و تایبەتمەندە بۆ ناونیشان و لۆگۆ. لە ساڵی 2026 لەلایەن عومەر حەسەنەوە دیزاین و پڕۆگرام کراوە.',
      downloadUrl: '/data/qahwa/fonts/QahwaArabicMedium.otf',
      fontFile: '/data/qahwa/fonts/QahwaArabicMedium.otf',
      images: ['/data/qahwa/photos/1.jpg'],
      weights: ['Medium', 'Bold', 'Black'],
      weightFiles: {
        Medium: '/data/qahwa/fonts/QahwaArabicMedium.otf',
        Bold: '/data/qahwa/fonts/Qahwa Arabic Bold.otf',
        Black: '/data/qahwa/fonts/QahwaArabicBlack.otf'
      },
      isPaid: false
    },
    {
      id: 2,
      title: 'موناكو كوفي',
      title_en: 'Monaco Kufi',
      description_ar: 'موناكو كوفي هو خط كوفي مربع جميل ومبتكر، مستوحى من الأشكال الأصيلة للخط الكوفي الأصلي. تم تصميم الخط وبرمجته بواسطة عمر حسن تايب.',
      description_en: 'Monaco Kufi is a beautiful and innovative square Kufi typeface inspired by the authentic forms of the original Kufi script.',
      description_ku: 'مۆناکۆ کوفی فۆنتێکی کوفی چوارگۆشەی جوان و داهێنەرانەیە، ئیلهام لە شێوە ڕەسەنەکانی ڕێنووسی کوفی ڕەسەن وەرگیراوە.',
      downloadUrl: '/data/Monaco Kufi/fonts/Monaco-Kufi.otf',
      fontFile: '/data/Monaco Kufi/fonts/Monaco-Kufi.otf',
      images: ['/data/Monaco Kufi/photos/1.jpg'],
      weights: ['Regular'],
      weightFiles: {
        Regular: '/data/Monaco Kufi/fonts/Monaco-Kufi.otf'
      },
      isPaid: false
    },
    {
      id: 3,
      title: 'المهندس',
      title_en: 'Engineer Font',
      description_ar: 'تم إصدار خط المهندس عام ٢٠٢٦. وهو خط هندسي جديد ومميز، صممه بالكامل ثامر السطام، بمساهمة عمر حسن في بعض الحروف، وبرمجه عمر حسن.',
      description_en: 'Engineer Font was released in 2026 as a distinctive geometric Arabic typeface, designed by Thamer Al-Sattam with contributions and programming by Omar Hassan.',
      description_ku: 'فۆنتی ئەندازیاری لە ساڵی ٢٠٢٦ بڵاوکراوەتەوە. فۆنتێکی ئەندازیاری نوێی جیاوازە بە بەشداری عومەر حەسەن لە هەندێک پیت، و بەرنامەسازی لەلایەن عومەر حەسەن.',
      downloadUrl: '/data/Engineer Font/fonts/Engineer Regular.otf',
      fontFile: '/data/Engineer Font/fonts/Engineer Regular.otf',
      images: ['/data/Engineer Font/photos/1.jpg'],
      weights: ['Regular'],
      weightFiles: {
        Regular: '/data/Engineer Font/fonts/Engineer Regular.otf',
        Salt: '/data/Engineer Font/fonts/Engineer-Salt.otf'
      },
      isPaid: false
    },
    {
      id: 4,
      title: 'ميلان للعناوين',
      title_en: 'Milan Display',
      description_ar: 'خط ميلان للعناوين هو خط عربي جميل وعصري، أنيق للغاية، ومناسب للعناوين والشعارات. صممه وبرمجه عمر حسن عام 2026.',
      description_en: 'Milan Display Font is a beautiful and modern Arabic font, very elegant, suitable for titles and logos. It was designed and programmed by Omar Hassan in 2026.',
      description_ku: 'میلان دیسپلەی فۆنت فۆنتێکی عەرەبی جوان و مۆدێرن، زۆر ڕەسەنە، گونجاوە بۆ ناونیشان و لۆگۆ. لە ساڵی ٢٠٢٦ لەلایەن عومەر حەسەنەوە دیزاین و بەرنامە بۆ دانراوە.',
      downloadUrl: '/data/Milan Display/fonts/Milan Display Black.otf',
      fontFile: '/data/Milan Display/fonts/Milan Display Black.otf',
      images: ['/data/Milan Display/photos/cover.jpg', '/data/Milan Display/photos/1.jpg', '/data/Milan Display/photos/2.jpg', '/data/Milan Display/photos/3.jpg', '/data/Milan Display/photos/4.jpg', '/data/Milan Display/photos/5.jpg', '/data/Milan Display/photos/6.jpg', '/data/Milan Display/photos/7.jpg'],
      weights: ['Black'],
      weightFiles: {
        Black: '/data/Milan Display/fonts/Milan Display Black.otf',
        'Black Swashes': '/data/Milan Display/fonts/Milan Display Black Swashes.otf'
      },
      zipUrl: '/data/Milan Display/fonts/Milan Display Black.zip',
      isPaid: false,
      isNew: true,
      createdAt: '2026-05-23T00:00:00Z'
    }
  ],
  socialLinks: [],
  workLinks: []
};
const DEFAULT_PREVIEW_PHRASE_AR = 'أبجد هوز حطي كلمن سعفص قرشت';
const LEGACY_PREVIEW_PHRASE_AR = 'أهلا وسهلا بكم في معاينة الخط';
const pageType = (document.body?.dataset?.page || 'home').toLowerCase();

const I18N = {
  ar: {
    typeDesigner: 'أصمّم خطوطا عربية بروح معاصرة وتفاصيل دقيقة، مع تجارب عرض واضحة لكل خط.',
    homeLead: 'أصمّم خطوطا عربية بروح معاصرة وتفاصيل دقيقة، مع تجارب عرض واضحة لكل خط.',
    visitorsLabel: 'الزوار',
    drawerHome: 'الرئيسية',
    drawerFonts: 'الخطوط',
    drawerAccounts: 'الحسابات',
    drawerSettings: 'الإعدادات',
    metricFonts: 'عدد الخطوط',
    metricPosters: 'النماذج',
    metricWeights: 'الأوزان',
    libraryTitle: 'مكتبة الخطوط',
    librarySub: 'تصفح الخطوط بمعاينات واضحة وصور مرتبة لاختيار أسرع.',
    discoverRandom: 'اقتراح خط عشوائي',
    searchPlaceholder: 'ابحث عن خط...',
    noSearchResults: 'لا توجد خطوط مطابقة للبحث',
    accountsPersonal: 'الحسابات الشخصية',
    accountsWork: 'حسابات العمل',
    back: 'رجوع',
    downloadFont: 'تحميل الخط',
    downloadZip: 'تحميل ZIP',
    downloadZipPreparing: 'جاري تجهيز ملف ZIP...',
    downloadZipFailed: 'تعذّر تجهيز ZIP، سيتم التحميل المباشر.',
    downloadWeightsTitle: 'اختيار وزن التحميل',
    downloadWeightAction: 'تحميل {weight}',
    downloadAllWeightsZip: 'تحميل كل الأوزان ZIP',
    downloadAllFontsZip: 'تحميل كل الخطوط ZIP',
    downloadAllFontsZipPreparing: 'جاري تجهيز ZIP لكل الخطوط...',
    noDownloadFiles: 'لا توجد ملفات خطوط جاهزة للتحميل حالياً.',
    downloadDirectFailed: 'تعذّر تحميل الملف مباشرة. تأكد أن ملف الخط مرفوع داخل الموقع.',
    filterWeight: 'الأوزان',
    filterLicense: 'الترخيص',
    filterPrice: 'النوع',
    filterAnyWeight: 'كل الأوزان',
    filterAnyLicense: 'كل التراخيص',
    filterAnyPrice: 'مجاني + مدفوع',
    filterPriceFree: 'مجاني',
    filterPricePaid: 'مدفوع',
    filterButton: 'فلتر',
    resetFilters: 'إعادة ضبط',
    usernamePlaceholder: 'اسم المستخدم',
    passwordPlaceholder: 'كلمة المرور',
    settingsButton: 'الإعدادات',
    settingsTitle: 'الإعدادات',
    settingsLanguage: 'اللغة',
    settingsTheme: 'المظهر',
    settingsUserName: 'اسمك',
    settingsUserNamePlaceholder: 'اكتب اسمك لعمليات التحميل',
    settingsSave: 'حفظ الإعدادات',
    langArabic: 'العربية',
    langKurdish: 'کوردی',
    langEnglish: 'English',
    themeAuto: 'تلقائي',
    themeMorning: 'صباحي',
    themeNight: 'ليلي',
    settingsSaved: 'تم حفظ الإعدادات ✓',
    guestUser: 'زائر',
    downloadGateTitle: 'قبل التحميل',
    downloadGateText: 'قبل تحميل الخط، اكتب اسمك أولاً ثم أكمل التحميل.',
    downloadGateConfirm: 'تأكيد ومتابعة التحميل',
    downloadGateCancel: 'إلغاء',
    downloadBlockedNoName: 'يجب كتابة الاسم قبل تحميل الخط.',
    menuLabel: 'القائمة',
    previous: 'السابق',
    next: 'التالي',
    close: 'إغلاق',
    tabFonts: 'الخطوط',
    socialLinksTitle: 'روابط الحسابات الشخصية',
    workLinksTitle: 'روابط حسابات العمل',
    addAccount: '+ إضافة حساب',
    saveAction: 'حفظ',
    addFontTitle: 'إضافة خط',
    addFontSubmit: 'إضافة الخط',
    statsSiteTitle: 'إحصائيات الموقع',
    totalVisits: 'إجمالي الزيارات',
    todayVisits: 'زيارات اليوم',
    fontStatsTitle: 'إحصائيات الخطوط — المشاهدات والتحميلات',
    editFontTitle: 'تعديل الخط',
    saveChanges: 'حفظ التعديلات',
    editAction: 'تعديل',
    deleteAction: 'حذف',
    hasFontFile: '✓ ملف الخط موجود',
    missingFontFile: '⚠ ملف الخط مفقود',
    currentFileLabel: 'الملف الحالي: {filename}',
    noCurrentFile: 'لا يوجد ملف خط — ارفع الملف لتفعيل المعاينة',
    featureLogin: 'تسجيل الدخول',
    featureAdmin: 'لوحة التحكم',
    featureSavePersonal: 'حفظ الحسابات الشخصية',
    featureSaveWork: 'حفظ حسابات العمل',
    featureAddFont: 'إضافة الخطوط',
    featureDeleteFont: 'حذف الخطوط',
    featureEditFont: 'تعديل الخطوط',
    featureStats: 'الإحصائيات',
    runtimeReadonly: 'وضع القراءة فقط',
    runtimeLive: 'Live CMS',
    readonlyTitle: 'وضع القراءة فقط (تعذّر الاتصال بالسيرفر)',
    featureUnavailable: '{feature} متاحة فقط عند تشغيل السيرفر.',
    contentLoadError: 'تعذّر تحميل المحتوى حالياً. أعد تحديث الصفحة ثم حاول مرة أخرى.',
    noFontsAvailable: 'لا توجد خطوط لعرضها حالياً',
    linksPersonalEmpty: 'لم تُضف روابط شخصية بعد',
    linksWorkEmpty: 'لم تُضف روابط العمل بعد',
    accountLabel: 'حساب',
    fontUntitled: 'خط',
    fontPoster: 'ملصق خط',
    viewImage: 'عرض صورة {index}',
    externalLink: 'رابط خارجي',
    paid: 'مدفوع',
    free: 'مجاني',
    openFontDetails: 'فتح تفاصيل {title}',
    galleryNoImages: 'لا توجد صور لهذا الخط حالياً',
    weightsLabel: 'الأوزان',
    licenseLabel: 'الترخيص',
    freeWeightsLabel: 'الأوزان المجانية',
    paidWeightsLabel: 'الأوزان المدفوعة',
    viewerCaption: '{title} • {index} / {total}',
    saveSuccess: 'تم الحفظ ✓',
    saveFail: 'فشل الحفظ',
    addSuccess: 'تمت الإضافة ✓',
    addFail: 'فشل الإضافة',
    deleteSuccess: 'تم الحذف ✓',
    deleteFail: 'فشل الحذف',
    updateSuccess: 'تم الحفظ ✓',
    updateFail: 'فشل الحفظ',
    noStatsData: 'لا توجد بيانات بعد',
    statsLoadError: 'تعذّر تحميل الإحصائيات',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    viewsShort: 'مشاهدات',
    downloadsShort: 'تحميلات',
    uniqueUsersShort: 'مستخدمون',
    totalFontViews: 'إجمالي مشاهدات الخطوط',
    totalDownloads: 'إجمالي التحميلات',
    conversionRate: 'معدل التحويل',
    recentDownloads: 'آخر التحميلات',
    noRecentDownloads: 'لا توجد تحميلات حديثة',
    topFont: 'الأكثر أداءً',
    badgeNew: 'جديد',
    badgeUpdated: 'محدّث',
    weightPreviewTitle: 'معاينة كل وزن',
    weightPreviewHint: 'نص المعاينة',
    updatedAtLabel: 'آخر تحديث',
    createdAtLabel: 'تاريخ الإضافة'
  },
  en: {
    typeDesigner: 'I design Arabic typefaces with a contemporary spirit and precise details, with clear showcase experiences for every font.',
    homeLead: 'Arabic type design with contemporary identity, visual precision, and showcase experiences that reveal each font personality.',
    visitorsLabel: 'Visitors',
    drawerHome: 'Home',
    drawerFonts: 'Fonts',
    drawerAccounts: 'Accounts',
    drawerSettings: 'Settings',
    metricFonts: 'Fonts',
    metricPosters: 'Posters',
    metricWeights: 'Weights',
    libraryTitle: 'Font Library',
    librarySub: 'Posters and visual studies that reflect each typeface spirit.',
    discoverRandom: 'Discover Random Font',
    searchPlaceholder: 'Search for a font...',
    noSearchResults: 'No search results found',
    accountsPersonal: 'Personal Accounts',
    accountsWork: 'Work Accounts',
    back: 'Back',
    downloadFont: 'Download Font',
    downloadZip: 'Download ZIP',
    downloadZipPreparing: 'Preparing ZIP file...',
    downloadZipFailed: 'ZIP creation failed, direct download will open.',
    downloadWeightsTitle: 'Choose Weight Download',
    downloadWeightAction: 'Download {weight}',
    downloadAllWeightsZip: 'Download All Weights ZIP',
    downloadAllFontsZip: 'Download All Fonts ZIP',
    downloadAllFontsZipPreparing: 'Preparing full fonts ZIP...',
    noDownloadFiles: 'No downloadable font files available right now.',
    downloadDirectFailed: 'Direct download failed. Make sure font files are uploaded to the site.',
    filterWeight: 'Weight',
    filterLicense: 'License',
    filterPrice: 'Type',
    filterAnyWeight: 'All Weights',
    filterAnyLicense: 'All Licenses',
    filterAnyPrice: 'Free + Paid',
    filterPriceFree: 'Free',
    filterPricePaid: 'Paid',
    filterButton: 'Filter',
    resetFilters: 'Reset',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    settingsButton: 'Settings',
    settingsTitle: 'General Settings',
    settingsLanguage: 'Language',
    settingsTheme: 'Appearance',
    settingsUserName: 'Display Name',
    settingsUserNamePlaceholder: 'Enter your name for downloads',
    settingsSave: 'Save Settings',
    langArabic: 'Arabic',
    langKurdish: 'Kurdish',
    langEnglish: 'English',
    themeAuto: 'Auto',
    themeMorning: 'Morning',
    themeNight: 'Night',
    settingsSaved: 'Settings saved ✓',
    guestUser: 'Guest',
    downloadGateTitle: 'Before Download',
    downloadGateText: 'Please enter your name before downloading this font.',
    downloadGateConfirm: 'Confirm and Download',
    downloadGateCancel: 'Cancel',
    downloadBlockedNoName: 'You must enter your name before downloading.',
    menuLabel: 'Menu',
    previous: 'Previous',
    next: 'Next',
    close: 'Close',
    tabFonts: 'Fonts',
    socialLinksTitle: 'Personal account links',
    workLinksTitle: 'Work account links',
    addAccount: '+ Add account',
    saveAction: 'Save',
    addFontTitle: 'Add Font',
    addFontSubmit: 'Add Font',
    statsSiteTitle: 'Site Statistics',
    totalVisits: 'Total Visits',
    todayVisits: 'Today\'s Visits',
    fontStatsTitle: 'Font Stats — Views and Downloads',
    editFontTitle: 'Edit Font',
    saveChanges: 'Save Changes',
    editAction: 'Edit',
    deleteAction: 'Delete',
    hasFontFile: '✓ Font file attached',
    missingFontFile: '⚠ Missing font file',
    currentFileLabel: 'Current file: {filename}',
    noCurrentFile: 'No font file yet — upload one to enable preview',
    featureLogin: 'Login',
    featureAdmin: 'Admin panel',
    featureSavePersonal: 'Save personal accounts',
    featureSaveWork: 'Save work accounts',
    featureAddFont: 'Add fonts',
    featureDeleteFont: 'Delete fonts',
    featureEditFont: 'Edit fonts',
    featureStats: 'Statistics',
    runtimeReadonly: 'Read-only Mode',
    runtimeLive: 'Live CMS',
    readonlyTitle: 'Read-only mode (server unavailable)',
    featureUnavailable: '{feature} is only available while the server is running.',
    contentLoadError: 'Failed to load content. Make sure content.json exists inside public.',
    noFontsAvailable: 'No fonts available yet',
    linksPersonalEmpty: 'No personal links added yet',
    linksWorkEmpty: 'No work links added yet',
    accountLabel: 'Account',
    fontUntitled: 'Font',
    fontPoster: 'Font poster',
    viewImage: 'View image {index}',
    externalLink: 'External link',
    paid: 'Paid',
    free: 'Free',
    openFontDetails: 'Open details for {title}',
    galleryNoImages: 'No images for this font yet',
    weightsLabel: 'Weights',
    licenseLabel: 'License',
    freeWeightsLabel: 'Free Weights',
    paidWeightsLabel: 'Paid Weights',
    viewerCaption: '{title} • {index} / {total}',
    saveSuccess: 'Saved ✓',
    saveFail: 'Save failed',
    addSuccess: 'Added ✓',
    addFail: 'Add failed',
    deleteSuccess: 'Deleted ✓',
    deleteFail: 'Delete failed',
    updateSuccess: 'Updated ✓',
    updateFail: 'Update failed',
    noStatsData: 'No data yet',
    statsLoadError: 'Failed to load stats',
    confirmDelete: 'Are you sure you want to delete this item?',
    viewsShort: 'Views',
    downloadsShort: 'Downloads',
    uniqueUsersShort: 'Users',
    totalFontViews: 'Total Font Views',
    totalDownloads: 'Total Downloads',
    conversionRate: 'Conversion Rate',
    recentDownloads: 'Recent Downloads',
    noRecentDownloads: 'No recent downloads',
    topFont: 'Top Performing Font',
    badgeNew: 'New',
    badgeUpdated: 'Updated',
    weightPreviewTitle: 'Weight Previews',
    weightPreviewHint: 'Preview Text',
    updatedAtLabel: 'Updated',
    createdAtLabel: 'Created'
  },
  ku: {
    typeDesigner: 'فۆنتە عەرەبییەکان بە ڕۆحێکی هاوچەرخ و وردییەکانی تەواو دیزاین دەکەم، لەگەڵ تاقیکردنەوەی پیشاندانی ڕوون بۆ هەر فۆنتێک.',
    homeLead: 'دیزاینی فۆنتی عەرەبی بە ناسنامەی هاوچەرخ، وردی بینراو و پیشاندانی تایبەتی هەر فۆنتێک.',
    visitorsLabel: 'سەردانکەرەکان',
    drawerHome: 'سەرەتا',
    drawerFonts: 'فۆنتەکان',
    drawerAccounts: 'هەژمارەکان',
    drawerSettings: 'ڕێکخستن',
    metricFonts: 'ژمارەی فۆنتەکان',
    metricPosters: 'پۆستەرەکان',
    metricWeights: 'کێشەکان',
    libraryTitle: 'کتێبخانەی فۆنت',
    librarySub: 'پۆستەر و تاقیکردنەوەی بینراو کە ڕۆحی هەر فۆنتێک دەردەخات.',
    discoverRandom: 'فۆنتێکی هەڵبژێردراوی هەڕەمەکی',
    searchPlaceholder: 'بەدوای فۆنت بگەڕێ...',
    noSearchResults: 'هیچ ئەنجامێک نەدۆزرایەوە',
    accountsPersonal: 'هەژمارە کەسییەکان',
    accountsWork: 'هەژمارەکانی کار',
    back: 'گەڕانەوە',
    downloadFont: 'داگرتنی فۆنت',
    downloadZip: 'داگرتنی ZIP',
    downloadZipPreparing: 'ئامادەکردنی فایلە ZIP...',
    downloadZipFailed: 'ئامادەکردنی ZIP سەرکەوتوو نەبوو، داگرتنی ڕاستەوخۆ دەکرێت.',
    downloadWeightsTitle: 'هەڵبژاردنی کێشی داگرتن',
    downloadWeightAction: 'داگرتنی {weight}',
    downloadAllWeightsZip: 'داگرتنی هەموو کێشەکان ZIP',
    downloadAllFontsZip: 'داگرتنی هەموو فۆنتەکان ZIP',
    downloadAllFontsZipPreparing: 'ئامادەکردنی ZIP بۆ هەموو فۆنتەکان...',
    noDownloadFiles: 'فایلی فۆنت بۆ داگرتن بەردەست نییە.',
    downloadDirectFailed: 'داگرتنی ڕاستەوخۆ سەرکەوتوو نەبوو. دڵنیابە فایلەکە لەسەر سایت بارکراوە.',
    filterWeight: 'کێش',
    filterLicense: 'مۆڵەت',
    filterPrice: 'جۆر',
    filterAnyWeight: 'هەموو کێشەکان',
    filterAnyLicense: 'هەموو مۆڵەتەکان',
    filterAnyPrice: 'بەخۆڕایی + پارەدار',
    filterPriceFree: 'بەخۆڕایی',
    filterPricePaid: 'پارەدار',
    filterButton: 'فلتەر',
    resetFilters: 'ڕیسێت',
    usernamePlaceholder: 'ناوی بەکارهێنەر',
    passwordPlaceholder: 'وشەی نهێنی',
    settingsButton: 'ڕێکخستن',
    settingsTitle: 'ڕێکخستنە گشتییەکان',
    settingsLanguage: 'زمان',
    settingsTheme: 'ڕووکار',
    settingsUserName: 'ناوی بەکارهێنەر',
    settingsUserNamePlaceholder: 'ناوت بنووسە بۆ داگرتن',
    settingsSave: 'پاشەکەوتکردنی ڕێکخستن',
    langArabic: 'عەرەبی',
    langKurdish: 'کوردی',
    langEnglish: 'ئینگلیزی',
    themeAuto: 'خۆکار',
    themeMorning: 'بەیانی',
    themeNight: 'شەوانە',
    settingsSaved: 'ڕێکخستنەکان پاشەکەوتکران ✓',
    guestUser: 'میوان',
    downloadGateTitle: 'پێش داگرتن',
    downloadGateText: 'تکایە پێش داگرتنی فۆنت ناوت بنووسە.',
    downloadGateConfirm: 'دڵنیاکردنەوە و داگرتن',
    downloadGateCancel: 'هەڵوەشاندنەوە',
    downloadBlockedNoName: 'پێویستە ناوت بنووسیت پێش داگرتن.',
    menuLabel: 'مێنوو',
    previous: 'پێشوو',
    next: 'دواتر',
    close: 'داخستن',
    tabFonts: 'فۆنتەکان',
    socialLinksTitle: 'بەستەری هەژمارە کەسییەکان',
    workLinksTitle: 'بەستەری هەژمارەکانی کار',
    addAccount: '+ زیادکردنی هەژمار',
    saveAction: 'پاشەکەوتکردن',
    addFontTitle: 'زیادکردنی فۆنت',
    addFontSubmit: 'زیادکردنی فۆنت',
    statsSiteTitle: 'ئاماری ماڵپەڕ',
    totalVisits: 'کۆی سەردانەکان',
    todayVisits: 'سەردانی ئەمڕۆ',
    fontStatsTitle: 'ئاماری فۆنت — بینین و داگرتن',
    editFontTitle: 'دەستکاریکردنی فۆنت',
    saveChanges: 'پاشەکەوتکردنی گۆڕانکارییەکان',
    editAction: 'دەستکاری',
    deleteAction: 'سڕینەوە',
    hasFontFile: '✓ فایلی فۆنت هەیە',
    missingFontFile: '⚠ فایلی فۆنت نییە',
    currentFileLabel: 'فایلی ئێستا: {filename}',
    noCurrentFile: 'هێشتا فایلی فۆنت نییە — باربکە بۆ چالاککردنی پیشاندانی نمونە',
    featureLogin: 'چوونەژوورەوە',
    featureAdmin: 'پانێڵی بەڕێوەبردن',
    featureSavePersonal: 'پاشەکەوتکردنی هەژمارە کەسییەکان',
    featureSaveWork: 'پاشەکەوتکردنی هەژمارەکانی کار',
    featureAddFont: 'زیادکردنی فۆنت',
    featureDeleteFont: 'سڕینەوەی فۆنت',
    featureEditFont: 'دەستکاریکردنی فۆنت',
    featureStats: 'ئامار',
    runtimeReadonly: 'دۆخی تەنها خوێندنەوە',
    runtimeLive: 'Live CMS',
    readonlyTitle: 'دۆخی تەنها خوێندنەوە (سێرڤەر بەردەست نییە)',
    featureUnavailable: '{feature} تەنها لە کاتی کارکردنی سێرڤەر بەردەستە.',
    contentLoadError: 'بارکردنی ناوەڕۆک سەرکەوتوو نەبوو. دڵنیابە لە بوونی content.json لە ناو public.',
    noFontsAvailable: 'هێشتا هیچ فۆنتێک نییە',
    linksPersonalEmpty: 'هێشتا هیچ بەستەری کەسی زیاد نەکراوە',
    linksWorkEmpty: 'هێشتا هیچ بەستەری کار زیاد نەکراوە',
    accountLabel: 'هەژمار',
    fontUntitled: 'فۆنت',
    fontPoster: 'پۆستەری فۆنت',
    viewImage: 'پیشاندانی وێنەی {index}',
    externalLink: 'بەستەری دەرەکی',
    paid: 'پارەدار',
    free: 'بەخۆڕایی',
    openFontDetails: 'کردنەوەی وردەکاری {title}',
    galleryNoImages: 'هێشتا وێنە بۆ ئەم فۆنتە نییە',
    weightsLabel: 'کێشەکان',
    licenseLabel: 'مۆڵەت',
    freeWeightsLabel: 'کێشە بەخۆڕاییەکان',
    paidWeightsLabel: 'کێشە پارەدارەکان',
    viewerCaption: '{title} • {index} / {total}',
    saveSuccess: 'پاشەکەوتکرا ✓',
    saveFail: 'پاشەکەوتکردن سەرکەوتوو نەبوو',
    addSuccess: 'زیادکرا ✓',
    addFail: 'زیادکردن سەرکەوتوو نەبوو',
    deleteSuccess: 'سڕایەوە ✓',
    deleteFail: 'سڕینەوە سەرکەوتوو نەبوو',
    updateSuccess: 'نوێکرایەوە ✓',
    updateFail: 'نوێکردنەوە سەرکەوتوو نەبوو',
    noStatsData: 'هێشتا هیچ داتایەک نییە',
    statsLoadError: 'بارکردنی ئامار سەرکەوتوو نەبوو',
    confirmDelete: 'دڵنیای دەتەوێت بیسڕیتەوە؟',
    viewsShort: 'بینین',
    downloadsShort: 'داگرتن',
    uniqueUsersShort: 'بەکارهێنەر',
    totalFontViews: 'کۆی بینینی فۆنتەکان',
    totalDownloads: 'کۆی داگرتنەکان',
    conversionRate: 'ڕێژەی گۆڕان',
    recentDownloads: 'دوایین داگرتنەکان',
    noRecentDownloads: 'هیچ داگرتنێکی نوێ نییە',
    topFont: 'باشترین فۆنت',
    badgeNew: 'نوێ',
    badgeUpdated: 'نوێکراوە',
    weightPreviewTitle: 'پیشاندانی هەموو کێشەکان',
    weightPreviewHint: 'دەقی پیشاندان',
    updatedAtLabel: 'دوایین نوێکردنەوە',
    createdAtLabel: 'بەرواری زیادکردن'
  }
};

function t(key, vars = {}) {
  const langDict = I18N[currentLanguage] || I18N.ar;
  const fallback = I18N.ar[key] || key;
  let text = langDict[key] || fallback;
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
  });
  return text;
}

function normalizeLanguageCode(value, fallback = 'ar') {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('ar')) return 'ar';
  if (raw.startsWith('ku') || raw.startsWith('ckb') || raw.startsWith('kur')) return 'ku';
  if (raw.startsWith('en')) return 'en';
  return fallback;
}

function getBrandDisplayName(language = currentLanguage) {
  return BRAND_NAME_BY_LANG[language] || BRAND_NAME_BY_LANG.ar;
}

function updateBrandLabels() {
  const brandName = getBrandDisplayName();

  document.querySelectorAll('.drawer-title, .home-title, .splash-name').forEach(el => {
    if (!el) return;
    el.textContent = brandName;
    el.setAttribute('dir', RTL_LANGS.includes(currentLanguage) ? 'rtl' : 'ltr');
    el.setAttribute('lang', currentLanguage === 'ku' ? 'ku' : currentLanguage);
  });

  const topbarLogo = document.getElementById('topbar-logo');
  if (topbarLogo) topbarLogo.setAttribute('alt', brandName);

  const splashLogo = document.getElementById('splash-logo');
  if (splashLogo) splashLogo.setAttribute('alt', brandName);
}

function detectDeviceLanguage() {
  const candidates = Array.isArray(navigator.languages) ? [...navigator.languages] : [];
  candidates.push(navigator.language || '');
  for (const candidate of candidates) {
    const normalized = normalizeLanguageCode(candidate, '');
    if (normalized) return normalized;
  }
  return 'ar';
}

function sanitizeSeoText(value, maxLength = 190) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function normalizeSeoKeyword(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueSeoKeywords(values = [], maxCount = 160) {
  const list = [];
  const seen = new Set();

  values.forEach(value => {
    const token = normalizeSeoKeyword(value);
    if (!token) return;
    const key = token.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push(token);
  });

  return list.slice(0, maxCount);
}

function upsertMetaByName(name, content) {
  if (!name) return;
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', String(content || ''));
}

function upsertMetaByProperty(property, content) {
  if (!property) return;
  let tag = document.head.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', String(content || ''));
}

function upsertLinkTag(rel, href, attributes = {}) {
  if (!rel || !href) return;

  const candidates = Array.from(document.head.querySelectorAll(`link[rel="${rel}"]`));
  let link = candidates.find(item => {
    return Object.entries(attributes).every(([key, value]) => item.getAttribute(key) === String(value));
  });

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    Object.entries(attributes).forEach(([key, value]) => {
      link.setAttribute(key, String(value));
    });
    document.head.appendChild(link);
  }

  link.setAttribute('href', String(href));
}

function upsertJsonLdScript(id, payload) {
  if (!id || !payload) return;
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}

function toAbsoluteSeoUrl(value) {
  if (!value) return '';
  try {
    return new URL(String(value), window.location.href).href;
  } catch {
    return '';
  }
}

function getLocalizedFontSeoName(font) {
  if (!font) return '';
  const titleAr = String(font.title || '').trim();
  const titleEn = String(font.titleEn || font.title_en || '').trim();

  if (currentLanguage === 'en') return titleEn || titleAr;
  if (currentLanguage === 'ku') return titleAr || titleEn;
  return titleAr || titleEn;
}

function getLocalizedFontSeoDescription(font) {
  if (!font) return '';

  if (currentLanguage === 'en') {
    return String(font.descriptionEn || font.descriptionAr || font.descriptionKu || font.description || '').trim();
  }

  if (currentLanguage === 'ku') {
    return String(font.descriptionKu || font.descriptionAr || font.descriptionEn || font.description || '').trim();
  }

  return String(font.descriptionAr || font.descriptionKu || font.descriptionEn || font.description || '').trim();
}

function buildSeoWeightSentence(weights = []) {
  if (!weights.length) return '';
  if (currentLanguage === 'en') return `Available weights: ${weights.join(', ')}.`;
  if (currentLanguage === 'ku') return `کێشە بەردەستەکان: ${weights.join('، ')}.`;
  return `الأوزان المتاحة: ${weights.join('، ')}.`;
}

function getSeoCanonicalUrl() {
  const url = new URL(window.location.href);
  url.hash = '';

  const allowedParams = new Set(pageType === 'font' ? ['id', 'lang'] : ['lang']);
  [...url.searchParams.keys()].forEach(key => {
    if (!allowedParams.has(key)) url.searchParams.delete(key);
  });

  if (pageType === 'font') {
    const numericId = Number(currentFontId);
    if (Number.isFinite(numericId)) {
      url.searchParams.set('id', String(numericId));
    } else {
      url.searchParams.delete('id');
    }
  } else {
    url.searchParams.delete('id');
  }

  url.searchParams.set('lang', currentLanguage);
  return url;
}

function buildSeoKeywordPool(activeFont = null) {
  const fonts = getDisplayFonts();
  const links = getCombinedAccountLinks();

  const fontNames = fonts.flatMap(font => [font.title, font.titleEn]);
  const weightNames = fonts.flatMap(font => getFontWeightList(font));
  const accountPlatforms = links.map(link => link.platform || '');
  const accountHosts = links.map(link => formatHostLabel(link.href || link.url || ''));

  const activeTokens = activeFont
    ? [activeFont.title, activeFont.titleEn, ...getFontWeightList(activeFont)]
    : [];

  return uniqueSeoKeywords([
    ...SEO_GLOBAL_KEYWORDS,
    ...(SEO_KEYWORDS_BY_LANG[currentLanguage] || []),
    ...fontNames,
    ...weightNames,
    ...accountPlatforms,
    ...accountHosts,
    ...activeTokens
  ]);
}

function buildSeoJsonLd(canonicalUrl, pageTitle, pageDescription, activeFont, imageUrl) {
  const links = getCombinedAccountLinks();
  const sameAs = uniqueSeoKeywords(
    links.map(link => normalizeOutboundUrl(link.href || link.url || '')).filter(url => url && url !== '#'),
    30
  );
  const baseSiteUrl = toAbsoluteSeoUrl('./home.html');

  const graph = [
    {
      '@type': 'Person',
      name: 'Omar Hassan',
      alternateName: ['عمر حسن', 'عُمَر حسَن', 'عومەر حەسەن', 'Omar Hassan Type'],
      url: baseSiteUrl || canonicalUrl.href,
      sameAs
    },
    {
      '@type': 'WebSite',
      name: (SEO_TEXT[currentLanguage] || SEO_TEXT.ar).siteName,
      alternateName: ['Omar Hassan Type', 'عمر حسن تايب', 'عومەر حەسەن تایپ'],
      url: baseSiteUrl || canonicalUrl.href,
      inLanguage: SEO_LANGS
    }
  ];

  if (pageType === 'font' && activeFont) {
    graph.push({
      '@type': 'CreativeWork',
      name: getLocalizedFontSeoName(activeFont) || pageTitle,
      alternateName: uniqueSeoKeywords([activeFont.title, activeFont.titleEn], 6),
      description: pageDescription,
      image: getFontImages(activeFont).map(toAbsoluteSeoUrl).filter(Boolean).slice(0, 12),
      creator: { '@type': 'Person', name: 'Omar Hassan' },
      inLanguage: SEO_LANGS,
      url: canonicalUrl.href,
      keywords: buildSeoKeywordPool(activeFont).slice(0, 80).join(', '),
      about: getFontWeightList(activeFont).map(weight => ({ '@type': 'DefinedTerm', name: weight }))
    });
  } else if (pageType === 'fonts') {
    graph.push({
      '@type': 'CollectionPage',
      name: pageTitle,
      description: pageDescription,
      inLanguage: SEO_LANGS,
      url: canonicalUrl.href,
      image: imageUrl,
      keywords: buildSeoKeywordPool().slice(0, 80).join(', ')
    });
  } else {
    graph.push({
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      inLanguage: SEO_LANGS,
      url: canonicalUrl.href,
      image: imageUrl,
      keywords: buildSeoKeywordPool().slice(0, 80).join(', ')
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}

function updateSeoMetadata(activeFontOverride = null) {
  const langPack = SEO_TEXT[currentLanguage] || SEO_TEXT.ar;
  const displayFonts = getDisplayFonts();

  const activeFont = pageType === 'font'
    ? (activeFontOverride || displayFonts.find(font => Number(font.id) === Number(currentFontId)) || null)
    : null;

  let seoTitle = langPack.homeTitle;
  let seoDescription = langPack.homeDescription;
  let ogType = 'website';

  if (pageType === 'fonts') {
    seoTitle = langPack.fontsTitle;
    const countText = Number.isFinite(displayFonts.length) && displayFonts.length > 0
      ? (currentLanguage === 'en'
        ? `Total fonts: ${displayFonts.length}.`
        : (currentLanguage === 'ku'
          ? `ژمارەی فۆنتەکان: ${displayFonts.length}.`
          : `عدد الخطوط: ${displayFonts.length}.`))
      : '';
    seoDescription = sanitizeSeoText(`${langPack.fontsDescription} ${countText}`);
  }

  if (pageType === 'font' && activeFont) {
    const fontName = getLocalizedFontSeoName(activeFont) || langPack.siteName;
    const fontDescription = getLocalizedFontSeoDescription(activeFont) || langPack.fontDescriptionFallback;
    const weights = getFontWeightList(activeFont);
    const weightSentence = buildSeoWeightSentence(weights);

    seoTitle = `${fontName} | ${langPack.siteName}`;
    seoDescription = sanitizeSeoText(`${fontDescription} ${weightSentence}`);
    ogType = 'product';
  }

  seoDescription = sanitizeSeoText(seoDescription || langPack.homeDescription);
  const keywordText = buildSeoKeywordPool(activeFont).join(', ');
  const canonicalUrl = getSeoCanonicalUrl();

  const pageImageSource = activeFont ? (getFontImages(activeFont)[0] || './logo.jpeg') : './logo.jpeg';
  const pageImageUrl = toAbsoluteSeoUrl(pageImageSource) || toAbsoluteSeoUrl('./logo.jpeg');

  document.title = seoTitle;

  upsertMetaByName('description', seoDescription);
  upsertMetaByName('keywords', keywordText);
  upsertMetaByName('author', 'Omar Hassan');
  upsertMetaByName('robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  upsertMetaByName('language', currentLanguage);
  upsertMetaByName('application-name', langPack.siteName);
  upsertMetaByName('apple-mobile-web-app-title', langPack.siteName);

  upsertMetaByProperty('og:site_name', langPack.siteName);
  upsertMetaByProperty('og:type', ogType);
  upsertMetaByProperty('og:title', seoTitle);
  upsertMetaByProperty('og:description', seoDescription);
  upsertMetaByProperty('og:url', canonicalUrl.href);
  upsertMetaByProperty('og:image', pageImageUrl);
  upsertMetaByProperty('og:locale', SEO_OG_LOCALE_BY_LANG[currentLanguage] || SEO_OG_LOCALE_BY_LANG.ar);

  upsertMetaByName('twitter:card', 'summary_large_image');
  upsertMetaByName('twitter:title', seoTitle);
  upsertMetaByName('twitter:description', seoDescription);
  upsertMetaByName('twitter:image', pageImageUrl);

  upsertLinkTag('canonical', canonicalUrl.href);

  SEO_LANGS.forEach(lang => {
    const altUrl = new URL(canonicalUrl.href);
    altUrl.searchParams.set('lang', lang);
    upsertLinkTag('alternate', altUrl.href, { hreflang: lang });
  });

  const xDefaultUrl = new URL(canonicalUrl.href);
  xDefaultUrl.searchParams.set('lang', 'ar');
  upsertLinkTag('alternate', xDefaultUrl.href, { hreflang: 'x-default' });

  upsertJsonLdScript(
    'seo-json-ld',
    buildSeoJsonLd(canonicalUrl, seoTitle, seoDescription, activeFont, pageImageUrl)
  );
}

function isRtlLayout() {
  return document.documentElement.dir === 'rtl';
}

function getDirectionalNavigationSteps() {
  return { prev: -1, next: 1 };
}

function getDirectionalArrowIcons() {
  if (isRtlLayout()) {
    return {
      prev: 'fa-solid fa-chevron-right',
      next: 'fa-solid fa-chevron-left'
    };
  }

  return {
    prev: 'fa-solid fa-chevron-left',
    next: 'fa-solid fa-chevron-right'
  };
}

function updateDirectionalNavigationUI() {
  const icons = getDirectionalArrowIcons();

  const sliderPrevIcon = document.querySelector('#slider-prev i');
  const sliderNextIcon = document.querySelector('#slider-next i');
  const viewerPrevIcon = document.querySelector('#image-viewer-prev i');
  const viewerNextIcon = document.querySelector('#image-viewer-next i');
  const detailPrevIcon = document.querySelector('#fd-images .fd-media-nav.prev i');
  const detailNextIcon = document.querySelector('#fd-images .fd-media-nav.next i');

  if (sliderPrevIcon) sliderPrevIcon.className = icons.prev;
  if (sliderNextIcon) sliderNextIcon.className = icons.next;
  if (viewerPrevIcon) viewerPrevIcon.className = icons.prev;
  if (viewerNextIcon) viewerNextIcon.className = icons.next;
  if (detailPrevIcon) detailPrevIcon.className = icons.prev;
  if (detailNextIcon) detailNextIcon.className = icons.next;

  const sliderPrev = document.getElementById('slider-prev');
  const sliderNext = document.getElementById('slider-next');
  const viewerPrev = document.getElementById('image-viewer-prev');
  const viewerNext = document.getElementById('image-viewer-next');
  const detailPrev = document.querySelector('#fd-images .fd-media-nav.prev');
  const detailNext = document.querySelector('#fd-images .fd-media-nav.next');

  if (sliderPrev) sliderPrev.setAttribute('aria-label', t('previous'));
  if (sliderNext) sliderNext.setAttribute('aria-label', t('next'));
  if (viewerPrev) viewerPrev.setAttribute('aria-label', t('previous'));
  if (viewerNext) viewerNext.setAttribute('aria-label', t('next'));
  if (detailPrev) detailPrev.setAttribute('aria-label', t('previous'));
  if (detailNext) detailNext.setAttribute('aria-label', t('next'));
}

function setTextById(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setInputPlaceholder(id, value) {
  const el = document.getElementById(id);
  if (el) el.placeholder = value;
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return Number(fallback);
  const bounded = Math.min(max, Math.max(min, numeric));
  return Math.round(bounded);
}

function normalizePreviewPhrase(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function getDefaultPreviewPhraseByLanguage() {
  if (currentLanguage === 'en') return 'The quick brown fox jumps over the lazy dog';
  if (currentLanguage === 'ku') return 'نمونەی دەق بۆ پێشاندانی کێشەکان';
  return DEFAULT_PREVIEW_PHRASE_AR;
}

function sanitizeVisitorName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function getSavedVisitorName() {
  return sanitizeVisitorName(localStorage.getItem(VISITOR_NAME_STORAGE_KEY));
}

function setSavedVisitorName(value) {
  const clean = sanitizeVisitorName(value);
  if (!clean) {
    localStorage.removeItem(VISITOR_NAME_STORAGE_KEY);
  } else {
    localStorage.setItem(VISITOR_NAME_STORAGE_KEY, clean);
  }

  return clean;
}

function readStoredAdminToken() {
  return null;
}

function decodeJwtPayload(rawToken) {
  const tokenValue = String(rawToken || '').trim();
  if (!tokenValue) return null;

  const parts = tokenValue.split('.');
  if (parts.length < 2) return null;

  let payloadBase64 = String(parts[1] || '').replace(/-/g, '+').replace(/_/g, '/');
  while (payloadBase64.length % 4) payloadBase64 += '=';

  try {
    const decoded = atob(payloadBase64);
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function syncAuthenticatedAdminState() {
}

function isOwnerAdminAuthenticated() {
  return false;
}

function normalizeAdminUiPrefs(raw) {
}

function loadAdminUiPrefs() {
}

function saveAdminUiPrefs(nextPrefs = undefined) {
}

function normalizeAdminFontViewState(raw) {
}

function loadAdminFontViewState() {
}

function saveAdminFontViewState(nextState = undefined) {
}

function getWeightPreviewPhrase() {
  return getDefaultPreviewPhraseByLanguage();
}

function getUserPreviewPhrase() {
  try {
    const phrase = normalizePreviewPhrase(localStorage.getItem(USER_PREVIEW_PHRASE_STORAGE_KEY));
    return phrase === LEGACY_PREVIEW_PHRASE_AR ? DEFAULT_PREVIEW_PHRASE_AR : phrase;
  } catch {
    return '';
  }
}

function setUserPreviewPhrase(value) {
  const normalized = normalizePreviewPhrase(value);
  try {
    if (normalized) {
      localStorage.setItem(USER_PREVIEW_PHRASE_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(USER_PREVIEW_PHRASE_STORAGE_KEY);
    }
  } catch {
  }
  return normalized;
}

function getActiveWeightPreviewPhrase() {
  return getUserPreviewPhrase() || getWeightPreviewPhrase();
}

function getFontPublicStats(fontId) {
  const key = String(fontId);
  const sourceIds = Array.isArray(displayFontSourceIdsById[key]) && displayFontSourceIdsById[key].length
    ? displayFontSourceIdsById[key]
    : [key];

  const total = { views: 0, downloads: 0, uniqueDownloaders: 0 };
  sourceIds.forEach(sourceId => {
    const item = publicFontStatsById[String(sourceId)];
    if (!item) return;
    total.views += Number(item.views || 0);
    total.downloads += Number(item.downloads || 0);
    total.uniqueDownloaders += Number(item.uniqueDownloaders || 0);
  });

  if (!total.views && !total.downloads && !total.uniqueDownloaders) {
    const item = publicFontStatsById[key];
    if (!item) return total;
    total.views = Number(item.views || 0);
    total.downloads = Number(item.downloads || 0);
    total.uniqueDownloaders = Number(item.uniqueDownloaders || 0);
  }

  return {
    views: total.views,
    downloads: total.downloads,
    uniqueDownloaders: total.uniqueDownloaders
  };
}

function bumpFontPublicStat(fontId, field, amount = 1) {
  return;
}

function updateTopbarUserChip() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  let chip = document.getElementById('topbar-user-chip');
  if (!chip) {
    chip = document.createElement('span');
    chip.id = 'topbar-user-chip';
    chip.className = 'topbar-user-chip';
    topbar.appendChild(chip);
  }

  chip.textContent = getSavedVisitorName() || t('guestUser');
}

function getSiteFooterText() {
  if (currentLanguage === 'en') return `All rights reserved © Omar Hassan ${new Date().getFullYear()}`;
  if (currentLanguage === 'ku') return `هەموو مافەکان پارێزراون © عومەر حەسەن ${new Date().getFullYear()}`;
  return `جميع الحقوق محفوظة © عمر حسن 2026`;
}

function buildAccountRailIconLink(link, className) {
  const href = normalizeOutboundUrl(link?.href || link?.url || '');
  if (!href || href === '#') return '';

  const label = escapeHtml(String(link?.platform || formatHostLabel(href) || t('accountLabel')));
  const iconHtml = getLinkIcon(link);
  return `<a class="${className}" href="${href}" target="_blank" rel="noopener" aria-label="${label}" title="${label}">${iconHtml}</a>`;
}

function renderTopbarAccountsRail() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  let rail = document.getElementById('topbar-accounts');
  if (!rail) {
    rail = document.createElement('div');
    rail.id = 'topbar-accounts';
    rail.className = 'topbar-accounts';

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      topbar.insertBefore(rail, menuToggle);
    } else {
      topbar.appendChild(rail);
    }
  }

  const links = getCombinedAccountLinks().slice(0, 6);
  if (!links.length) {
    rail.classList.add('hidden');
    rail.innerHTML = '';
    return;
  }

  rail.classList.remove('hidden');
  rail.innerHTML = links.map(link => buildAccountRailIconLink(link, 'topbar-account-link')).join('');
}

function renderFooterAccountsRail() {
  const rail = document.getElementById('site-footer-accounts');
  if (!rail) return;

  const links = getCombinedAccountLinks();
  if (!links.length) {
    rail.classList.add('hidden');
    rail.innerHTML = '';
    return;
  }

  rail.classList.remove('hidden');
  rail.innerHTML = links.map(link => buildAccountRailIconLink(link, 'footer-account-link')).join('');
}

function renderAccountRails() {
  renderTopbarAccountsRail();
  renderFooterAccountsRail();
}

function readStoredVisitorCount(key) {
  try {
    const raw = localStorage.getItem(key);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value);
  } catch {
    return null;
  }
}

function writeStoredVisitorCount(key, value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return;
  try {
    localStorage.setItem(key, String(Math.round(numeric)));
  } catch {
  }
}

function hasVisitorHitThisSession() {
  try {
    return sessionStorage.getItem(VISITOR_COUNT_HIT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markVisitorHitThisSession() {
  try {
    sessionStorage.setItem(VISITOR_COUNT_HIT_SESSION_KEY, '1');
  } catch {
  }
}

function buildVisitorCounterNamespace() {
  const host = String(window.location.hostname || '').trim().toLowerCase();
  const safeHost = host.replace(/[^a-z0-9.-]+/g, '_');
  return safeHost ? `omarhassantype_${safeHost}` : 'omarhassantype_local';
}

function buildVisitorCounterUrl(mode = 'get') {
  const safeMode = mode === 'hit' ? 'hit' : 'get';
  const namespace = buildVisitorCounterNamespace();
  return `https://api.countapi.xyz/${safeMode}/${namespace}/visits`;
}

function getLocalVisitorFallbackCount() {
  let localValue = readStoredVisitorCount(VISITOR_COUNT_LOCAL_STORAGE_KEY);
  if (!Number.isFinite(localValue)) localValue = 0;

  let hasLocalSessionMark = false;
  try {
    hasLocalSessionMark = sessionStorage.getItem(VISITOR_COUNT_LOCAL_SESSION_KEY) === '1';
  } catch {
    hasLocalSessionMark = false;
  }

  if (!hasLocalSessionMark) {
    localValue += 1;
    writeStoredVisitorCount(VISITOR_COUNT_LOCAL_STORAGE_KEY, localValue);
    try {
      sessionStorage.setItem(VISITOR_COUNT_LOCAL_SESSION_KEY, '1');
    } catch {
    }
  }

  return localValue;
}

function setVisitorCountNode(value) {
  const displayCount = document.getElementById('visitor-count-node');
  if (!displayCount) return;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    displayCount.innerText = formatLocalizedNumber(numeric);
    return;
  }

  displayCount.innerText = String(value ?? '—');
}

async function fetchVisitorCountRemote() {
  const shouldHit = !hasVisitorHitThisSession();
  const endpoint = buildVisitorCounterUrl(shouldHit ? 'hit' : 'get');

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), VISITOR_COUNTER_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {})
    });

    if (!response.ok) throw new Error(`Visitor counter failed (${response.status})`);

    const data = await response.json();
    const value = Number(data?.value);
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid visitor counter payload');

    if (shouldHit) markVisitorHitThisSession();
    return Math.round(value);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

async function fetchVisitorCountFromApi() {
  if (isStaticMode || window.location.protocol === 'file:') return null;

  const response = await fetch(apiUrl('/visitor-count'), {
    cache: 'no-store'
  });

  if (!response.ok) throw new Error(`Visitor API failed (${response.status})`);

  const data = await safeJsonParse(response);
  const value = Number(data?.totalVisits);
  if (!Number.isFinite(value) || value < 0) throw new Error('Invalid visitor API payload');
  return Math.round(value);
}

function canDisplayVisitorCount() {
  return false;
}

async function loadVisitorCount() {
  const existingWrap = document.querySelector('.visitor-counter-wrap');
  if (existingWrap) existingWrap.remove();
  return null;
}

function ensureSiteFooter() {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  let footer = document.getElementById('site-footer');
  if (!footer) {
    footer = document.createElement('footer');
    footer.id = 'site-footer';
    footer.className = 'site-footer';
    appRoot.appendChild(footer);
  }

  let contentWrap = document.getElementById('site-footer-content');
  if (!contentWrap) {
    footer.innerHTML = `
      <div id="site-footer-content" class="site-footer-content">
        <span id="site-footer-copy" class="site-footer-copy"></span>
        <div id="site-footer-accounts" class="site-footer-accounts"></div>
      </div>`;
    contentWrap = document.getElementById('site-footer-content');
  }

  const copy = document.getElementById('site-footer-copy');
  if (copy) copy.textContent = getSiteFooterText();

  renderFooterAccountsRail();
}

function applyLanguage(language, persist = true) {
  currentLanguage = normalizeLanguageCode(language);
  if (persist) localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);

  const html = document.documentElement;
  html.lang = currentLanguage === 'ku' ? 'ku' : currentLanguage;
  html.dir = RTL_LANGS.includes(currentLanguage) ? 'rtl' : 'ltr';
  document.body.classList.toggle('lang-rtl', RTL_LANGS.includes(currentLanguage));
  document.body.classList.toggle('lang-ltr', !RTL_LANGS.includes(currentLanguage));

  updateBrandLabels();

  setTextById('splash-sub-text', t('typeDesigner'));
  setTextById('drawer-home-text', t('drawerHome'));
  setTextById('drawer-fonts-text', t('drawerFonts'));
  setTextById('drawer-accounts-text', t('drawerAccounts'));
  setTextById('drawer-settings-text', t('drawerSettings'));
  setTextById('home-sub-text', t('typeDesigner'));
  setTextById('home-lead-text', t('homeLead'));
  setTextById('home-fonts-title-text', t('libraryTitle'));
  setTextById('home-fonts-sub-text', t('librarySub'));
  setTextById('home-fonts-empty', t('noSearchResults'));
  setTextById('accounts-personal-title', t('accountsPersonal'));
  setTextById('accounts-work-title', t('accountsWork'));
  setTextById('font-detail-back-text', t('back'));
  setTextById('fd-download-btn-text', t('downloadFont'));
  setTextById('fd-download-zip-btn-text', t('downloadZip'));
  setTextById('download-weights-title', t('downloadWeightsTitle'));
  setTextById('download-all-weights-zip-text', t('downloadAllWeightsZip'));
  setTextById('home-download-all-zip-text', t('downloadAllFontsZip'));
  setTextById('weight-preview-title', t('weightPreviewTitle'));
  setTextById('fd-preview-phrase-label', t('weightPreviewHint'));
  setTextById('settings-title-text', t('settingsTitle'));
  setTextById('settings-language-label', t('settingsLanguage'));
  setTextById('settings-theme-label', t('settingsTheme'));
  setTextById('settings-visitor-name-label', t('settingsUserName'));
  setTextById('save-settings-btn', t('settingsSave'));
  setTextById('lang-ar-opt', t('langArabic'));
  setTextById('lang-ku-opt', t('langKurdish'));
  setTextById('lang-en-opt', t('langEnglish'));
  setTextById('theme-auto-opt', t('themeAuto'));
  setTextById('theme-morning-opt', t('themeMorning'));
  setTextById('theme-night-opt', t('themeNight'));
  setInputPlaceholder('settings-visitor-name', t('settingsUserNamePlaceholder'));
  setInputPlaceholder('download-name-input', t('settingsUserNamePlaceholder'));
  setInputPlaceholder('fd-preview-phrase-input', t('weightPreviewHint'));
  setTextById('download-name-title', t('downloadGateTitle'));
  setTextById('download-name-text', t('downloadGateText'));
  setTextById('download-name-confirm', t('downloadGateConfirm'));
  setTextById('download-name-cancel', t('downloadGateCancel'));

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.title = t('settingsButton');
    settingsBtn.setAttribute('aria-label', t('settingsButton'));
  }

  const topbarLogo = document.getElementById('topbar-logo');
  if (topbarLogo) topbarLogo.title = t('drawerHome');

  const menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    menuToggle.title = t('menuLabel');
    menuToggle.setAttribute('aria-label', t('menuLabel'));
  }

  const viewerClose = document.getElementById('image-viewer-close');
  if (viewerClose) viewerClose.setAttribute('aria-label', t('close'));
  updateDirectionalNavigationUI();

  const languageSelect = document.getElementById('settings-language');
  if (languageSelect) languageSelect.value = currentLanguage;

  const iconSearch = document.querySelector('.ip-search');
  if (iconSearch) iconSearch.placeholder = t('searchPlaceholder');

  updateTopbarUserChip();
  try { ensureSiteFooter(); } catch (error) { console.error('ensureSiteFooter failed:', error); }
  try { renderAccountRails(); } catch (error) { console.error('renderAccountRails failed:', error); }

  updateRuntimeBadge();
  if (contentData.socialLinks || contentData.workLinks || contentData.fonts) {
    try { renderSocial(); } catch (error) { console.error('renderSocial failed:', error); }
    try { renderAccountRails(); } catch (error) { console.error('renderAccountRails failed:', error); }
    loadVisitorCount().catch(error => console.error('loadVisitorCount failed:', error));
    ensureAdvancedFontControls();
    applyActiveFontFilters();
    ensurePublicFontsVisibility();
    if (pageType === 'font' && currentFontId) renderFontDetailPage(currentFontId, { trackView: false });
  }

  try { updateSeoMetadata(); } catch (error) { console.error('updateSeoMetadata failed:', error); }
}

function resolveTheme(mode) {
  if (mode === 'morning') return 'light';
  if (mode === 'night') return 'dark';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (typeof prefersDark === 'boolean') return prefersDark ? 'dark' : 'light';
  const hour = new Date().getHours();
  return (hour >= 19 || hour < 6) ? 'dark' : 'light';
}

function applyTheme(mode, persist = true) {
  currentThemeMode = 'night';
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, currentThemeMode);

  document.documentElement.setAttribute('data-theme', 'dark');
  document.body.classList.add('theme-dark');

  const themeSelect = document.getElementById('settings-theme');
  if (themeSelect) {
    themeSelect.value = 'night';
    themeSelect.disabled = true;
    themeSelect.setAttribute('aria-disabled', 'true');
  }
}

function currentLocale() {
  if (currentLanguage === 'en') return 'en-US';
  if (currentLanguage === 'ku') return 'ku-Arab-IQ';
  return 'ar';
}

function formatLocalizedNumber(value) {
  return Number(value || 0).toLocaleString(currentLocale());
}

function initSettingsPanel() {
  const triggerButtons = Array.from(document.querySelectorAll('[data-action="open-settings"]'));
  const topbarSettingsBtn = document.getElementById('settings-btn');
  if (topbarSettingsBtn) triggerButtons.push(topbarSettingsBtn);
  const modal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('close-settings');
  const saveBtn = document.getElementById('save-settings-btn');
  const languageSelect = document.getElementById('settings-language');
  const themeSelect = document.getElementById('settings-theme');
  const visitorNameInput = document.getElementById('settings-visitor-name');

  if (!triggerButtons.length || !modal || !closeBtn || !saveBtn || !languageSelect || !themeSelect) return;

  const openSettingsModal = () => {
    languageSelect.value = currentLanguage;
    themeSelect.value = 'night';
    themeSelect.disabled = true;
    themeSelect.setAttribute('aria-disabled', 'true');
    if (visitorNameInput) visitorNameInput.value = getSavedVisitorName();
    modal.classList.remove('hidden');
    closeDrawer();
  };

  triggerButtons.forEach(button => {
    button.addEventListener('click', openSettingsModal);
  });

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.add('hidden');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!modal.classList.contains('hidden')) modal.classList.add('hidden');
  });

  saveBtn.addEventListener('click', () => {
    if (visitorNameInput) setSavedVisitorName(visitorNameInput.value);
    applyLanguage(languageSelect.value, true);
    applyTheme(themeSelect.value, true);
    updateTopbarUserChip();
    modal.classList.add('hidden');
    toast(t('settingsSaved'));
  });
}

function initUserPreferences() {
  const params = new URLSearchParams(window.location.search);
  const queryLang = normalizeLanguageCode(params.get('lang'), '');
  const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const initialLang = queryLang || (savedLang ? normalizeLanguageCode(savedLang) : detectDeviceLanguage());

  applyLanguage(initialLang, true);
  applyTheme('night', true);
}

function ensureDownloadNameModal() {
  if (document.getElementById('download-name-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'download-name-modal';
  modal.className = 'overlay hidden';
  modal.innerHTML = `
    <div class="modal-card download-name-card">
      <button class="modal-x" id="download-name-close"><i class="fa-solid fa-xmark"></i></button>
      <h3 id="download-name-title">${escapeHtml(t('downloadGateTitle'))}</h3>
      <p id="download-name-text" class="download-name-note">${escapeHtml(t('downloadGateText'))}</p>
      <input type="text" id="download-name-input" maxlength="60" placeholder="${escapeHtml(t('settingsUserNamePlaceholder'))}" autocomplete="name" />
      <div class="download-actions">
        <button type="button" class="btn-ghost" id="download-name-cancel">${escapeHtml(t('downloadGateCancel'))}</button>
        <button type="button" class="btn-white" id="download-name-confirm">${escapeHtml(t('downloadGateConfirm'))}</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const closeModal = (value = '') => {
    modal.classList.add('hidden');
    if (downloadNameResolver) {
      downloadNameResolver(sanitizeVisitorName(value));
      downloadNameResolver = null;
    }
  };

  const closeBtn = document.getElementById('download-name-close');
  const cancelBtn = document.getElementById('download-name-cancel');
  const confirmBtn = document.getElementById('download-name-confirm');
  const input = document.getElementById('download-name-input');

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(''));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(''));
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const value = sanitizeVisitorName(input?.value || '');
      if (!value) {
        toast(t('downloadBlockedNoName'), true);
        return;
      }
      closeModal(value);
    });
  }

  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal('');
  });

  if (input) {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const value = sanitizeVisitorName(input.value || '');
        if (!value) {
          toast(t('downloadBlockedNoName'), true);
          return;
        }
        closeModal(value);
      }
    });
  }
}

function promptVisitorNameForDownload(defaultValue = '') {
  ensureDownloadNameModal();
  const modal = document.getElementById('download-name-modal');
  const input = document.getElementById('download-name-input');
  if (!modal || !input) return Promise.resolve('');

  modal.classList.remove('hidden');
  input.value = sanitizeVisitorName(defaultValue);
  input.focus();
  input.select();

  return new Promise(resolve => {
    downloadNameResolver = resolve;
  });
}

async function ensureVisitorNameForDownload() {
  const existing = getSavedVisitorName();
  if (existing) return existing;

  const typed = await promptVisitorNameForDownload('');
  const clean = sanitizeVisitorName(typed);
  if (!clean) return '';
  setSavedVisitorName(clean);
  updateTopbarUserChip();
  return clean;
}

function sanitizeFileNameForDownload(value) {
  const raw = String(value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (raw || 'font').slice(0, 80);
}

function getExtensionFromDownloadUrl(url) {
  const extract = input => {
    const clean = String(input || '').split('?')[0].split('#')[0];
    const match = clean.match(/\.(ttf|otf|woff2?|zip)$/i);
    return match ? `.${match[1].toLowerCase()}` : '';
  };

  try {
    return extract(new URL(String(url || ''), window.location.href).pathname);
  } catch {
    return extract(url);
  }
}

function detectFontFormatFromSource(source) {
  const lowerSrc = String(source || '').toLowerCase();
  if (lowerSrc.endsWith('.woff2')) return 'woff2';
  if (lowerSrc.endsWith('.woff')) return 'woff';
  if (lowerSrc.endsWith('.ttf')) return 'truetype';
  return 'opentype';
}

function isLikelyDownloadableAssetUrl(url) {
  const resolved = resolveAssetUrl(url);
  if (!resolved) return false;

  const lower = String(resolved).toLowerCase();
  if (/\.(otf|ttf|woff2?|zip)(?:[?#].*)?$/.test(lower)) return true;
  if (/\/uploads\/.+\.(otf|ttf|woff2?|zip)(?:[?#].*)?$/.test(lower)) return true;
  return false;
}

function guessExtensionFromMimeType(mimeType) {
  const value = String(mimeType || '').toLowerCase();
  if (value.includes('woff2')) return '.woff2';
  if (value.includes('woff')) return '.woff';
  if (value.includes('ttf') || value.includes('truetype')) return '.ttf';
  if (value.includes('otf') || value.includes('opentype')) return '.otf';
  if (value.includes('zip')) return '.zip';
  return '';
}

function isTextLikeContentType(contentType) {
  const ct = String(contentType || '').toLowerCase();
  return ct.includes('text/html')
    || ct.includes('application/json')
    || ct.includes('text/plain')
    || ct.includes('text/xml')
    || ct.includes('application/xml');
}

async function readBlobSignatureHex(blob, byteLength = 12) {
  try {
    const chunk = blob.slice(0, Math.max(4, Number(byteLength) || 12));
    const buffer = await chunk.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes).map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch {
    return '';
  }
}

function getExpectedExtension(url, fallbackName = '') {
  return getExtensionFromDownloadUrl(url) || getExtensionFromDownloadUrl(fallbackName || '');
}

async function isValidAssetBlob(blob, expectedExt = '', contentType = '') {
  if (!blob || !blob.size) return false;

  const signature = await readBlobSignatureHex(blob, 12);
  const isZipSig = signature.startsWith('504B0304') || signature.startsWith('504B0506') || signature.startsWith('504B0708');
  const isOtfSig = signature.startsWith('4F54544F');
  const isTtfSig = signature.startsWith('00010000') || signature.startsWith('74746366');
  const isWoffSig = signature.startsWith('774F4646');
  const isWoff2Sig = signature.startsWith('774F4632');

  const hasFontSignature = isOtfSig || isTtfSig || isWoffSig || isWoff2Sig;
  const ext = String(expectedExt || '').toLowerCase();

  if (isTextLikeContentType(contentType) && !hasFontSignature && !isZipSig) {
    return false;
  }

  if (ext === '.zip') return isZipSig || String(contentType || '').toLowerCase().includes('zip');
  if (ext === '.woff2') return isWoff2Sig;
  if (ext === '.woff') return isWoffSig;
  if (ext === '.ttf' || ext === '.otf') return hasFontSignature;
  if (['.otf', '.ttf', '.woff', '.woff2'].includes(ext)) return hasFontSignature;

  return hasFontSignature || isZipSig || !isTextLikeContentType(contentType);
}

function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
}

function loadExternalScript(url, marker) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing script URL'));
      return;
    }

    const selector = `script[data-runtime-lib="${marker}"][src="${url}"]`;
    const existing = document.querySelector(selector);
    if (existing) {
      if (marker === 'jszip' && window.JSZip) {
        resolve(true);
        return;
      }

      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${url}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.runtimeLib = marker;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}

async function ensureJsZipAvailable() {
  if (window.JSZip && typeof window.JSZip === 'function') return true;

  if (!jsZipLoadPromise) {
    jsZipLoadPromise = (async () => {
      const candidates = [
        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
        'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js'
      ];

      for (const url of candidates) {
        try {
          await loadExternalScript(url, 'jszip');
          if (window.JSZip && typeof window.JSZip === 'function') return true;
        } catch {
        }
      }

      return false;
    })();
  }

  const ok = await jsZipLoadPromise;
  if (!ok) jsZipLoadPromise = null;
  return ok;
}

async function downloadFileAsZip(downloadUrl, fontTitle) {
  if (!(await ensureJsZipAvailable())) return false;

  const extensionFromUrl = getExtensionFromDownloadUrl(downloadUrl);
  if (extensionFromUrl === '.zip') return false;

  try {
    const response = await fetch(downloadUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch font (${response.status})`);

    const fileBlob = await response.blob();
    const extension = extensionFromUrl || guessExtensionFromMimeType(fileBlob.type) || '.otf';
    const safeName = sanitizeFileNameForDownload(fontTitle);

    const zip = new window.JSZip();
    zip.file(`${safeName}${extension}`, fileBlob);

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    triggerBlobDownload(zipBlob, `${safeName}.zip`);
    return true;
  } catch (error) {
    console.error(error);

    try {
      const fallbackExt = String(extensionFromUrl || '').toLowerCase();
      const canOpenDirect = ['.otf', '.ttf', '.woff', '.woff2', '.zip'].includes(fallbackExt)
        || isLikelyDownloadableAssetUrl(finalUrl);

      if (canOpenDirect) {
        const link = document.createElement('a');
        link.href = finalUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        if (fallbackExt) {
          link.download = requestedBase.toLowerCase().endsWith(fallbackExt)
            ? requestedBase
            : `${requestedBase}${fallbackExt}`;
        }
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      }
    } catch {
    }

    return false;
  }
}

async function registerFontDownload(visitorName) {
  return;
}

function getSourceFontsForDisplayFont(font) {
  const allFonts = Array.isArray(contentData?.fonts) ? contentData.fonts.map(normalizeFontItem) : [];
  const byId = new Map(allFonts.map(item => [String(item.id), item]));
  const sourceIds = Array.isArray(displayFontSourceIdsById[String(font?.id)])
    ? displayFontSourceIdsById[String(font.id)]
    : [String(font?.id || '')];

  const linked = sourceIds.map(id => byId.get(String(id))).filter(Boolean);
  if (linked.length) return linked;

  return allFonts.filter(item => String(item.id) === String(font?.id));
}

function inferWeightFromFileName(filePath) {
  const name = String(filePath || '').split('/').pop() || '';
  const lower = name.toLowerCase();
  const mapping = [
    [/extrabold|xtrabold|ultrabold/i, 'ExtraBold'],
    [/semibold|demibold/i, 'SemiBold'],
    [/extralight|ultralight/i, 'ExtraLight'],
    [/black|heavy/i, 'Black'],
    [/medium|med\b/i, 'Medium'],
    [/regular|normal/i, 'Regular'],
    [/light/i, 'Light'],
    [/bold/i, 'Bold'],
    [/thin/i, 'Thin'],
    [/salt|سالت/i, 'Salt']
  ];

  for (const [pattern, value] of mapping) {
    if (pattern.test(lower)) return value;
  }
  return '';
}

function extractOriginalFileName(downloadUrl) {
  const resolved = resolveAssetUrl(downloadUrl);
  if (!resolved) return '';

  try {
    const parsed = new URL(resolved, window.location.href);
    const base = decodeURIComponent((parsed.pathname || '').split('/').pop() || '').trim();
    if (base) return sanitizeFileNameForDownload(base);
  } catch {
    const base = decodeURIComponent(String(resolved).split('/').pop() || '').trim();
    if (base) return sanitizeFileNameForDownload(base);
  }

  return '';
}

function buildWeightFileName(fontTitle, weightLabel, downloadUrl) {
  const originalName = extractOriginalFileName(downloadUrl);
  if (originalName) return originalName;

  const ext = getExtensionFromDownloadUrl(downloadUrl) || '.otf';
  const base = sanitizeFileNameForDownload(`${fontTitle || 'font'} ${weightLabel || 'weight'}`);
  return base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
}

function normalizeWeightLookupToken(weight) {
  return String(resolveWeightName(weight) || weight || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeWeightFilesMap(weightFiles) {
  let source = weightFiles;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = {};
    }
  }

  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};

  const out = {};
  Object.entries(source).forEach(([rawWeight, rawUrl]) => {
    const weight = String(resolveWeightName(rawWeight) || rawWeight || '').replace(/\s+/g, ' ').trim();
    const url = resolveAssetUrl(rawUrl);
    if (!weight || !url) return;
    out[weight] = url;
  });
  return out;
}

function addWeightLookupEntry(lookup, weight, url, prefer = false) {
  const resolvedUrl = resolveAssetUrl(url);
  if (!resolvedUrl) return;

  const token = normalizeWeightLookupToken(weight);
  if (token) {
    if (prefer || !lookup[token]) lookup[token] = resolvedUrl;
  }

  const numericKey = `num:${resolveWeightNumericValue(weight)}`;
  if (prefer || !lookup[numericKey]) lookup[numericKey] = resolvedUrl;
}

function getWeightLookupUrl(lookup, weight) {
  const token = normalizeWeightLookupToken(weight);
  if (token && lookup[token]) return lookup[token];
  const numericKey = `num:${resolveWeightNumericValue(weight)}`;
  return lookup[numericKey] || '';
}

function buildExplicitWeightUrlLookup(font, sourceFonts = []) {
  const lookup = {};

  sourceFonts.forEach(item => {
    const map = normalizeWeightFilesMap(item?.weightFiles || item?.weight_files);
    Object.entries(map).forEach(([weight, url]) => {
      addWeightLookupEntry(lookup, weight, url, false);
    });
  });

  const primaryMap = normalizeWeightFilesMap(font?.weightFiles || font?.weight_files);
  Object.entries(primaryMap).forEach(([weight, url]) => {
    addWeightLookupEntry(lookup, weight, url, true);
  });

  return lookup;
}

function getFontWeightDownloadOptions(font) {
  const fallbackUrl = resolveAssetUrl(font?.downloadUrl || '');
  const sourceFontsAll = getSourceFontsForDisplayFont(font);
  const sourceFonts = sourceFontsAll.filter(item => resolveAssetUrl(item.fontFile));
  const displayWeights = getFontWeightList(font);
  const weightList = displayWeights.length ? displayWeights : [t('weightsLabel')];
  const primaryFontFileUrl = resolveAssetUrl(font?.fontFile || sourceFonts[0]?.fontFile || '');
  const explicitLookup = buildExplicitWeightUrlLookup(font, sourceFontsAll);
  const resolveExplicit = weight => getWeightLookupUrl(explicitLookup, weight);

  if (!sourceFonts.length) {
    const safeFallback = isLikelyDownloadableAssetUrl(fallbackUrl) ? fallbackUrl : '';
    const options = weightList.map((weight, index) => {
      const explicitUrl = resolveExplicit(weight);
      const targetUrl = explicitUrl || safeFallback;
      if (!targetUrl) return null;
      return {
        weight,
        url: targetUrl,
        fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight || `${t('weightsLabel')} ${index + 1}`, targetUrl)
      };
    }).filter(Boolean);
    return options;
  }

  const sources = sourceFonts.map(item => {
    const fileUrl = resolveAssetUrl(item.fontFile);
    const sourceWeightsRaw = mergeUniqueLists([
      normalizeTextList(item?.weights),
      normalizeTextList(item?.freeWeights),
      normalizeTextList(item?.paidWeights)
    ]).map(resolveWeightName);
    const sourceWeights = sourceWeightsRaw.length ? sourceWeightsRaw : normalizeTextList(getFontWeightList(item));
    const inferred = resolveWeightName(inferWeightFromFileName(fileUrl));
    return { item, fileUrl, sourceWeights, inferred };
  });

  const reliableSources = sources.filter(source => {
    const normalizedWeights = mergeUniqueLists([source.sourceWeights])
      .map(value => String(resolveWeightName(value) || value || '').toLowerCase())
      .filter(Boolean);
    return Boolean(source.inferred) || normalizedWeights.length === 1;
  });

const appendExtraWeightFiles = (result) => {
  const extraFiles = normalizeWeightFilesMap(font?.weightFiles || font?.weight_files || {});
  Object.entries(extraFiles).forEach(([weight, url]) => {
    if (weightList.includes(weight)) return;
    const resolvedUrl = resolveAssetUrl(url);
    if (!resolvedUrl) return;
    result.push({
      weight,
      url: resolvedUrl,
      fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight, resolvedUrl)
    });
  });
  return result;
};

const hasReliableWeightMapping = reliableSources.length >= 2;
  if (!hasReliableWeightMapping) {
    if (sources.length > 1) {
      return appendExtraWeightFiles(weightList.map((weight, index) => {
        const explicitUrl = resolveExplicit(weight);
        const normalized = String(resolveWeightName(weight) || weight || '').toLowerCase();
        const inferredMatch = sources.find(source => String(source.inferred || '').toLowerCase() === normalized);
        const source = inferredMatch || sources[index % sources.length] || sources[0];
        const sourceUrl = explicitUrl || source?.fileUrl || primaryFontFileUrl || (isLikelyDownloadableAssetUrl(fallbackUrl) ? fallbackUrl : '');
        return {
          weight,
          url: sourceUrl,
          fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight || `${t('weightsLabel')} ${index + 1}`, sourceUrl)
        };
      }).filter(option => option.url));
    }

    const singleUrl = primaryFontFileUrl || sources[0]?.fileUrl || (isLikelyDownloadableAssetUrl(fallbackUrl) ? fallbackUrl : '');
    if (!singleUrl && !weightList.some(weight => resolveExplicit(weight))) return [];
    return appendExtraWeightFiles(weightList.map((weight, index) => {
      const explicitUrl = resolveExplicit(weight);
      const mappedUrl = explicitUrl || singleUrl;
      return {
        weight,
        url: mappedUrl,
        fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight || `${t('weightsLabel')} ${index + 1}`, mappedUrl)
      };
    }).filter(option => option.url));
  }

  const options = [];
  const used = new Set();
  const mappingSources = reliableSources;

  const takeSourceForWeight = weight => {
    const normalized = String(resolveWeightName(weight) || weight || '').toLowerCase();
    let index = mappingSources.findIndex((source, idx) => !used.has(idx) && String(source.inferred || '').toLowerCase() === normalized);

    if (index === -1) {
      index = mappingSources.findIndex((source, idx) => !used.has(idx) && source.sourceWeights.some(w => String(resolveWeightName(w) || w).toLowerCase() === normalized));
    }

    if (index === -1) {
      index = mappingSources.findIndex((_, idx) => !used.has(idx));
    }
    if (index === -1 && mappingSources.length === 1) index = 0;
    return index;
  };

  displayWeights.forEach(weight => {
    const idx = takeSourceForWeight(weight);
    if (idx < 0) {
      if (primaryFontFileUrl) {
        options.push({
          weight,
          url: primaryFontFileUrl,
          fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight, primaryFontFileUrl)
        });
      }
      return;
    }
    const source = mappingSources[idx];
    if (mappingSources.length > 1) used.add(idx);
    options.push({
      weight,
      url: source.fileUrl,
      fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight, source.fileUrl)
    });
  });

  if (!options.length) {
    mappingSources.forEach((source, index) => {
      const fallbackWeight = source.inferred || `${t('weightsLabel')} ${index + 1}`;
      options.push({
        weight: fallbackWeight,
        url: source.fileUrl,
        fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', fallbackWeight, source.fileUrl)
      });
    });
  }

  const seen = new Set();
  const deduped = options.filter(option => {
    const key = `${String(option.weight).toLowerCase()}::${option.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const byWeightToken = new Map();
  deduped.forEach((option, index) => {
    const token = normalizeWeightLookupToken(option.weight);
    if (token && !byWeightToken.has(token)) {
      byWeightToken.set(token, index);
    }
  });

  weightList.forEach((weight, index) => {
    const explicitUrl = resolveExplicit(weight);
    if (!explicitUrl) return;

    const token = normalizeWeightLookupToken(weight);
    const nextOption = {
      weight,
      url: explicitUrl,
      fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight || `${t('weightsLabel')} ${index + 1}`, explicitUrl)
    };

    const existingIndex = byWeightToken.has(token) ? byWeightToken.get(token) : -1;
    if (existingIndex >= 0) {
      deduped[existingIndex] = nextOption;
      return;
    }

    byWeightToken.set(token, deduped.length);
    deduped.push(nextOption);
  });

  const extraFiles = normalizeWeightFilesMap(font?.weightFiles || font?.weight_files || {});
  Object.entries(extraFiles).forEach(([weight, url]) => {
    if (weightList.includes(weight)) return;
    const resolvedUrl = resolveAssetUrl(url);
    if (!resolvedUrl) return;
    const token = normalizeWeightLookupToken(weight);
    const existingIndex = byWeightToken.has(token) ? byWeightToken.get(token) : -1;
    if (existingIndex >= 0) return;
    deduped.push({
      weight,
      url: resolvedUrl,
      fileName: buildWeightFileName(font?.title || font?.titleEn || 'font', weight, resolvedUrl)
    });
  });

  return deduped.filter(option => option.url);
}

function toUniqueFileName(fileName, usedNames) {
  const clean = String(fileName || 'file').trim() || 'file';
  const extMatch = clean.match(/(\.[a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1] : '';
  const base = ext ? clean.slice(0, -ext.length) : clean;
  let candidate = clean;
  let counter = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base} (${counter})${ext}`;
    counter += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

async function downloadFileDirect(downloadUrl, suggestedName) {
  const resolvedUrl = resolveAssetUrl(downloadUrl);
  if (!resolvedUrl) return false;

  const extensionFromUrl = getExpectedExtension(resolvedUrl, suggestedName);
  const requestedBase = sanitizeFileNameForDownload(suggestedName || 'font');

  let parsedUrl = null;
  try {
    parsedUrl = new URL(resolvedUrl, window.location.href);
  } catch {
    parsedUrl = null;
  }

  const finalUrl = parsedUrl ? parsedUrl.toString() : resolvedUrl;
  const isSameOrigin = !parsedUrl || parsedUrl.origin === window.location.origin;

  if (!isSameOrigin) {
    const link = document.createElement('a');
    link.href = finalUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  }

  try {
    const response = await fetch(finalUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Download failed (${response.status})`);

    const blob = await response.blob();
    const valid = await isValidAssetBlob(blob, extensionFromUrl, response.headers.get('content-type'));
    if (!valid) throw new Error('Invalid downloadable asset payload');

    const ext = extensionFromUrl || guessExtensionFromMimeType(blob.type) || '.otf';
    const base = sanitizeFileNameForDownload(suggestedName || 'font');
    const finalName = base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
    triggerBlobDownload(blob, finalName);
    return true;
  } catch (error) {
    console.error(error);

    try {
      const canOpenDirect = isLikelyDownloadableAssetUrl(finalUrl)
        || ['.otf', '.ttf', '.woff', '.woff2', '.zip'].includes(String(extensionFromUrl || '').toLowerCase());

      if (canOpenDirect) {
        const link = document.createElement('a');
        link.href = finalUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        if (extensionFromUrl) {
          link.download = requestedBase.toLowerCase().endsWith(extensionFromUrl)
            ? requestedBase
            : `${requestedBase}${extensionFromUrl}`;
        }
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      }
    } catch {
    }

    return false;
  }
}

async function buildZipFromEntries(entries, zipName) {
  if (!(await ensureJsZipAvailable())) return false;
  const zip = new window.JSZip();
  const usedNames = new Set();
  let added = 0;

  for (const entry of entries || []) {
    const url = resolveAssetUrl(entry?.url || '');
    if (!url) continue;

    try {
      const expectedExt = getExpectedExtension(url, entry?.fileName || '');
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) continue;

      const blob = await response.blob();
      const valid = true;
      if (!valid) continue;

      const ext = expectedExt || guessExtensionFromMimeType(blob.type) || '.otf';

      const requestedName = sanitizeFileNameForDownload(entry?.fileName || 'font');
      const fileName = requestedName.toLowerCase().endsWith(ext) ? requestedName : `${requestedName}${ext}`;
      const unique = toUniqueFileName(fileName, usedNames);
      const folder = sanitizeFileNameForDownload(entry?.folder || '');
      const target = folder ? `${folder}/${unique}` : unique;
      zip.file(target, blob);
      added += 1;
    } catch {
    }
  }

  if (!added) return false;

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  triggerBlobDownload(zipBlob, `${sanitizeFileNameForDownload(zipName || 'fonts')}.zip`);
  return true;
}

function getFontsByStaticFilters() {
  return getDisplayFonts();
}

function getFilteredFonts() {
  return getFontsByStaticFilters();
}

function renderSearchSuggestions() {
  const suggestionsEl = document.getElementById('search-suggestions');
  if (!suggestionsEl) return;
  suggestionsEl.classList.remove('hidden');
  suggestionsEl.classList.add('hidden');
  suggestionsEl.innerHTML = '';
}

function applyActiveFontFilters() {
  renderHomeFonts(getFilteredFonts());
}

function ensureAdvancedFontControls() {
  const searchWrap = document.querySelector('.home-search-wrap');
  if (searchWrap) searchWrap.remove();

  const suggestions = document.getElementById('search-suggestions');
  if (suggestions) {
    suggestions.classList.add('hidden');
    suggestions.innerHTML = '';
  }

  const legacyControls = document.getElementById('font-advanced-filters');
  if (legacyControls) legacyControls.remove();

  const filterWrap = document.getElementById('home-filter-wrap');
  if (filterWrap) filterWrap.remove();

  const randomBtn = document.getElementById('home-random-font');
  if (randomBtn) randomBtn.remove();

  const fontsHead = document.querySelector('.home-fonts-head');
  if (!fontsHead) return;

  let actions = document.getElementById('home-fonts-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.id = 'home-fonts-actions';
    actions.className = 'home-fonts-actions';
    fontsHead.appendChild(actions);
  }

  let zipBtn = document.getElementById('home-download-all-zip');
  if (!zipBtn) {
    zipBtn = document.createElement('button');
    zipBtn.id = 'home-download-all-zip';
    zipBtn.type = 'button';
    zipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i><span id="home-download-all-zip-text">${escapeHtml(t('downloadAllFontsZip'))}</span>`;
    zipBtn.addEventListener('click', downloadAllFontsZipBundle);
  }

  zipBtn.className = 'home-tool-btn home-tool-btn-zip';
  if (zipBtn.parentElement !== actions) actions.appendChild(zipBtn);
}

function refreshAdvancedFilterOptions() {
  return;
}

function hydrateLazyImages(scope = document) {
  scope.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.dataset.lazyBound === '1') return;
    img.dataset.lazyBound = '1';

    const markReady = () => {
      img.classList.add('img-ready');
      const shell = img.closest('.home-slide, .font-card-media, .fd-shot, .fd-media-stage-open');
      if (shell) shell.classList.add('is-loaded');
    };

    if (img.complete && img.naturalWidth > 0) markReady();
    img.addEventListener('load', markReady, { once: true });
    img.addEventListener('error', markReady, { once: true });
  });
}

async function loadPublicFontStats() {
  publicFontStatsById = {};
  if (isStaticMode) return;

  try {
    const res = await fetch(apiUrl('/font-stats-public'), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch public font stats');
    const payload = await res.json();
    if (payload && typeof payload.byId === 'object' && payload.byId) {
      publicFontStatsById = payload.byId;
    }
  } catch {
    publicFontStatsById = {};
  }
}

function apiUrl(pathname) {
  return `${API_ROOT}${pathname}`;
}

function encodeUrlPath(path) {
  return path.split('/').map(seg => encodeURIComponent(seg)).join('/');
}

function resolveAssetUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const clean = value.trim();
  if (!clean) return '';
  if (URL_SCHEME_RE.test(clean) || URL_PROTOCOL_RELATIVE_RE.test(clean)) return clean;
  if (clean.startsWith('/')) {
    const relativePath = clean.replace(/^\/+/, '');
    const pathname = String(window.location.pathname || '/');
    const pageDir = (pathname.endsWith('/') ? pathname : pathname.replace(/[^/]*$/, '/')).replace(/\/+$/, '/');
    const isFilePublicPath = window.location.protocol === 'file:' && pageDir.toLowerCase().includes('/public/');

    if (/\/public\/$/i.test(pageDir) || isFilePublicPath) return `../${encodeUrlPath(relativePath)}`;

    return `./${encodeUrlPath(relativePath)}`;
  }
  return clean;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function formatHostLabel(url) {
  try {
    const normalized = /^(https?:)?\/\//i.test(url) ? url : `https://${url}`;
    const host = new URL(normalized).hostname.replace(/^www\./, '');
    return host;
  } catch {
    return t('externalLink');
  }
}

function normalizeOutboundUrl(url) {
  const clean = String(url ?? '').trim();
  if (!clean) return '#';
  if (/^(https?:|mailto:|tel:)/i.test(clean)) return clean;
  return `https://${clean.replace(/^\/+/, '')}`;
}

function resolveGoogleFaviconUrl(url) {
  try {
    const normalized = normalizeOutboundUrl(url);
    if (!normalized || normalized === '#') return '';
    const protocol = String(normalized).toLowerCase();
    if (protocol.startsWith('mailto:') || protocol.startsWith('tel:')) return '';
    const host = new URL(normalized).hostname.replace(/^www\./, '').toLowerCase();
    if (!host) return '';
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
  } catch {
    return '';
  }
}

function getCombinedAccountLinks() {
  const allLinks = [
    ...(Array.isArray(contentData?.socialLinks) ? contentData.socialLinks : []),
    ...(Array.isArray(contentData?.workLinks) ? contentData.workLinks : [])
  ];

  const unique = [];
  const seen = new Set();

  allLinks.forEach(link => {
    const href = normalizeOutboundUrl(link?.url || '');
    if (!href || href === '#') return;
    const key = href.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push({ ...link, href });
  });

  return unique;
}

function getFontImages(font) {
  const images = Array.isArray(font?.images) ? font.images : [];
  if (images.length) return images.map(resolveAssetUrl).filter(Boolean);
  const fallback = resolveAssetUrl(font?.image || '');
  return fallback ? [fallback] : [];
}

function normalizeTextList(values) {
  const rawList = Array.isArray(values)
    ? values
    : (typeof values === 'string' ? values.split(',') : []);

  const cleaned = [];
  const seen = new Set();

  rawList.forEach(value => {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    cleaned.push(text);
  });

  return cleaned;
}

function resolveFontZipUrl(font) {
  const direct = resolveAssetUrl(font?.zipUrl || font?.zip_url || '');
  if (direct) return direct;

  const titlePool = `${String(font?.title || '')} ${String(font?.titleEn || font?.title_en || '')}`.trim();
  const matched = KNOWN_FONT_ZIP_FALLBACKS.find(item => item.pattern.test(titlePool));
  if (!matched) return '';
  return resolveAssetUrl(matched.url);
}

function mergeUniqueLists(listOfLists) {
  const merged = [];
  const seen = new Set();

  (listOfLists || []).forEach(list => {
    (list || []).forEach(value => {
      const text = String(value ?? '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const key = text.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(text);
    });
  });

  return merged;
}

function pickFirstNonEmptyString(values) {
  for (const value of values || []) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function pickLongestNonEmptyString(values) {
  let longest = '';
  (values || []).forEach(value => {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (text.length > longest.length) longest = text;
  });
  return longest;
}

function normalizeFontIdentityToken(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\-_]+/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff\s]/gi, ' ')
    .replace(/\b(font|arabic|typeface|type)\b/gi, ' ')
    .replace(/\b(خط|فونت)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFontSortRank(font) {
  const byUpdated = Date.parse(font?.updatedAt || font?.updated_at || '');
  if (Number.isFinite(byUpdated)) return byUpdated;
  const byDate = Date.parse(font?.createdAt || '');
  if (Number.isFinite(byDate)) return byDate;
  const byId = Number(font?.id || 0);
  return Number.isFinite(byId) ? byId : 0;
}

function parseTimestamp(value) {
  const stamp = Date.parse(String(value || ''));
  return Number.isFinite(stamp) ? stamp : 0;
}

function daysSinceTimestamp(timestamp) {
  if (!timestamp) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

function getFontSmartBadges(font) {
  return [];
}

function getPrimaryFontBadge(font) {
  const badges = getFontSmartBadges(font);
  if (!badges.length) return null;
  const newBadge = badges.find(item => item.type === 'new');
  return newBadge || badges[0];
}

function resolveWeightNumericValue(weightName) {
  const token = String(weightName || '').toLowerCase();
  const map = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    ultralight: 200,
    'extra light': 200,
    light: 300,
    regular: 400,
    normal: 400,
    book: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
    salt: 700,
    'رفيع': 100,
    'خفيف': 300,
    'عادي': 400,
    'متوسط': 500,
    'شبهعريض': 600,
    'عريض': 700,
    'عريضجدا': 800,
    'ثقيل': 900,
    'اسود': 900,
    'بولد': 700,
    'ميديوم': 500,
    'ريجولار': 400,
    'لايت': 300,
    'بلاك': 900,
    'بلك': 900
  };

  if (/^\d{3}$/.test(token)) return Number(token);
  const embeddedNumeric = token.match(/\b([1-9]00)\b/);
  if (embeddedNumeric) return Number(embeddedNumeric[1]);
  const compact = token.replace(/[\s_-]+/g, '');
  if (map[compact]) return map[compact];

  const patterns = [
    [/thin|hairline|رفيع/i, 100],
    [/extralight|ultralight|light|لايت|خفيف/i, 300],
    [/regular|normal|book|ريجولار|عادي/i, 400],
    [/medium|med\b|ميديوم|متوسط/i, 500],
    [/semibold|demibold|شبه\s*عريض/i, 600],
    [/extrabold|ultrabold|bold|بولد|عريض/i, 700],
    [/black|heavy|اسود|بلاك|بلك|ثقيل/i, 900],
    [/salt|سالت/i, 700]
  ];

  for (const [pattern, value] of patterns) {
    if (pattern.test(token) || pattern.test(compact)) return value;
  }

  return 500;
}

function buildFontMergeKey(font) {
  const nameTokenEn = normalizeFontIdentityToken(font?.titleEn || '');
  const nameTokenAr = normalizeFontIdentityToken(font?.title || '');
  const nameToken = nameTokenEn || nameTokenAr;
  const downloadToken = String(font?.downloadUrl || '').trim().toLowerCase();

  if (downloadToken) return `url::${downloadToken}`;
  if (nameToken) return `name::${nameToken}`;
  return `id::${String(font?.id || '')}`;
}

function isQahwaFont(font) {
  const token = normalizeFontIdentityToken(`${font?.title || ''} ${font?.titleEn || ''}`);
  return token.includes('qahwa') || token.includes('قهوة');
}

function sortWeightList(values) {
  const weightOrder = {
    Thin: 100,
    ExtraLight: 200,
    Light: 300,
    Regular: 400,
    Medium: 500,
    SemiBold: 600,
    Bold: 700,
    ExtraBold: 800,
    Black: 900,
    Salt: 950
  };

  return [...(values || [])].sort((a, b) => {
    const aa = String(a || '');
    const bb = String(b || '');
    const orderA = weightOrder[aa] ?? 1000;
    const orderB = weightOrder[bb] ?? 1000;
    if (orderA !== orderB) return orderA - orderB;
    return aa.localeCompare(bb, 'en', { sensitivity: 'base' });
  });
}

function getFontWeightList(font) {
  const normalizeQahwaWeightList = values => {
    const allowed = new Set(QAHWA_ALLOWED_WEIGHTS);
    const normalized = normalizeTextList(values).map(resolveWeightName);
    const filtered = normalized.filter(weight => allowed.has(weight));
    const deduped = sortWeightList(mergeUniqueLists([filtered]));
    return deduped.length ? deduped : [...QAHWA_ALLOWED_WEIGHTS];
  };

  const directWeights = sortWeightList(normalizeTextList(font?.weights).map(resolveWeightName));
  if (directWeights.length) {
    if (!isQahwaFont(font)) return normalizeTextList(directWeights);
    return normalizeQahwaWeightList(directWeights);
  }

  const freeWeights = normalizeTextList(font?.freeWeights).map(resolveWeightName);
  const paidWeights = normalizeTextList(font?.paidWeights).map(resolveWeightName);
  const merged = mergeUniqueLists([freeWeights, paidWeights]);
  if (!isQahwaFont(font)) return sortWeightList(merged);
  return normalizeQahwaWeightList(merged);
}

function normalizeFontItem(font) {
  const rawImages = Array.isArray(font?.images)
    ? font.images.map(item => typeof item === 'object' ? (item.src || item.url || item.path || '') : item)
    : (typeof font?.images === 'string' && font.images.trim() ? [font.images] : []);
  const imageList = rawImages.map(resolveAssetUrl).filter(Boolean);
  const singleImage = resolveAssetUrl(font?.image || '');
  const mergedImages = imageList;
  const normalizedId = Number(font?.id);
  const paidValue = font?.isPaid ?? font?.is_paid;
  const normalizedIsPaid = typeof paidValue === 'string'
    ? paidValue.toLowerCase() === 'true'
    : Boolean(paidValue);

  const freeWeights = normalizeTextList(font?.freeWeights || font?.free_weights);
  const paidWeights = normalizeTextList(font?.paidWeights || font?.paid_weights);
  const weights = normalizeTextList(font?.weights);
  const qahwaRecord = isQahwaFont(font);
  const qahwaDesc = qahwaRecord ? QAHWA_DESCRIPTION_BY_LANG : null;
  const weightFiles = normalizeWeightFilesMap(font?.weightFiles || font?.weight_files || {});

  const normalizedDescriptionAr = String(font?.descriptionAr || font?.description_ar || font?.description || '').trim();
  const normalizedDescriptionEn = String(font?.descriptionEn || font?.description_en || '').trim();
  const normalizedDescriptionKu = String(font?.descriptionKu || font?.description_ku || '').trim();

  const strictQahwaWeights = qahwaRecord
    ? getFontWeightList({ ...font, weights, freeWeights, paidWeights, title: font?.title, titleEn: font?.titleEn || font?.title_en })
    : null;

  return {
    ...font,
    id: Number.isFinite(normalizedId) ? normalizedId : font?.id,
    title: String(font?.title || '').trim(),
    titleEn: String(font?.titleEn || font?.title_en || '').trim(),
    descriptionAr: qahwaRecord ? qahwaDesc.ar : normalizedDescriptionAr,
    descriptionEn: qahwaRecord ? qahwaDesc.en : normalizedDescriptionEn,
    descriptionKu: qahwaRecord ? qahwaDesc.ku : normalizedDescriptionKu,
    downloadUrl: String(font?.downloadUrl || font?.download_url || '').trim(),
    zipUrl: resolveFontZipUrl(font),
    image: singleImage,
    images: mergedImages,
    fontFile: resolveAssetUrl(font?.fontFile || font?.font_file || ''),
    weights: qahwaRecord
      ? strictQahwaWeights
      : (weights.length ? weights : mergeUniqueLists([freeWeights, paidWeights])),
    freeWeights,
    paidWeights,
    weightFiles,
    isPaid: normalizedIsPaid,
    license: String(font?.license || '').trim(),
    createdAt: String(font?.createdAt || font?.created_at || '').trim(),
    updatedAt: String(font?.updatedAt || font?.updated_at || '').trim()
  };
}

function normalizeContentData(raw) {
  return {
    socialLinks: Array.isArray(raw?.socialLinks) ? raw.socialLinks : [],
    workLinks: Array.isArray(raw?.workLinks) ? raw.workLinks : [],
    fonts: Array.isArray(raw?.fonts) ? raw.fonts.map(normalizeFontItem) : []
  };
}

function getDisplayFonts() {
  const sourceFonts = Array.isArray(contentData?.fonts) ? contentData.fonts : [];
  if (!sourceFonts.length) {
    displayFontSourceIdsById = {};
    return [];
  }

  const grouped = new Map();
  sourceFonts.forEach(font => {
    const normalized = normalizeFontItem(font);
    const key = buildFontMergeKey(normalized);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(normalized);
  });

  const mergedFonts = [];
  const sourceIdMap = {};

  grouped.forEach(group => {
    const ordered = [...group].sort((a, b) => getFontSortRank(b) - getFontSortRank(a));
    const primary = { ...ordered[0] };

    const sourceIds = ordered
      .map(item => String(item.id || '').trim())
      .filter(Boolean);

    const primaryId = Number(primary.id);
    const sourceIdFallback = Number(sourceIds[0] || '');
    const generatedId = Date.now() + mergedFonts.length;
    primary.id = Number.isFinite(primaryId)
      ? primaryId
      : (Number.isFinite(sourceIdFallback) ? sourceIdFallback : generatedId);

    primary.title = pickLongestNonEmptyString(ordered.map(item => item.title)) || primary.title;
    primary.titleEn = pickLongestNonEmptyString(ordered.map(item => item.titleEn)) || primary.titleEn;
    primary.descriptionAr = pickLongestNonEmptyString(ordered.map(item => item.descriptionAr));
    primary.descriptionEn = pickLongestNonEmptyString(ordered.map(item => item.descriptionEn));
    primary.descriptionKu = pickLongestNonEmptyString(ordered.map(item => item.descriptionKu));
    primary.license = pickLongestNonEmptyString(ordered.map(item => item.license));

    primary.downloadUrl = pickFirstNonEmptyString(ordered.map(item => item.downloadUrl));
    primary.zipUrl = resolveFontZipUrl(primary);
    primary.fontFile = pickFirstNonEmptyString(ordered.map(item => item.fontFile));

    const primaryImages = getFontImages(primary);
    const mergedImages = primaryImages.length
      ? primaryImages
      : mergeUniqueLists(ordered.map(item => getFontImages(item)));
    primary.images = mergedImages;
    primary.image = primary.image || mergedImages[0] || '';

    primary.freeWeights = mergeUniqueLists(
      ordered.map(item => normalizeTextList(item.freeWeights).map(resolveWeightName))
    );
    primary.paidWeights = mergeUniqueLists(
      ordered.map(item => normalizeTextList(item.paidWeights).map(resolveWeightName))
    );

    const mergedWeights = mergeUniqueLists(ordered.map(item => getFontWeightList(item)));
    primary.weights = mergedWeights.length
      ? mergedWeights
      : mergeUniqueLists([primary.freeWeights, primary.paidWeights]);

    const mergedWeightFiles = {};
    ordered.forEach(item => {
      const map = normalizeWeightFilesMap(item.weightFiles || item.weight_files || {});
      Object.entries(map).forEach(([weight, url]) => {
        const canonicalWeight = String(resolveWeightName(weight) || weight || '').replace(/\s+/g, ' ').trim();
        if (!canonicalWeight || !url) return;
        if (!mergedWeightFiles[canonicalWeight]) mergedWeightFiles[canonicalWeight] = url;
      });
    });
    primary.weightFiles = mergedWeightFiles;

    primary.isPaid = ordered.some(item => item.isPaid === true);
    primary.createdAt = pickFirstNonEmptyString(ordered.map(item => item.createdAt));
    primary.updatedAt = pickFirstNonEmptyString(ordered.map(item => item.updatedAt)) || primary.createdAt;

    mergedFonts.push(primary);
    sourceIdMap[String(primary.id)] = sourceIds.length ? sourceIds : [String(primary.id)];
  });

  displayFontSourceIdsById = sourceIdMap;
  return mergedFonts.sort((a, b) => getFontSortRank(b) - getFontSortRank(a));
}

function isLikelyContentPayload(raw) {
  return !!raw && (
    Array.isArray(raw.socialLinks) ||
    Array.isArray(raw.workLinks) ||
    Array.isArray(raw.fonts)
  );
}

function getContentPayloadScore(raw) {
  if (!isLikelyContentPayload(raw)) return -1;

  const fontsCount = Array.isArray(raw?.fonts) ? raw.fonts.length : 0;
  const socialCount = Array.isArray(raw?.socialLinks) ? raw.socialLinks.length : 0;
  const workCount = Array.isArray(raw?.workLinks) ? raw.workLinks.length : 0;

  return (fontsCount * 10000) + (socialCount * 100) + workCount;
}

function pickBestContentPayload(candidates = []) {
  let bestPayload = null;
  let bestScore = -1;

  (candidates || []).forEach(candidate => {
    const score = getContentPayloadScore(candidate);
    if (score > bestScore) {
      bestScore = score;
      bestPayload = candidate;
    }
  });

  return bestPayload;
}

function cacheContentPayload(raw) {
  if (!isLikelyContentPayload(raw)) return;
  try {
    localStorage.setItem(CONTENT_CACHE_STORAGE_KEY, JSON.stringify(raw));
  } catch {
  }
}

function readCachedContentPayload() {
  try {
    const raw = localStorage.getItem(CONTENT_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isLikelyContentPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getEmergencyContentPayload() {
  const fonts = (EMERGENCY_CONTENT_FALLBACK.fonts || []).map(font => ({
    ...font,
    images: Array.isArray(font.images) ? [...font.images] : [],
    weights: Array.isArray(font.weights) ? [...font.weights] : [],
    freeWeights: Array.isArray(font.freeWeights) ? [...font.freeWeights] : [],
    paidWeights: Array.isArray(font.paidWeights) ? [...font.paidWeights] : [],
    weightFiles: (font.weightFiles && typeof font.weightFiles === 'object') ? { ...font.weightFiles } : {}
  }));

  return {
    socialLinks: Array.isArray(EMERGENCY_CONTENT_FALLBACK.socialLinks) ? [...EMERGENCY_CONTENT_FALLBACK.socialLinks] : [],
    workLinks: Array.isArray(EMERGENCY_CONTENT_FALLBACK.workLinks) ? [...EMERGENCY_CONTENT_FALLBACK.workLinks] : [],
    fonts
  };
}

async function safeJsonParse(response) {
  const body = await response.text();
  if (!body.trim()) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function fetchStaticContentCandidates() {
  const candidates = [
    STATIC_CONTENT_URL,
    'content.json',
    '/content.json',
    '../data/content.json',
    './data/content.json',
    '/data/content.json'
  ];

  let bestPayload = null;
  let bestScore = -1;

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) continue;
      const parsed = await safeJsonParse(response);
      if (!isLikelyContentPayload(parsed)) continue;

      const score = getContentPayloadScore(parsed);
      if (score > bestScore) {
        bestScore = score;
        bestPayload = parsed;
      }

      if (Array.isArray(parsed?.fonts) && parsed.fonts.length) {
        return parsed;
      }
    } catch {
    }
  }

  return bestPayload;
}

async function fetchContentData() {
  isStaticMode = true;
  token = null;
  authenticatedAdminUsername = '';

  const staticData = await fetchStaticContentCandidates();
  const embeddedData = window.__EMBEDDED_CONTENT__;
  const cachedData = readCachedContentPayload();
  const emergencyData = getEmergencyContentPayload();

  const bestPayload = pickBestContentPayload([staticData, embeddedData, cachedData, emergencyData]);
  if (isLikelyContentPayload(bestPayload)) {
    cacheContentPayload(bestPayload);
    return normalizeContentData(bestPayload);
  }

  cacheContentPayload(emergencyData);
  return normalizeContentData(emergencyData);
}

/* ──
   Keep the app in read-only mode whenever local data source is used.
   This prevents admin actions from appearing available without backend support.
── */
function markReadonlyWhenNoApi() {
  if (isStaticMode) {
    isStaticMode = true;
  }
}

function updateRuntimeBadge() {
  markReadonlyWhenNoApi();
  const badge = document.getElementById('runtime-badge');
  if (badge) badge.remove();
  document.body.classList.toggle('readonly-mode', isStaticMode);

  const topbarLogo = document.getElementById('topbar-logo');
  if (topbarLogo) {
    topbarLogo.title = t('drawerHome');
  }
}

function requiresServerFeature(featureName = 'هذه الميزة') {
  if (!isStaticMode) return true;
  toast(t('featureUnavailable', { feature: featureName }), true);
  return false;
}

/* ── 100 SOCIAL ICONS MAP ── */
const socialIcons = {
  instagram:       '<i class="fa-brands fa-instagram"></i>',
  twitter:         '<i class="fa-brands fa-x-twitter"></i>',
  'x-twitter':     '<i class="fa-brands fa-x-twitter"></i>',
  x:               '<i class="fa-brands fa-x-twitter"></i>',
  facebook:        '<i class="fa-brands fa-facebook"></i>',
  linkedin:        '<i class="fa-brands fa-linkedin"></i>',
  youtube:         '<i class="fa-brands fa-youtube"></i>',
  tiktok:          '<i class="fa-brands fa-tiktok"></i>',
  snapchat:        '<i class="fa-brands fa-snapchat"></i>',
  telegram:        '<i class="fa-brands fa-telegram"></i>',
  whatsapp:        '<i class="fa-brands fa-whatsapp"></i>',
  pinterest:       '<i class="fa-brands fa-pinterest"></i>',
  reddit:          '<i class="fa-brands fa-reddit"></i>',
  discord:         '<i class="fa-brands fa-discord"></i>',
  twitch:          '<i class="fa-brands fa-twitch"></i>',
  spotify:         '<i class="fa-brands fa-spotify"></i>',
  soundcloud:      '<i class="fa-brands fa-soundcloud"></i>',
  medium:          '<i class="fa-brands fa-medium"></i>',
  tumblr:          '<i class="fa-brands fa-tumblr"></i>',
  flickr:          '<i class="fa-brands fa-flickr"></i>',
  vimeo:           '<i class="fa-brands fa-vimeo"></i>',
  dribbble:        '<i class="fa-brands fa-dribbble"></i>',
  behance:         '<i class="fa-brands fa-behance"></i>',
  deviantart:      '<i class="fa-brands fa-deviantart"></i>',
  figma:           '<i class="fa-brands fa-figma"></i>',
  github:          '<i class="fa-brands fa-github"></i>',
  gitlab:          '<i class="fa-brands fa-gitlab"></i>',
  bitbucket:       '<i class="fa-brands fa-bitbucket"></i>',
  'stack-overflow':'<i class="fa-brands fa-stack-overflow"></i>',
  codepen:         '<i class="fa-brands fa-codepen"></i>',
  npm:             '<i class="fa-brands fa-npm"></i>',
  docker:          '<i class="fa-brands fa-docker"></i>',
  aws:             '<i class="fa-brands fa-aws"></i>',
  react:           '<i class="fa-brands fa-react"></i>',
  angular:         '<i class="fa-brands fa-angular"></i>',
  vuejs:           '<i class="fa-brands fa-vuejs"></i>',
  'node-js':       '<i class="fa-brands fa-node-js"></i>',
  python:          '<i class="fa-brands fa-python"></i>',
  java:            '<i class="fa-brands fa-java"></i>',
  php:             '<i class="fa-brands fa-php"></i>',
  html5:           '<i class="fa-brands fa-html5"></i>',
  css3:            '<i class="fa-brands fa-css3"></i>',
  js:              '<i class="fa-brands fa-js"></i>',
  bootstrap:       '<i class="fa-brands fa-bootstrap"></i>',
  sass:            '<i class="fa-brands fa-sass"></i>',
  yarn:            '<i class="fa-brands fa-yarn"></i>',
  etsy:            '<i class="fa-brands fa-etsy"></i>',
  paypal:          '<i class="fa-brands fa-paypal"></i>',
  patreon:         '<i class="fa-brands fa-patreon"></i>',
  slack:           '<i class="fa-brands fa-slack"></i>',
  skype:           '<i class="fa-brands fa-skype"></i>',
  apple:           '<i class="fa-brands fa-apple"></i>',
  google:          '<i class="fa-brands fa-google"></i>',
  android:         '<i class="fa-brands fa-android"></i>',
  microsoft:       '<i class="fa-brands fa-microsoft"></i>',
  windows:         '<i class="fa-brands fa-windows"></i>',
  amazon:          '<i class="fa-brands fa-amazon"></i>',
  shopify:         '<i class="fa-brands fa-shopify"></i>',
  wordpress:       '<i class="fa-brands fa-wordpress"></i>',
  'google-drive':  '<i class="fa-brands fa-google-drive"></i>',
  dropbox:         '<i class="fa-brands fa-dropbox"></i>',
  steam:           '<i class="fa-brands fa-steam"></i>',
  playstation:     '<i class="fa-brands fa-playstation"></i>',
  xbox:            '<i class="fa-brands fa-xbox"></i>',
  'itch-io':       '<i class="fa-brands fa-itch-io"></i>',
  vk:              '<i class="fa-brands fa-vk"></i>',
  weibo:           '<i class="fa-brands fa-weibo"></i>',
  qq:              '<i class="fa-brands fa-qq"></i>',
  line:            '<i class="fa-brands fa-line"></i>',
  xing:            '<i class="fa-brands fa-xing"></i>',
  'product-hunt':  '<i class="fa-brands fa-product-hunt"></i>',
  'hacker-news':   '<i class="fa-brands fa-hacker-news"></i>',
  'y-combinator':  '<i class="fa-brands fa-y-combinator"></i>',
  angellist:       '<i class="fa-brands fa-angellist"></i>',
  foursquare:      '<i class="fa-brands fa-foursquare"></i>',
  yelp:            '<i class="fa-brands fa-yelp"></i>',
  airbnb:          '<i class="fa-brands fa-airbnb"></i>',
  uber:            '<i class="fa-brands fa-uber"></i>',
  lyft:            '<i class="fa-brands fa-lyft"></i>',
  stripe:          '<i class="fa-brands fa-stripe"></i>',
  bitcoin:         '<i class="fa-brands fa-bitcoin"></i>',
  ethereum:        '<i class="fa-brands fa-ethereum"></i>',
  kickstarter:     '<i class="fa-brands fa-kickstarter"></i>',
  jira:            '<i class="fa-brands fa-jira"></i>',
  trello:          '<i class="fa-brands fa-trello"></i>',
  atlassian:       '<i class="fa-brands fa-atlassian"></i>',
  lastfm:          '<i class="fa-brands fa-lastfm"></i>',
  bandcamp:        '<i class="fa-brands fa-bandcamp"></i>',
  deezer:          '<i class="fa-brands fa-deezer"></i>',
  'app-store':     '<i class="fa-brands fa-app-store"></i>',
  'google-play':   '<i class="fa-brands fa-google-play"></i>',
  'font-awesome':  '<i class="fa-brands fa-font-awesome"></i>',
  'creative-commons':'<i class="fa-brands fa-creative-commons"></i>',
  link:            '<i class="fa-solid fa-link"></i>',
  envelope:        '<i class="fa-solid fa-envelope"></i>',
  globe:           '<i class="fa-solid fa-globe"></i>',
  phone:           '<i class="fa-solid fa-phone"></i>',
  'location-dot':  '<i class="fa-solid fa-location-dot"></i>',
  'share-nodes':   '<i class="fa-solid fa-share-nodes"></i>',
  store:           '<i class="fa-solid fa-store"></i>',
  briefcase:       '<i class="fa-solid fa-briefcase"></i>',
  video:           '<i class="fa-solid fa-video"></i>',
  image:           '<i class="fa-solid fa-image"></i>',
  music:           '<i class="fa-solid fa-music"></i>',
  star:            '<i class="fa-solid fa-star"></i>',
  heart:           '<i class="fa-solid fa-heart"></i>',
  camera:          '<i class="fa-solid fa-camera"></i>',
  pencil:          '<i class="fa-solid fa-pencil"></i>',
  code:            '<i class="fa-solid fa-code"></i>',
  laptop:          '<i class="fa-solid fa-laptop"></i>',
  default:         '<i class="fa-solid fa-link"></i>'
};

/* ── ICON LIBRARY for picker ── */
const iconLibrary = [
  {n:'Instagram',i:'instagram'},{n:'X / Twitter',i:'x-twitter'},{n:'Facebook',i:'facebook'},
  {n:'LinkedIn',i:'linkedin'},{n:'YouTube',i:'youtube'},{n:'TikTok',i:'tiktok'},
  {n:'Snapchat',i:'snapchat'},{n:'Telegram',i:'telegram'},{n:'WhatsApp',i:'whatsapp'},
  {n:'Pinterest',i:'pinterest'},{n:'Reddit',i:'reddit'},{n:'Discord',i:'discord'},
  {n:'Twitch',i:'twitch'},{n:'Spotify',i:'spotify'},{n:'SoundCloud',i:'soundcloud'},
  {n:'Medium',i:'medium'},{n:'Tumblr',i:'tumblr'},{n:'Flickr',i:'flickr'},
  {n:'Vimeo',i:'vimeo'},{n:'Dribbble',i:'dribbble'},{n:'Behance',i:'behance'},
  {n:'DeviantArt',i:'deviantart'},{n:'Figma',i:'figma'},
  {n:'GitHub',i:'github'},{n:'GitLab',i:'gitlab'},{n:'Bitbucket',i:'bitbucket'},
  {n:'Stack Overflow',i:'stack-overflow'},{n:'CodePen',i:'codepen'},
  {n:'npm',i:'npm'},{n:'Docker',i:'docker'},{n:'AWS',i:'aws'},
  {n:'React',i:'react'},{n:'Angular',i:'angular'},{n:'Vue.js',i:'vuejs'},
  {n:'Node.js',i:'node-js'},{n:'Python',i:'python'},{n:'Java',i:'java'},
  {n:'PHP',i:'php'},{n:'HTML5',i:'html5'},{n:'CSS3',i:'css3'},
  {n:'JavaScript',i:'js'},{n:'Bootstrap',i:'bootstrap'},{n:'Sass',i:'sass'},
  {n:'Yarn',i:'yarn'},{n:'Etsy',i:'etsy'},{n:'PayPal',i:'paypal'},
  {n:'Patreon',i:'patreon'},{n:'Slack',i:'slack'},{n:'Skype',i:'skype'},
  {n:'Apple',i:'apple'},{n:'Google',i:'google'},{n:'Android',i:'android'},
  {n:'Microsoft',i:'microsoft'},{n:'Windows',i:'windows'},{n:'Amazon',i:'amazon'},
  {n:'Shopify',i:'shopify'},{n:'WordPress',i:'wordpress'},
  {n:'Google Drive',i:'google-drive'},{n:'Dropbox',i:'dropbox'},
  {n:'Steam',i:'steam'},{n:'PlayStation',i:'playstation'},{n:'Xbox',i:'xbox'},
  {n:'Itch.io',i:'itch-io'},{n:'VK',i:'vk'},{n:'Weibo',i:'weibo'},
  {n:'QQ',i:'qq'},{n:'Line',i:'line'},{n:'Xing',i:'xing'},
  {n:'Product Hunt',i:'product-hunt'},{n:'Hacker News',i:'hacker-news'},
  {n:'Y Combinator',i:'y-combinator'},{n:'AngelList',i:'angellist'},
  {n:'Foursquare',i:'foursquare'},{n:'Yelp',i:'yelp'},{n:'Airbnb',i:'airbnb'},
  {n:'Uber',i:'uber'},{n:'Lyft',i:'lyft'},{n:'Stripe',i:'stripe'},
  {n:'Bitcoin',i:'bitcoin'},{n:'Ethereum',i:'ethereum'},
  {n:'Kickstarter',i:'kickstarter'},{n:'Jira',i:'jira'},{n:'Trello',i:'trello'},
  {n:'Atlassian',i:'atlassian'},{n:'Last.fm',i:'lastfm'},{n:'Bandcamp',i:'bandcamp'},
  {n:'Deezer',i:'deezer'},{n:'App Store',i:'app-store'},{n:'Google Play',i:'google-play'},
  {n:'رابط',i:'link'},{n:'بريد',i:'envelope'},{n:'موقع',i:'globe'},
  {n:'هاتف',i:'phone'},{n:'موضع',i:'location-dot'},{n:'مشاركة',i:'share-nodes'},
  {n:'متجر',i:'store'},{n:'حقيبة',i:'briefcase'},{n:'فيديو',i:'video'},
  {n:'صورة',i:'image'},{n:'موسيقى',i:'music'},{n:'نجمة',i:'star'},
  {n:'قلب',i:'heart'},{n:'كاميرا',i:'camera'},{n:'كود',i:'code'},
  {n:'لابتوب',i:'laptop'}
];

function getIcon(icon, iconSvg) {
  if (iconSvg && iconSvg.trim().startsWith('<')) return iconSvg;
  return socialIcons[icon?.toLowerCase()] || socialIcons.default;
}

function inferSocialIconKey(link = {}) {
  const source = `${String(link.platform || '')} ${String(link.url || '')}`.toLowerCase();

  if (/instagram|ig\b/.test(source)) return 'instagram';
  if (/behance|be\.net/.test(source)) return 'behance';
  if (/t\.me|telegram/.test(source)) return 'telegram';
  if (/wa\.me|whatsapp/.test(source)) return 'whatsapp';
  if (/snapchat/.test(source)) return 'snapchat';
  if (/tiktok/.test(source)) return 'tiktok';
  if (/youtube|youtu\.be/.test(source)) return 'youtube';
  if (/linkedin|lnkd\.in/.test(source)) return 'linkedin';
  if (/facebook|fb\.com|messenger/.test(source)) return 'facebook';
  if (/twitter|x\.com/.test(source)) return 'x-twitter';
  if (/discord/.test(source)) return 'discord';
  if (/github/.test(source)) return 'github';
  if (/gitlab/.test(source)) return 'gitlab';
  if (/dribbble/.test(source)) return 'dribbble';
  if (/pinterest/.test(source)) return 'pinterest';
  if (/reddit/.test(source)) return 'reddit';
  if (/vimeo/.test(source)) return 'vimeo';
  if (/flickr/.test(source)) return 'flickr';
  if (/soundcloud/.test(source)) return 'soundcloud';
  if (/spotify/.test(source)) return 'spotify';
  if (/mailto:|@/.test(source)) return 'envelope';
  if (/tel:|\+\d{7,}/.test(source)) return 'phone';
  if (/https?:\/\//.test(source) || /www\./.test(source)) return 'globe';

  return 'link';
}

function getLinkIcon(link = {}) {
  const googleFaviconUrl = resolveGoogleFaviconUrl(link?.url || '');
  if (googleFaviconUrl) {
    const label = escapeHtml(String(link?.platform || formatHostLabel(link?.url || '') || t('externalLink')));
    return `<img class="google-favicon-icon" src="${googleFaviconUrl}" alt="${label}" loading="lazy" referrerpolicy="no-referrer" />`;
  }

  const explicit = String(link.icon || '').toLowerCase().trim();
  if (explicit && explicit !== 'default' && socialIcons[explicit]) {
    return socialIcons[explicit];
  }

  const inferred = inferSocialIconKey(link);
  return socialIcons[inferred] || socialIcons.default;
}

/* ── Font family name per font ID ── */
function fontFamilyName(id) { return `fp-${id}`; }

function weightPreviewFamilyName(fontId, index) {
  return `fpw-${fontId}-${index}`;
}

function ensureWeightPreviewFacesStyleTag() {
  let styleTag = document.getElementById('dynamic-weight-preview-faces');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-weight-preview-faces';
    document.head.appendChild(styleTag);
  }
  return styleTag;
}

function refreshWeightPreviewFontFaces(font, options = []) {
  currentWeightPreviewFamilyByWeight = {};
  currentWeightPreviewFamilyByIndex = {};

  const styleTag = ensureWeightPreviewFacesStyleTag();
  if (!font || !Array.isArray(options) || !options.length) {
    styleTag.textContent = '';
    return;
  }

  const rules = [];
  const seenRules = new Set();

  options.forEach((option, index) => {
    const source = resolveAssetUrl(option?.url || option?.source || '');
    if (!source) return;

    const family = weightPreviewFamilyName(font.id, index);
    const ruleKey = `${family}::${source}`;
    if (!seenRules.has(ruleKey)) {
      seenRules.add(ruleKey);
      const fmt = detectFontFormatFromSource(source);
      rules.push(`@font-face { font-family: '${family}'; src: url('${source}') format('${fmt}'); font-weight: 400; font-style: normal; font-display: swap; }`);
    }

    currentWeightPreviewFamilyByIndex[index] = family;

    const normalizedWeight = String(resolveWeightName(option?.weight || '') || option?.weight || '').toLowerCase().trim();
    if (normalizedWeight && !currentWeightPreviewFamilyByWeight[normalizedWeight]) {
      currentWeightPreviewFamilyByWeight[normalizedWeight] = family;
    }

    const numericWeight = String(resolveWeightNumericValue(option?.weight || ''));
    if (numericWeight && !currentWeightPreviewFamilyByWeight[numericWeight]) {
      currentWeightPreviewFamilyByWeight[numericWeight] = family;
    }
  });

  styleTag.textContent = rules.join('\n');
}

function resolveWeightPreviewStyleConfig(weight, fallbackFamilyCSS, index = -1) {
  let mappedFamily = '';

  if (Number.isFinite(index) && index >= 0) {
    mappedFamily = currentWeightPreviewFamilyByIndex[index] || '';
  }

  if (!mappedFamily) {
    const normalizedWeight = String(resolveWeightName(weight) || weight || '').toLowerCase().trim();
    const numericWeight = String(resolveWeightNumericValue(weight));
    mappedFamily = currentWeightPreviewFamilyByWeight[normalizedWeight] || currentWeightPreviewFamilyByWeight[numericWeight] || '';
  }

  const numericWeight = resolveWeightNumericValue(weight);
  if (mappedFamily) {
    return {
      familyCSS: `'${mappedFamily}', serif`,
      weight: 400,
      variation: numericWeight
    };
  }

  return {
    familyCSS: fallbackFamilyCSS,
    weight: numericWeight,
    variation: numericWeight
  };
}

function injectFontFaces(fonts) {
  const styleTag = document.getElementById('dynamic-font-faces');
  if (!styleTag) return;

  const buildRule = (family, source, weightValue) => {
    const fmt = detectFontFormatFromSource(source);
    return `@font-face { font-family: '${family}'; src: url('${source}') format('${fmt}'); font-weight: ${weightValue}; font-style: normal; font-display: swap; }`;
  };

  const rules = [];
  (fonts || []).forEach(font => {
    const family = fontFamilyName(font.id);
    const options = getFontWeightDownloadOptions(font)
      .map(option => ({
        source: resolveAssetUrl(option?.url || ''),
        weight: resolveWeightNumericValue(option?.weight)
      }))
      .filter(option => option.source);

    const weightedUnique = [];
    const weightedSeen = new Set();
    options.forEach(option => {
      const key = `${option.source}::${option.weight}`;
      if (weightedSeen.has(key)) return;
      weightedSeen.add(key);
      weightedUnique.push(option);
    });

    const uniqueSources = Array.from(new Set(weightedUnique.map(option => option.source)));

    if (weightedUnique.length > 1 && uniqueSources.length > 1) {
      weightedUnique.forEach(option => {
        rules.push(buildRule(family, option.source, String(option.weight)));
      });
      return;
    }

    const fallbackSource = resolveAssetUrl(font?.fontFile || uniqueSources[0] || weightedUnique[0]?.source || '');
    if (!fallbackSource) return;
    rules.push(buildRule(family, fallbackSource, '400'));
  });

  styleTag.textContent = rules.join('\n');
}

function setDrawerActive(id) {
  document.querySelectorAll('.drawer-item').forEach(button => button.classList.remove('active'));
  document.querySelectorAll(`.drawer-item[data-section="${id}"]`).forEach(button => button.classList.add('active'));
}

function removeAccountsFromPublicUi() {
  const accountsSection = document.getElementById('sec-accounts');
  if (accountsSection) accountsSection.remove();

  document.querySelectorAll('.drawer-item[data-section="accounts"]').forEach(button => {
    const prev = button.previousElementSibling;
    const next = button.nextElementSibling;
    if (prev && prev.classList.contains('drawer-divider')) prev.remove();
    if (next && next.classList.contains('drawer-divider')) next.remove();
    button.remove();
  });
}

function ensureBrandLogos() {
  const fallback = './logo.jpeg';
  document.querySelectorAll('#topbar-logo, .home-logo, #splash-logo').forEach(img => {
    if (!(img instanceof HTMLImageElement)) return;

    const current = String(img.getAttribute('src') || '').trim();
    if (!current) img.setAttribute('src', fallback);

    if (img.dataset.logoBound === '1') return;
    img.dataset.logoBound = '1';

    img.addEventListener('error', () => {
      img.classList.add('logo-fallback');
      if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
    });

    img.addEventListener('load', () => {
      img.classList.remove('logo-fallback');
      img.style.visibility = 'visible';
      img.style.opacity = '1';
    });
  });
}

function isZipDisabledForFont(font) {
  const title = String(font?.title || '').toLowerCase();
  const titleEn = String(font?.titleEn || font?.title_en || '').toLowerCase();
  return /موناكو\s*كوفي|monaco\s*kufi|monaco\s*coffee/.test(`${title} ${titleEn}`);
}

function initPageTransitionState() {
  const body = document.body;
  if (!body) return;

  body.classList.add('page-transition-ready');

  let shouldFadeIn = false;
  try {
    shouldFadeIn = sessionStorage.getItem(PAGE_TRANSITION_STORAGE_KEY) === '1';
    if (shouldFadeIn) sessionStorage.removeItem(PAGE_TRANSITION_STORAGE_KEY);
  } catch {
    shouldFadeIn = false;
  }

  if (!shouldFadeIn) return;

  body.classList.add('page-transition-enter');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      body.classList.remove('page-transition-enter');
    });
  });
}

initPageTransitionState();
removeAccountsFromPublicUi();

function navigateTo(routeKey, params = {}) {
  if (isPageNavigating) return;

  const route = PAGE_ROUTES[routeKey] || PAGE_ROUTES.home;
  const url = new URL(route, window.location.href);
  url.searchParams.set('lang', currentLanguage);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  const targetHref = url.toString();
  if (targetHref === window.location.href) return;

  isPageNavigating = true;
  try {
    sessionStorage.setItem(PAGE_TRANSITION_STORAGE_KEY, '1');
  } catch {
  }

  document.body.classList.add('page-transition-leave');
  window.setTimeout(() => {
    window.location.href = targetHref;
  }, PAGE_TRANSITION_MS);
}

window.addEventListener('load', async () => {
  ensureBrandLogos();
  await loadContent();
  ensureBrandLogos();

  if (pageType !== 'font' && pageType !== 'accounts') trackVisit();

  if (pageType === 'font') {
    setDrawerActive('fonts');
    const params = new URLSearchParams(window.location.search);
    const requestedId = Number(params.get('id'));
    const fonts = getDisplayFonts();

    if (!fonts.length) {
      toast(t('noFontsAvailable'), true);
      return;
    }

    const fallbackId = Number(fonts[0].id);
    const initialId = Number.isFinite(requestedId) ? requestedId : fallbackId;
    const rendered = renderFontDetailPage(initialId);
    const activeFontId = rendered ? Number(currentFontId) : fallbackId;
    if (!rendered && Number.isFinite(fallbackId)) renderFontDetailPage(fallbackId);

    if (Number.isFinite(activeFontId)) {
      const url = new URL(window.location.href);
      url.searchParams.set('id', String(activeFontId));
      window.history.replaceState({}, '', url.toString());
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  if (pageType === 'accounts') {
    navigateTo('home');
    return;
  }

  if (pageType === 'fonts') {
    setDrawerActive('fonts');
    const fontsSection = document.getElementById('home-fonts-section');
    if (fontsSection) fontsSection.scrollIntoView({ block: 'start' });
    return;
  }

  setDrawerActive('home');
});

function trackVisit() {
  return;
}

/* ── SECTION SWITCHING ── */
function switchSection(id) {
  if (id === 'home') {
    if (pageType === 'home') {
      setDrawerActive('home');
      closeDrawer();
      window.scrollTo(0, 0);
      return;
    }
    navigateTo('home');
    return;
  }

  if (id === 'fonts') {
    if (pageType === 'fonts') {
      setDrawerActive('fonts');
      closeDrawer();
      const fontsSection = document.getElementById('home-fonts-section');
      if (fontsSection) fontsSection.scrollIntoView({ block: 'start' });
      return;
    }
    navigateTo('fonts');
    return;
  }

  if (id === 'accounts') {
    closeDrawer();
    navigateTo('home');
    return;
  }

  if (id === 'font-detail' && currentFontId) {
    navigateTo('font', { id: currentFontId });
    return;
  }
}

/* ── DRAWER ── */
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}
document.getElementById('menu-toggle').addEventListener('click', () => {
    const d = document.getElementById('drawer');
    if (d && d.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);
document.querySelectorAll('.drawer-item').forEach(btn => {
  btn.addEventListener('click', e => {
    const section = btn.dataset.section;
    if (!section) return;
    e.preventDefault();
    switchSection(section);
  });
});

const topbarLogoBtn = document.getElementById('topbar-logo');

function attemptOpenAdminFromLogoTap() {
  return false;
}

if (topbarLogoBtn) {
  topbarLogoBtn.addEventListener('click', () => {
    closeDrawer();
    if (pageType === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigateTo('home');
  });
}

/* ── LOAD CONTENT ── */
async function loadContent() {
  try {
    contentData = await fetchContentData();

    if (!Array.isArray(contentData?.fonts) || !contentData.fonts.length) {
      const emergencyData = getEmergencyContentPayload();
      contentData = normalizeContentData(emergencyData);
      cacheContentPayload(emergencyData);
    }

    updateRuntimeBadge();
    injectFontFaces(getDisplayFonts());
    await loadPublicFontStats();
    setHomeMetrics();

    applyActiveFontFilters();
    ensurePublicFontsVisibility();
    if (pageType !== 'font') initHomeSlider();
    bindRandomFontButton();

    try { renderSocial(); } catch (error) { console.error('renderSocial failed:', error); }
    try { renderAccountRails(); } catch (error) { console.error('renderAccountRails failed:', error); }
    loadVisitorCount().catch(error => console.error('loadVisitorCount failed:', error));
    try { ensureAdvancedFontControls(); } catch (error) { console.error('ensureAdvancedFontControls failed:', error); }
    try { initWeightFileBuilders(); } catch (error) { console.error('initWeightFileBuilders failed:', error); }
    try { initSearch(); } catch (error) { console.error('initSearch failed:', error); }
    try { refreshAdvancedFilterOptions(); } catch (error) { console.error('refreshAdvancedFilterOptions failed:', error); }

    hydrateLazyImages();
    try { updateSeoMetadata(); } catch (error) { console.error('updateSeoMetadata failed:', error); }
  } catch(e) {
    console.error(e);
    toast(t('contentLoadError'), true);
  }
}

function setHomeMetrics() {
  const metricsWrap = document.getElementById('home-metrics');
  if (metricsWrap) metricsWrap.remove();
}

function bindRandomFontButton() {
  const randomBtn = document.getElementById('home-random-font');
  if (randomBtn) randomBtn.remove();
}

function renderLinkSection(targetId, links, emptyLabel) {
  const grid = document.getElementById(targetId);
  if (!grid) return;

  const active = (links || []).filter(link => link?.url);
  if (!active.length) {
    grid.innerHTML = `<p class="links-empty">${escapeHtml(emptyLabel)}</p>`;
    return;
  }

  grid.innerHTML = active.map(link => {
    const href = normalizeOutboundUrl(link.url);
    const platformLabel = escapeHtml(String(link.platform || t('accountLabel')).trim() || t('accountLabel'));
    const iconHtml = getLinkIcon(link);
    return `
      <a class="social-icon-card" href="${href}" target="_blank" rel="noopener" aria-label="${platformLabel}" title="${platformLabel}">
        <div class="card-inner">
          <span class="src-icon">${iconHtml}</span>
          <span class="src-label">${platformLabel}</span>
        </div>
      </a>`;
  }).join('');
}

/* ── SOCIAL ── */
function renderSocial() {
  renderLinkSection('social-grid', contentData.socialLinks, t('linksPersonalEmpty'));
}

function renderWorkSocial() {
  renderLinkSection('work-social-grid', contentData.workLinks, t('linksWorkEmpty'));
}

/* ── WEIGHT NAME MAPPING ── */
const weightNameMap = {
  '100':'Thin',
  '200':'ExtraLight',
  '300':'Light',
  '400':'Regular',
  '500':'Medium',
  '600':'SemiBold',
  '700':'Bold',
  '800':'ExtraBold',
  '900':'Black',
  'regular':'Regular',
  'normal':'Regular',
  'medium':'Medium',
  'med':'Medium',
  'bold':'Bold',
  'black':'Black',
  'salt':'Salt',
  'qahwa salt':'Salt',
  'سالت':'Salt'
};
function resolveWeightName(w) {
  const raw = String(w ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  return weightNameMap[raw] || weightNameMap[lower] || raw;
}

function selectCardPosterImage(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (!list.length) return FALLBACK_IMAGE_URL;

  const preferred = list.find(src => {
    const name = String(src || '').split('/').pop() || '';
    return /(cover|preview|poster|thumb|main|hero|01|1)/i.test(name);
  });

  return preferred || list[0];
}

/* ── FONT CARDS ── */
function buildFontCard(f) {
  const weights = getFontWeightList(f);
  const en = f.titleEn || '';
  const posters = getFontImages(f);
  const posterCover = resolveAssetUrl(f.image || '') || selectCardPosterImage(posters);
  const posterCount = posters.length;
  const rawTitle = String(f.title || t('accountLabel'));
  const safeTitle = escapeHtml(rawTitle);
  const safeEn = escapeHtml(en);
  const family = f.fontFile ? fontFamilyName(f.id) : 'Qahwa';
  const familyCSS = `'${family}', serif`;
  const badge = getPrimaryFontBadge(f);
  const badgeHtml = badge
    ? `<span class="font-smart-badge ${badge.type}">${escapeHtml(badge.label)}</span>`
    : '';
  const priceBadge = f.isPaid
    ? `<span class="badge-paid">${t('paid')}</span>`
    : `<span class="badge-free">${t('free')}</span>`;
  const weightCountBadge = weights.length
    ? `<span class="font-card-weight-count">${formatLocalizedNumber(weights.length)} ${escapeHtml(t('weightsLabel'))}</span>`
    : '';

  return `
    <div class="font-card" data-font-id="${f.id}" onclick="openFontPage(${f.id})" role="button" tabindex="0" aria-label="${escapeHtml(t('openFontDetails', { title: rawTitle }))}">
      <div class="font-card-media">
        <img class="smart-lazy-img" src="${posterCover}" alt="${safeTitle}" loading="lazy" onerror="${IMAGE_ONERROR_ATTR}" />
        ${badgeHtml}
        <span class="font-card-poster-count">
          <i class="fa-regular fa-images"></i>
          ${formatLocalizedNumber(posterCount)}
        </span>
      </div>
      <div class="font-card-body">
        <div class="font-card-preview">
          <span class="font-card-ar" style="font-family:${familyCSS}">${safeTitle}</span>
          ${safeEn ? `<span class="font-card-en" style="font-family:${familyCSS}">${safeEn}</span>` : ''}
        </div>
      </div>
      <div class="font-card-footer">
        <div class="font-card-footer-left">
          ${priceBadge}
          ${weightCountBadge}
        </div>
        <span class="font-card-arrow"><i class="fa-solid fa-arrow-left"></i></span>
      </div>
    </div>`;
}

function renderHomeFonts(filtered) {
  const grid = document.getElementById('home-fonts-grid');
  const empty = document.getElementById('home-fonts-empty');
  const items = filtered !== undefined ? filtered : getDisplayFonts();
  const orderedItems = [...items].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  if (!grid) return;
  if (!orderedItems.length) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  grid.innerHTML = orderedItems.map(f => buildFontCard(f)).join('');
  hydrateLazyImages(grid);
  grid.querySelectorAll('.font-card').forEach(card => {
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      card.click();
    });
  });
}

function ensurePublicFontsVisibility() {
  if (pageType === 'font') return;

  const homeSection = document.getElementById('sec-home');
  if (homeSection) {
    homeSection.classList.add('active');
    homeSection.style.setProperty('display', 'flex', 'important');
    homeSection.style.setProperty('visibility', 'visible', 'important');
    homeSection.style.setProperty('opacity', '1', 'important');
  }

  const fontsSection = document.getElementById('home-fonts-section');
  const grid = document.getElementById('home-fonts-grid');
  const empty = document.getElementById('home-fonts-empty');
  const fonts = getDisplayFonts();

  if (fontsSection) {
    fontsSection.classList.remove('hidden');
    fontsSection.style.removeProperty('visibility');
    fontsSection.style.removeProperty('opacity');
    fontsSection.style.removeProperty('display');
  }

  if (!grid) return;

  if (fonts.length && !grid.children.length) {
    renderHomeFonts(fonts);
  }

  if (!fonts.length) {
    const emergencyData = getEmergencyContentPayload();
    if (Array.isArray(emergencyData?.fonts) && emergencyData.fonts.length) {
      contentData = normalizeContentData(emergencyData);
      cacheContentPayload(emergencyData);
      injectFontFaces(getDisplayFonts());
      renderHomeFonts(getDisplayFonts());
    }
  }

  const safeFonts = getDisplayFonts();
  if (safeFonts.length) {
    grid.classList.remove('hidden');
    grid.style.setProperty('display', 'grid', 'important');
    if (empty) empty.classList.add('hidden');
  } else if (empty) {
    empty.classList.remove('hidden');
  }
}

/* ── SEARCH ── */
function initSearch() {
  const searchWrap = document.querySelector('.home-search-wrap');
  if (searchWrap) searchWrap.remove();
  fontFilterState.query = '';
  renderSearchSuggestions();
}

/* ── HOME SLIDER ── */
let sliderIndex = 0;
let sliderTimer = null;
let sliderTotal = 0;

function ensureFontSliderMountPoint() {
  const wrap = document.getElementById('home-slider-wrap');
  if (!wrap) return null;

  if (pageType !== 'font') return wrap;

  const detailPage = document.querySelector('.font-detail-page');
  if (!detailPage) return wrap;

  let anchor = document.getElementById('fd-slider-anchor');
  if (!anchor) {
    anchor = document.createElement('div');
    anchor.id = 'fd-slider-anchor';
    anchor.className = 'fd-slider-anchor';
    const header = detailPage.querySelector('.font-detail-header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(anchor, header.nextSibling);
    } else {
      detailPage.prepend(anchor);
    }
  }

  if (wrap.parentElement !== anchor) anchor.appendChild(wrap);
  return wrap;
}

function initHomeSlider(targetFont = null) {
  const wrap = ensureFontSliderMountPoint();
  clearInterval(sliderTimer);

  if (!wrap) return;
  if (pageType !== 'font') {
    sliderTotal = 0;
    wrap.classList.add('hidden');
    return;
  }

  const fallbackFont = getDisplayFonts().find(item => Number(item.id) === Number(currentFontId)) || getDisplayFonts()[0] || null;
  const activeFont = targetFont || fallbackFont;
  const slides = [];

  if (activeFont) {
    getFontImages(activeFont).forEach(img => {
      slides.push({ img, font: activeFont });
    });
  }

  if (!slides.length) {
    sliderTotal = 0;
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');

  const slider = document.getElementById('home-slider');
  const dots   = document.getElementById('home-slider-dots');
  const btnPrev = document.getElementById('slider-prev');
  const btnNext = document.getElementById('slider-next');
  if (!slider || !dots) return;

  sliderTotal = slides.length;
  const family = f => f.fontFile ? `'${fontFamilyName(f.id)}', serif` : 'var(--font-black), serif';

  slider.innerHTML = slides.map(s => `
    <div class="home-slide" onclick="openFontPage(${s.font.id})">
      <img class="smart-lazy-img" src="${s.img || FALLBACK_IMAGE_URL}" alt="${escapeHtml(s.font.title || t('fontPoster'))}" loading="lazy" onerror="${IMAGE_ONERROR_ATTR}" />
      <div class="home-slide-label">
        <span class="home-slide-title" style="font-family:${family(s.font)}">${escapeHtml(s.font.title)}</span>
        ${s.font.titleEn ? `<span class="home-slide-en">${escapeHtml(s.font.titleEn)}</span>` : ''}
      </div>
    </div>`).join('');

  hydrateLazyImages(slider);

  dots.innerHTML = slides.map((_, i) =>
    `<button class="slider-dot${i === 0 ? ' active' : ''}" onclick="goSlide(${i})"></button>`).join('');

  const hasMultiSlides = sliderTotal > 1;
  if (btnPrev) {
    btnPrev.classList.toggle('hidden', !hasMultiSlides);
    btnPrev.onclick = () => {
      const step = getDirectionalNavigationSteps().prev;
      sliderIndex = (sliderIndex + step + sliderTotal) % sliderTotal;
      updateSliderPos();
      resetSliderTimer();
    };
  }
  if (btnNext) {
    btnNext.classList.toggle('hidden', !hasMultiSlides);
    btnNext.onclick = () => {
      const step = getDirectionalNavigationSteps().next;
      sliderIndex = (sliderIndex + step + sliderTotal) % sliderTotal;
      updateSliderPos();
      resetSliderTimer();
    };
  }

  sliderIndex = 0;
  updateSliderPos();
  resetSliderTimer();
}

function updateSliderPos() {
  const counter = document.getElementById('slider-counter');
  if (!sliderTotal) {
    if (counter) counter.textContent = '';
    return;
  }

  document.querySelectorAll('.home-slide').forEach((s, i) => {
    s.classList.remove('active', 'prev');
    if (i === sliderIndex) s.classList.add('active');
    else if (i === (sliderIndex-1+sliderTotal)%sliderTotal) s.classList.add('prev');
  });
  document.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === sliderIndex));
  if (counter) counter.textContent = `${formatLocalizedNumber(sliderIndex + 1)} / ${formatLocalizedNumber(sliderTotal)}`;
}

function resetSliderTimer() {
  clearInterval(sliderTimer);
  if (sliderTotal <= 1) return;
  sliderTimer = setInterval(() => {
    sliderIndex = (sliderIndex + 1) % sliderTotal;
    updateSliderPos();
  }, 5000);
}

window.goSlide = function(i) { sliderIndex=i; updateSliderPos(); resetSliderTimer(); };

function setDetailGalleryIndex(nextIndex, options = {}) {
  if (!detailGalleryImages.length) return;

  const root = document.querySelector('#fd-images .fd-media-gallery');
  if (!root) return;

  const scrollThumb = Boolean(options.scrollThumb);
  const animate = options.animate !== false;
  const numericIndex = Number(nextIndex);
  const safeIndex = Number.isFinite(numericIndex) ? numericIndex : 0;
  detailGalleryActiveIndex = (safeIndex + detailGalleryImages.length) % detailGalleryImages.length;

  const stageImg = root.querySelector('.fd-media-stage-img');
  const counter = root.querySelector('.fd-media-stage-counter');
  const openButton = root.querySelector('.fd-media-stage-open');

  if (stageImg) {
    const nextSrc = detailGalleryImages[detailGalleryActiveIndex] || FALLBACK_IMAGE_URL;
    const nextAlt = `${detailGalleryTitle || t('fontPoster')} ${detailGalleryActiveIndex + 1}`;
    const previousSrc = String(stageImg.dataset.currentSrc || stageImg.getAttribute('src') || '');

    stageImg.onerror = () => {
      stageImg.onerror = null;
      stageImg.classList.add('broken-image');
      stageImg.src = FALLBACK_IMAGE_URL;
    };

    stageImg.classList.remove('broken-image');

    if (animate && previousSrc && previousSrc !== nextSrc) {
      stageImg.classList.remove('fd-media-stage-fade');
      void stageImg.offsetWidth;
      stageImg.classList.add('fd-media-stage-fade');
    }

    stageImg.src = nextSrc;
    stageImg.alt = nextAlt;
    stageImg.dataset.currentSrc = nextSrc;
  }

  if (openButton) {
    openButton.setAttribute('aria-label', t('viewImage', { index: formatLocalizedNumber(detailGalleryActiveIndex + 1) }));
  }

  if (counter) {
    counter.textContent = `${formatLocalizedNumber(detailGalleryActiveIndex + 1)} / ${formatLocalizedNumber(detailGalleryImages.length)}`;
  }

  root.querySelectorAll('.fd-media-dot').forEach((dot, index) => {
    const isActive = index === detailGalleryActiveIndex;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  if (scrollThumb) {
    const activeDot = root.querySelector(`.fd-media-dot[data-index="${detailGalleryActiveIndex}"]`);
    if (activeDot) activeDot.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
}

function moveDetailGallery(step) {
  if (!detailGalleryImages.length) return;
  setDetailGalleryIndex(detailGalleryActiveIndex + step, { scrollThumb: true });
}

function renderDetailMediaGallery(container, images, fontTitle) {
  if (!container) return;

  detailGalleryImages = Array.isArray(images) ? images.filter(Boolean) : [];
  detailGalleryTitle = fontTitle || '';
  detailGalleryActiveIndex = 0;
  const navIcons = getDirectionalArrowIcons();

  if (!detailGalleryImages.length) {
    container.innerHTML = `<p class="empty-msg">${escapeHtml(t('galleryNoImages'))}</p>`;
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = `
    <div class="fd-media-gallery">
      <div class="fd-media-stage-wrap">
        <button type="button" class="fd-media-nav prev" aria-label="${escapeHtml(t('previous'))}">
          <i class="${navIcons.prev}"></i>
        </button>

        <button type="button" class="fd-media-stage-open" aria-label="${escapeHtml(t('viewImage', { index: formatLocalizedNumber(1) }))}">
          <img class="fd-media-stage-img" src="${escapeHtml(detailGalleryImages[0] || FALLBACK_IMAGE_URL)}" alt="${escapeHtml((detailGalleryTitle || t('fontPoster')) + ' 1')}" onerror="${IMAGE_ONERROR_ATTR}" />
          <span class="fd-media-stage-overlay" aria-hidden="true"></span>
        </button>

        <button type="button" class="fd-media-nav next" aria-label="${escapeHtml(t('next'))}">
          <i class="${navIcons.next}"></i>
        </button>

        <div class="fd-media-stage-meta">
          <span class="fd-media-stage-title">${escapeHtml(detailGalleryTitle || t('fontPoster'))}</span>
          <span class="fd-media-stage-counter"></span>
        </div>
      </div>

      <div class="fd-media-indicators" role="tablist" aria-label="${escapeHtml(detailGalleryTitle || t('fontPoster'))}">
        ${detailGalleryImages.map((src, index) => `
          <button type="button" class="fd-media-dot" data-index="${index}" aria-label="${escapeHtml(t('viewImage', { index: formatLocalizedNumber(index + 1) }))}" title="${escapeHtml(t('viewImage', { index: formatLocalizedNumber(index + 1) }))}">
            <span>${formatLocalizedNumber(index + 1)}</span>
          </button>`).join('')}
      </div>
    </div>`;

  container.classList.remove('hidden');

  const steps = getDirectionalNavigationSteps();
  const stageOpen = container.querySelector('.fd-media-stage-open');
  const prevButton = container.querySelector('.fd-media-nav.prev');
  const nextButton = container.querySelector('.fd-media-nav.next');

  if (stageOpen) {
    stageOpen.addEventListener('click', () => window.openImageViewer(detailGalleryActiveIndex));
    stageOpen.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveDetailGallery(steps.prev);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveDetailGallery(steps.next);
      }
    });
  }

  if (prevButton) prevButton.addEventListener('click', () => moveDetailGallery(steps.prev));
  if (nextButton) nextButton.addEventListener('click', () => moveDetailGallery(steps.next));

  container.querySelectorAll('.fd-media-dot').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      if (!Number.isFinite(index)) return;
      setDetailGalleryIndex(index, { scrollThumb: true });
    });
  });

  hydrateLazyImages(container);
  setDetailGalleryIndex(0, { animate: false });
}

/* ── FONT DETAIL PAGE ── */
function renderFontDetailPage(id, options = {}) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return false;

  const displayFonts = getDisplayFonts();
  let font = displayFonts.find(f => Number(f.id) === numericId);

  if (!font) {
    const rawMatch = (contentData.fonts || []).find(f => Number(f.id) === numericId);
    if (rawMatch) {
      font = displayFonts.find(item => {
        const ids = displayFontSourceIdsById[String(item.id)] || [];
        return ids.includes(String(rawMatch.id));
      });
    }
  }

  if (!font) return false;

  const activeFontId = Number(font.id);
  if (!Number.isFinite(activeFontId)) return false;

  currentFontId = activeFontId;
  document.body.dataset.fontId = String(activeFontId);
  const family = font.fontFile ? fontFamilyName(font.id) : 'Qahwa';
  const familyCSS = `'${family}', serif`;

  const detailPage = document.querySelector('.font-detail-page');
  if (detailPage) detailPage.style.fontFamily = familyCSS;

  const titleEl = document.getElementById('fd-title-ar');
  titleEl.textContent = font.title || t('fontUntitled');
  titleEl.style.fontFamily = familyCSS;

  const titleEnEl = document.getElementById('fd-title-en');
  titleEnEl.textContent = font.titleEn || '';
  titleEnEl.style.fontFamily = familyCSS;

  const descAr = document.getElementById('fd-desc-ar');
  const descEn = document.getElementById('fd-desc-en');
  const descsWrap = document.getElementById('fd-descriptions');
  const localizedDescription = currentLanguage === 'en'
    ? (font.descriptionEn || font.descriptionAr || font.descriptionKu || font.description || '')
    : (currentLanguage === 'ku'
      ? (font.descriptionKu || font.descriptionAr || font.descriptionEn || font.description || '')
      : (font.descriptionAr || font.descriptionKu || font.descriptionEn || font.description || ''));

  if (descAr) {
    descAr.textContent = localizedDescription;
    descAr.style.fontFamily = familyCSS;
    descAr.style.direction = currentLanguage === 'en' ? 'ltr' : 'rtl';
    descAr.style.textAlign = currentLanguage === 'en' ? 'left' : 'right';
  }

  if (descEn) {
    descEn.textContent = '';
    descEn.style.display = 'none';
  }

  if (descsWrap) {
    descsWrap.style.display = localizedDescription ? '' : 'none';
  }

  const images = getFontImages(font);
  detailGalleryImages = images;
  detailGalleryTitle = font.title || '';
  detailGalleryActiveIndex = 0;

  const legacySliderWrap = document.getElementById('home-slider-wrap');
  if (legacySliderWrap) legacySliderWrap.classList.add('hidden');

  const gallery = document.getElementById('fd-images');
  if (gallery) {
    gallery.className = 'fd-images';
    if (activeFontId) gallery.classList.add('font-gallery-' + activeFontId);
    renderDetailMediaGallery(gallery, images, font.title || '');
  }

  const weights = getFontWeightList(font);
  const weightOptionsForPreview = getFontWeightDownloadOptions(font);
  refreshWeightPreviewFontFaces(font, weightOptionsForPreview);
  const freeWeights = normalizeTextList(font.freeWeights).map(resolveWeightName);
  const paidWeights = normalizeTextList(font.paidWeights).map(resolveWeightName);
  const weightSection = document.getElementById('fd-weights-section');
  const weightText = document.getElementById('fd-weights-text');
  if (weights.length) {
    weightText.innerHTML = `<span class="fd-weights-label">${t('weightsLabel')}</span>
      <div class="fd-weights-tags">${weights.map(w => `<span class="fd-weight-tag">${escapeHtml(w)}</span>`).join('')}</div>`;
    weightSection.classList.remove('hidden');
  } else {
    weightSection.classList.add('hidden');
  }

  let weightPreviewSection = document.getElementById('fd-weight-preview-section');
  if (!weightPreviewSection) {
    weightPreviewSection = document.createElement('section');
    weightPreviewSection.id = 'fd-weight-preview-section';
    weightPreviewSection.className = 'fd-weight-preview-section hidden';
    weightPreviewSection.innerHTML = `
      <h4 id="weight-preview-title" class="fd-weight-preview-title">${escapeHtml(t('weightPreviewTitle'))}</h4>
      <div class="fd-weight-preview-tools">
        <label id="fd-preview-phrase-label" for="fd-preview-phrase-input">${escapeHtml(t('weightPreviewHint'))}</label>
        <input id="fd-preview-phrase-input" type="text" maxlength="120" placeholder="${escapeHtml(t('weightPreviewHint'))}" />
      </div>
      <div id="fd-weight-preview-list" class="fd-weight-preview-list"></div>`;
    const pricingSectionEl = document.getElementById('fd-pricing-section');
    if (pricingSectionEl && pricingSectionEl.parentNode) {
      pricingSectionEl.parentNode.insertBefore(weightPreviewSection, pricingSectionEl);
    } else if (weightSection && weightSection.parentNode) {
      weightSection.parentNode.appendChild(weightPreviewSection);
    }
  }

  const weightPreviewList = document.getElementById('fd-weight-preview-list');
  const weightPreviewInput = document.getElementById('fd-preview-phrase-input');
  if (weightPreviewInput) {
    if (document.activeElement !== weightPreviewInput) {
      weightPreviewInput.value = getActiveWeightPreviewPhrase();
    }

    if (weightPreviewInput.dataset.bound !== '1') {
      weightPreviewInput.addEventListener('input', () => {
        const phrase = setUserPreviewPhrase(weightPreviewInput.value) || getDefaultPreviewPhraseByLanguage();

        document.querySelectorAll('#fd-weight-preview-list .fd-weight-preview-sample').forEach(el => {
          el.textContent = phrase;
        });

        document.querySelectorAll('.download-weight-sample').forEach(el => {
          el.textContent = phrase;
        });
      });
      weightPreviewInput.dataset.bound = '1';
    }
  }

  if (weightPreviewSection && weightPreviewList && weights.length) {
    const previewPhrase = escapeHtml(getActiveWeightPreviewPhrase());
    const allPreviewWeights = [...weights];
    const extraFiles = font.weightFiles || {};
    Object.keys(extraFiles).forEach(w => {
      if (!allPreviewWeights.includes(w)) allPreviewWeights.push(w);
    });
    weightPreviewList.innerHTML = allPreviewWeights.map(weight => {
      const previewStyle = resolveWeightPreviewStyleConfig(weight, familyCSS);
      return `
      <div class="fd-weight-preview-row">
        <span class="fd-weight-preview-label">${escapeHtml(weight)}</span>
        <span class="fd-weight-preview-sample" style="font-family:${previewStyle.familyCSS};font-weight:${previewStyle.weight};font-variation-settings:'wght' ${previewStyle.variation}">${previewPhrase}</span>
      </div>`;
    }).join('');
    weightPreviewSection.classList.remove('hidden');
  } else if (weightPreviewSection) {
    weightPreviewSection.classList.add('hidden');
  }

  const pricingSection = document.getElementById('fd-pricing-section');
  const hasPricingInfo = font.isPaid !== undefined || font.license || freeWeights.length || paidWeights.length;
  if (hasPricingInfo) {
    const priceBadge = document.getElementById('fd-price-badge');
    priceBadge.innerHTML = font.isPaid
      ? `<span class="fd-price-large paid">${t('paid')}</span>`
      : `<span class="fd-price-large free">${t('free')}</span>`;

    const licenseRow = document.getElementById('fd-license-row');
    if (font.license) {
      licenseRow.innerHTML = `<strong>${t('licenseLabel')}:</strong> ${escapeHtml(font.license)}`;
      licenseRow.classList.remove('hidden');
    } else { licenseRow.classList.add('hidden'); }

    const weightCats = document.getElementById('fd-weight-cats');
    let catsHTML = '';
    if (freeWeights.length)
      catsHTML += `<div class="fd-wcat"><div class="fd-wcat-label free">${t('freeWeightsLabel')}</div>
        <div class="fd-wcat-items">${freeWeights.map(w=>`<span class="fd-wcat-tag">${escapeHtml(w)}</span>`).join('')}</div></div>`;
    if (paidWeights.length)
      catsHTML += `<div class="fd-wcat"><div class="fd-wcat-label paid">${t('paidWeightsLabel')}</div>
        <div class="fd-wcat-items">${paidWeights.map(w=>`<span class="fd-wcat-tag">${escapeHtml(w)}</span>`).join('')}</div></div>`;
    weightCats.innerHTML = catsHTML;
    pricingSection.classList.remove('hidden');
  } else { pricingSection.classList.add('hidden'); }

  const downloadWrap = document.getElementById('fd-download-wrap');
  const downloadBtn = document.getElementById('fd-download-btn');
  const zipBtn = document.getElementById('fd-download-zip-btn');
  currentFontWeightOptions = weightOptionsForPreview;
  currentFontDownloadUrl = currentFontWeightOptions[0]?.url || '';
  currentFontDownloadTitle = font.title || t('fontUntitled');
  currentFontZipUrl = resolveFontZipUrl(font);

  const hasWeightDownloads = currentFontWeightOptions.length > 0;
  const hasZipDownload = Boolean(currentFontZipUrl) && !isZipDisabledForFont(font);
  if (!hasZipDownload) currentFontZipUrl = '';

  if (hasWeightDownloads || hasZipDownload) {
    if (downloadBtn) {
      downloadBtn.href = '#';
      downloadBtn.classList.toggle('hidden', !hasWeightDownloads);
    }

    if (zipBtn) {
      zipBtn.classList.toggle('hidden', !hasZipDownload);
    }

    downloadWrap.classList.remove('hidden');
  } else {
    currentFontDownloadUrl = '';
    currentFontZipUrl = '';
    currentFontDownloadTitle = '';
    currentFontWeightOptions = [];
    if (downloadBtn) downloadBtn.classList.add('hidden');
    if (zipBtn) zipBtn.classList.add('hidden');
    downloadWrap.classList.add('hidden');
  }

  const backBtn = document.getElementById('font-detail-back');
  if (backBtn) backBtn.style.removeProperty('font-family');

  try { updateSeoMetadata(font); } catch (error) { console.error('updateSeoMetadata failed:', error); }

  return true;
}

window.openFontPage = function(id) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return;

  if (pageType === 'font') {
    const rendered = renderFontDetailPage(numericId);
    if (!rendered) return;
    const url = new URL(window.location.href);
    url.searchParams.set('id', String(currentFontId));
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  navigateTo('font', { id: numericId });
};

window.openImageViewer = function(index) {
  if (!detailGalleryImages.length) return;
  const viewer = document.getElementById('image-viewer');
  if (!viewer) return;
  viewerIndex = (index + detailGalleryImages.length) % detailGalleryImages.length;
  setDetailGalleryIndex(viewerIndex);
  updateImageViewer();
  viewer.classList.remove('hidden');
  viewer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
};

function updateImageViewer() {
  const viewerImage = document.getElementById('image-viewer-img');
  const viewerCaption = document.getElementById('image-viewer-caption');
  if (!viewerImage || !viewerCaption || !detailGalleryImages.length) return;
  viewerImage.onerror = () => {
    viewerImage.onerror = null;
    viewerImage.classList.add('broken-image');
    viewerImage.src = FALLBACK_IMAGE_URL;
  };
  viewerImage.classList.remove('broken-image');
  viewerImage.src = detailGalleryImages[viewerIndex] || FALLBACK_IMAGE_URL;
  viewerImage.alt = `${detailGalleryTitle || t('fontUntitled')} - ${viewerIndex + 1}`;
  viewerCaption.textContent = t('viewerCaption', {
    title: detailGalleryTitle || t('fontUntitled'),
    index: formatLocalizedNumber(viewerIndex + 1),
    total: formatLocalizedNumber(detailGalleryImages.length)
  });
}

function closeImageViewer() {
  const viewer = document.getElementById('image-viewer');
  if (!viewer) return;
  viewer.classList.add('hidden');
  viewer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

function moveImageViewer(step) {
  if (!detailGalleryImages.length) return;
  viewerIndex = (viewerIndex + step + detailGalleryImages.length) % detailGalleryImages.length;
  setDetailGalleryIndex(viewerIndex, { scrollThumb: true });
  updateImageViewer();
}

function initImageViewer() {
  const viewer = document.getElementById('image-viewer');
  const closeBtn = document.getElementById('image-viewer-close');
  const prevBtn = document.getElementById('image-viewer-prev');
  const nextBtn = document.getElementById('image-viewer-next');

  if (!viewer || !closeBtn || !prevBtn || !nextBtn) return;

  closeBtn.addEventListener('click', closeImageViewer);
  prevBtn.addEventListener('click', () => moveImageViewer(getDirectionalNavigationSteps().prev));
  nextBtn.addEventListener('click', () => moveImageViewer(getDirectionalNavigationSteps().next));

  viewer.addEventListener('click', event => {
    if (event.target === viewer) closeImageViewer();
  });

  document.addEventListener('keydown', event => {
    if (viewer.classList.contains('hidden')) return;
    if (event.key === 'Escape') closeImageViewer();
    if (event.key === 'ArrowLeft') moveImageViewer(getDirectionalNavigationSteps().prev);
    if (event.key === 'ArrowRight') moveImageViewer(getDirectionalNavigationSteps().next);
  });

  updateDirectionalNavigationUI();
}

/* ── DOWNLOAD TRACKING ── */
function ensureWeightDownloadModal() {
  if (document.getElementById('download-weights-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'download-weights-modal';
  modal.className = 'overlay hidden';
  modal.innerHTML = `
    <div class="modal-card download-weights-card">
      <button class="modal-x" id="download-weights-close"><i class="fa-solid fa-xmark"></i></button>
      <h3 id="download-weights-title">${escapeHtml(t('downloadWeightsTitle'))}</h3>
      <p id="download-weights-subtitle" class="download-weights-subtitle"></p>
      <div id="download-weights-list" class="download-weights-list"></div>
      <div class="download-weights-actions">
        <button id="download-all-weights-zip-btn" class="btn-white full" type="button">
          <i class="fa-solid fa-file-zipper"></i>
          <span id="download-all-weights-zip-text">${escapeHtml(t('downloadAllWeightsZip'))}</span>
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const closeBtn = document.getElementById('download-weights-close');
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.add('hidden');
  });

  const list = document.getElementById('download-weights-list');
  if (list) {
    list.addEventListener('click', async event => {
      const button = event.target.closest('button[data-weight-index]');
      if (!button) return;
      const index = Number(button.dataset.weightIndex);
      const option = currentFontWeightOptions[index];
      if (!option) return;
      await downloadSingleWeight(option);
    });
  }

  const allBtn = document.getElementById('download-all-weights-zip-btn');
  if (allBtn) {
    allBtn.addEventListener('click', async () => {
      await handleFontDownload({ asZip: true });
    });
  }
}

function renderWeightDownloadList() {
  ensureWeightDownloadModal();
  const subtitle = document.getElementById('download-weights-subtitle');
  const list = document.getElementById('download-weights-list');
  const allZipBtn = document.getElementById('download-all-weights-zip-btn');
  if (!subtitle || !list || !allZipBtn) return;

  subtitle.textContent = currentFontDownloadTitle || t('fontUntitled');

  if (!currentFontWeightOptions.length) {
    list.innerHTML = `<p class="download-weights-empty">${escapeHtml(t('noDownloadFiles'))}</p>`;
    allZipBtn.disabled = true;
    allZipBtn.classList.add('hidden');
    return;
  }

  const showZipAction = Boolean(currentFontZipUrl);
  allZipBtn.disabled = !showZipAction;
  allZipBtn.classList.toggle('hidden', !showZipAction);
  const activeFont = getDisplayFonts().find(item => Number(item.id) === Number(currentFontId));
  const family = activeFont?.fontFile ? fontFamilyName(activeFont.id) : 'Qahwa';
  const familyCSS = `'${family}', serif`;
  refreshWeightPreviewFontFaces(activeFont, currentFontWeightOptions);
  const previewPhrase = escapeHtml(getActiveWeightPreviewPhrase());
  list.innerHTML = currentFontWeightOptions.map((option, index) => {
    const previewStyle = resolveWeightPreviewStyleConfig(option.weight, familyCSS, index);
    return `
    <button type="button" class="download-weight-btn" data-weight-index="${index}">
      <span class="download-weight-name">${escapeHtml(String(option.weight || t('weightsLabel')))}</span>
      <span class="download-weight-sample" style="font-family:${previewStyle.familyCSS};font-weight:${previewStyle.weight};font-variation-settings:'wght' ${previewStyle.variation}">${previewPhrase}</span>
      <span class="download-weight-action">${escapeHtml(t('downloadWeightAction', { weight: String(option.weight || '') }))}</span>
    </button>`;
  }).join('');
}

function openWeightDownloadModal() {
  ensureWeightDownloadModal();
  renderWeightDownloadList();
  const modal = document.getElementById('download-weights-modal');
  if (modal) modal.classList.remove('hidden');
}

async function downloadSingleWeight(option) {
  const visitorName = await ensureVisitorNameForDownload();
  if (!visitorName) {
    toast(t('downloadBlockedNoName'), true);
    return;
  }

  const ok = await downloadFileDirect(option.url, option.fileName || option.weight || currentFontDownloadTitle);
  if (!ok) {
    toast(t('downloadDirectFailed'), true);
    return;
  }

  await registerFontDownload(visitorName);
}

async function tryDirectDownloadCandidates(candidates = []) {
    let successCount = 0;
    for (const candidate of candidates) {
      const url = resolveAssetUrl(candidate?.url || '');
      if (!url) continue;
      const fileName = candidate?.fileName || candidate?.weight || currentFontDownloadTitle || 'font';
      const ok = await downloadFileDirect(url, fileName);
      if (ok) successCount++;
      await new Promise(r => setTimeout(r, 600));
    }
    return successCount > 0;
  }

async function downloadCurrentFontZipFile() {
  if (!currentFontZipUrl) return false;

  const visitorName = await ensureVisitorNameForDownload();
  if (!visitorName) {
    toast(t('downloadBlockedNoName'), true);
    return false;
  }

  const baseName = sanitizeFileNameForDownload(currentFontDownloadTitle || t('fontUntitled'));
  const ok = await downloadFileDirect(currentFontZipUrl, `${baseName}.zip`);
  if (!ok) {
    toast(t('downloadDirectFailed'), true);
    return false;
  }

  await registerFontDownload(visitorName);
  return true;
}

async function downloadCurrentFontAllWeightsZip() {
  if (!currentFontWeightOptions.length) {
    toast(t('noDownloadFiles'), true);
    return;
  }

  const visitorName = await ensureVisitorNameForDownload();
  if (!visitorName) {
    toast(t('downloadBlockedNoName'), true);
    return;
  }

  toast(t('downloadZipPreparing'));
  const zipEntries = currentFontWeightOptions.map(option => ({
    url: option.url,
    fileName: option.fileName || option.weight || 'font'
  }));

  const ok = await buildZipFromEntries(zipEntries, `${currentFontDownloadTitle || t('fontUntitled')} weights`);
  if (!ok) {
    const fallbackOk = await tryDirectDownloadCandidates(currentFontWeightOptions);

    if (fallbackOk) {
      await registerFontDownload(visitorName);
      return;
    }

    toast(t('downloadDirectFailed'), true);
    return;
  }

  await registerFontDownload(visitorName);
}

async function downloadAllFontsZipBundle() {
  const fonts = getDisplayFonts();
  const zipEntries = [];

  fonts.forEach(font => {
    const zipUrl = resolveFontZipUrl(font);
    if (!zipUrl || isZipDisabledForFont(font)) return;
    zipEntries.push({
      url: zipUrl,
      fileName: `${sanitizeFileNameForDownload(font.title || font.titleEn || 'font')}.zip`
    });
  });

  const entries = zipEntries.length
    ? zipEntries
    : (() => {
      const legacyEntries = [];
      fonts.forEach(font => {
        const options = getFontWeightDownloadOptions(font);
        const folder = sanitizeFileNameForDownload(font.title || font.titleEn || 'font');
        options.forEach(option => {
          legacyEntries.push({
            url: option.url,
            fileName: option.fileName || option.weight || folder,
            folder
          });
        });
      });
      return legacyEntries;
    })();

  const hasDirectBundle = Boolean(resolveAssetUrl(ALL_FONTS_ZIP_DIRECT_URL));
  if (!entries.length && !hasDirectBundle) {
    toast(t('noDownloadFiles'), true);
    return;
  }

  const visitorName = await ensureVisitorNameForDownload();
  if (!visitorName) {
    toast(t('downloadBlockedNoName'), true);
    return;
  }

  const directAllFontsZip = resolveAssetUrl(ALL_FONTS_ZIP_DIRECT_URL);
  if (directAllFontsZip) {
    const directOk = await downloadFileDirect(directAllFontsZip, 'All-OmarHassanType-Fonts.zip');
    if (directOk) return;
  }

  if (!entries.length) {
    toast(t('downloadDirectFailed'), true);
    return;
  }

  toast(t('downloadAllFontsZipPreparing'));
  const ok = await buildZipFromEntries(entries, 'all-fonts');
  if (!ok) {
    const fallbackCandidates = zipEntries.length
      ? zipEntries
      : entries;
    const fallbackOk = await tryDirectDownloadCandidates(fallbackCandidates);

    if (fallbackOk) {
      return;
    }

    toast(t('downloadDirectFailed'), true);
  }
}

async function handleFontDownload({ asZip = false } = {}) {
  if (!currentFontWeightOptions.length && !currentFontZipUrl) {
    toast(t('noDownloadFiles'), true);
    return;
  }

  if (asZip) {
    if (currentFontZipUrl) {
      const directZipOk = await downloadCurrentFontZipFile();
      if (directZipOk) return;
      if (!currentFontWeightOptions.length) return;
    }

    await downloadCurrentFontAllWeightsZip();
    return;
  }

  openWeightDownloadModal();
}

const directDownloadBtn = document.getElementById('fd-download-btn');
if (directDownloadBtn) {
  directDownloadBtn.addEventListener('click', async event => {
    event.preventDefault();
    await handleFontDownload({ asZip: false });
  });
}

const zipDownloadBtn = document.getElementById('fd-download-zip-btn');
if (zipDownloadBtn) {
  zipDownloadBtn.addEventListener('click', async event => {
    event.preventDefault();
    await handleFontDownload({ asZip: true });
  });
}

const fontDetailBackBtn = document.getElementById('font-detail-back');
if (fontDetailBackBtn) {
  fontDetailBackBtn.addEventListener('click', () => navigateTo('fonts'));
}

function openLoginModal() {
}
function closeLoginModal() {
}
function openAdmin() {
}
function closeAdmin() {
}
function activateAdminTab(tabId) {
}
function initIconPicker() {
}
function renderSocialEditor() {
}
function renderWorkSocialEditor() {
}
function loadStats() {
}
function openEditModal(id) {
}
function delItem(id) {
}
function formatAdminDate(value) {
}
function getAdminFontsFilteredAndSorted() {
}
function syncAdminFontControlsUI() {
}
function ensureAdminFontControls() {
}
function renderAdminLists() {
}
function syncWeightFileBuilder(formType, seedMap = null) {
}
function initWeightFileBuilders() {
}

/* ── TOAST ── */
function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:${isErr?'#c0392b':'#1a1a1a'};color:#fff;padding:11px 22px;
    border:1px solid ${isErr?'#e74c3c':'#333'};border-radius:8px;
    font-family:'Qahwa','Qahwa Salt','Segoe UI',Tahoma,sans-serif;font-weight:500;font-size:0.92rem;
    z-index:9999;box-shadow:0 4px 24px rgba(0,0,0,0.6);`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

/* ── INIT SEARCH + ICON PICKER ── */
initSearch();
initImageViewer();
initSettingsPanel();
initUserPreferences();


