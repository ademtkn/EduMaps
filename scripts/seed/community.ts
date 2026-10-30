import { t, type I18n } from "./i18n";

export type SeedPost = {
  category: string;
  author: string;
  title: string;
  body: string;
  status: "published" | "pending" | "rejected";
  pinned?: boolean;
  note?: string;
  comments?: { author: string; body: string }[];
  daysAgo: number;
};

export const POSTS: SeedPost[] = [
  {
    category: "preschool", author: "elena@example.com", status: "published", daysAgo: 21, pinned: true,
    title: "С какого возраста лучше отдавать ребёнка в детский сад?",
    body: "Нашей дочери 2 года 8 месяцев. Многие советуют отдавать с трёх лет, но мы работаем и думаем, не рано ли. Как вы принимали решение и как проходила адаптация?",
    comments: [
      { author: "aigerim@example.com", body: "Мы отдали в 3 года. Первые две недели были трудными, потом ребёнок втянулся. Помогла постепенная адаптация: сначала на 2 часа." },
      { author: "bakyt@example.com", body: "Главное — не оставлять ребёнка надолго в первые дни и выбрать воспитателя, которому доверяете." },
    ],
  },
  {
    category: "preschool", author: "aigerim@example.com", status: "published", daysAgo: 9,
    title: "Балага мектепке чейин эмнелерди үйрөтүү керек?",
    body: "Уулум келерки жылы мектепке барат. Окуп-жазууну алдын ала үйрөтүү керекпи же оюн аркылуу даярдасак жетиштүүбү? Тажрыйбаңыз менен бөлүшүңүздөр.",
    comments: [{ author: "dina@example.com", body: "Окуганды мажбурлабай, китеп окуп берип, сүрөт тартып, санап үйрөтсөңүз жетиштүү. Негизгиси — кызыгуу." }],
  },
  {
    category: "elementary", author: "nurlan@example.com", status: "published", daysAgo: 14,
    title: "Как помочь первокласснику не уставать?",
    body: "Сын учится в первом классе, к вечеру очень устаёт и капризничает. Уроки заканчиваются в 13:00, потом продлёнка. Что помогает вашим детям восстанавливаться?",
    comments: [
      { author: "elena@example.com", body: "У нас помогает прогулка на свежем воздухе сразу после школы и ранний сон. Планшет в будни убрали." },
      { author: "sara@example.com", body: "Light snack, a short walk and no homework for the first hour at home worked wonders for us." },
    ],
  },
  {
    category: "elementary", author: "sara@example.com", status: "published", daysAgo: 6,
    title: "Reading habits for a 7 year old — what works?",
    body: "My daughter reads well in English but has little interest in Kyrgyz and Russian books. How do you encourage reading in several languages without making it a chore?",
    comments: [{ author: "tilek@example.com", body: "We read together for 15 minutes before bed, alternating languages each night. Comics and short folk tales were a great start." }],
  },
  {
    category: "middle-school", author: "bakyt@example.com", status: "published", daysAgo: 11,
    title: "Өспүрүм бала сабакка кызыгуусун жоготту",
    body: "Кызым 7-класста. Мурун жакшы окучу, азыр сабакка кызыгуусу жок, телефондон бөлүнбөйт. Мындай кырдаалда эмне кылсак болот?",
    comments: [{ author: "dina@example.com", body: "Бул куракта көбүнчө болот. Айыптабай сүйлөшүп, кызыккан нерсесин (спорт, музыка) колдоңуз. Телефонго чек коюңуз, бирок биргеликте макулдашып." }],
  },
  {
    category: "middle-school", author: "mirlan@example.com", status: "published", daysAgo: 3,
    title: "Как выбрать кружки для шестиклассника?",
    body: "Сыну 12 лет, интересуется и спортом, и программированием. Времени на всё не хватит. Как вы помогаете ребёнку выбирать и не перегружать расписание?",
  },
  {
    category: "high-school", author: "elena@example.com", status: "published", daysAgo: 17,
    title: "Подготовка к ОРТ: с какого класса начинать?",
    body: "Дочь в 9 классе, хотим поступать на медицинский. Стоит ли начинать готовиться к ОРТ уже сейчас или лучше с 10 класса? Нужны ли репетиторы или достаточно школьной программы?",
    comments: [{ author: "nurlan@example.com", body: "Мы начали с 10 класса, 2–3 раза в неделю. Главное — регулярность и пробные тесты. Репетитор нужен по профильным предметам." }],
  },
  {
    category: "high-school", author: "tilek@example.com", status: "published", daysAgo: 5,
    title: "Is the IB Diploma worth it for local universities?",
    body: "We are considering an IB school for our son in grade 10. Our plan is to apply to universities abroad, but we want a fallback in Kyrgyzstan. How do IB graduates fare with local admissions?",
    comments: [{ author: "sara@example.com", body: "Ask the school directly about recognition by the universities you are considering and request alumni contacts. Admission rules differ by faculty." }],
  },
  {
    category: "special-education", author: "dina@example.com", status: "published", daysAgo: 19,
    title: "Инклюзивное образование в Бишкеке: опыт родителей",
    body: "Ищем школу, где ребёнок с особенностями развития сможет учиться вместе со сверстниками. Поделитесь, пожалуйста, опытом: на что обращать внимание и какие вопросы задавать администрации?",
    comments: [{ author: "aigerim@example.com", body: "Спросите про тьютора или ассистента в классе, количество детей и подготовку учителей. И познакомьтесь с другими родителями школы." }],
  },
  {
    category: "special-education", author: "bakyt@example.com", status: "published", daysAgo: 7,
    title: "Өзгөчө муктаждыктагы балдар үчүн мектеп издеп жатам",
    body: "Уулум үчүн окуу кыйын болгондуктан психолог жана логопед бар мектепти издеп жатам. Кайсы мектептер ушундай кызмат көрсөтөт, сунуш берсеңиздер?",
  },
  {
    category: "abroad-education", author: "mirlan@example.com", status: "published", daysAgo: 13,
    title: "Scholarship options for studying in Turkey",
    body: "Our daughter will finish grade 11 next year and is interested in Turkish universities. What scholarship programmes exist for students from Kyrgyzstan and when should we start preparing documents?",
    comments: [{ author: "tilek@example.com", body: "Start at least a year ahead. Check the official government scholarship portals and each university's own aid pages, and mind the deadlines." }],
  },
  {
    category: "abroad-education", author: "sara@example.com", status: "published", daysAgo: 2,
    title: "Документы для обучения за рубежом: что нужно апостилировать?",
    body: "Подскажите, пожалуйста, какие документы об образовании нужно апостилировать для поступления за границу и сколько времени это обычно занимает?",
  },
  { category: "high-school", author: "dina@example.com", status: "pending", daysAgo: 0, title: "Нужен совет: репетитор или онлайн-курсы для подготовки к ОРТ?", body: "Сомневаемся, что лучше для подготовки к ОРТ: индивидуальный репетитор или онлайн-курсы. Что выбрали вы и почему?" },
  { category: "elementary", author: "mirlan@example.com", status: "pending", daysAgo: 0, title: "Башталгыч класстарда үй тапшырмасы канча убакыт алышы керек?", body: "3-класстагы кызым үй тапшырмасына эки саатка чейин убакыт короот. Бул нормалдуубу же мугалим менен сүйлөшүү керекпи?" },
  { category: "preschool", author: "nurlan@example.com", status: "pending", daysAgo: 1, title: "How do you handle separation anxiety at kindergarten drop-off?", body: "Our three-year-old cries every morning at drop-off. It has been two weeks. Any practical tips from parents who have been through this?" },
  { category: "middle-school", author: "tilek@example.com", status: "rejected", daysAgo: 4, note: "Рекламный пост: ссылки и контакты не допускаются. / Promotional content is not allowed.", title: "Лучшие репетиторы — звоните прямо сейчас", body: "Репетиторы по всем предметам, скидки только сегодня! Пишите в личные сообщения или по номеру в профиле, гарантируем результат за месяц." },
];

export const ADS: {
  advertiser: string; type: "language_school" | "summer_camp" | "robotics_center" | "edu_company" | "edu_event" | "other";
  placement: "banner" | "sidebar" | "featured_article" | "home_grid"; headline: I18n; body: I18n; cta: I18n; url: string; label: string;
}[] = [
  {
    advertiser: "Sample Language Studio", type: "language_school", placement: "banner", url: "https://example.com/language-studio", label: "Languages",
    headline: t("Англис жана кытай тили курстары", "Курсы английского и китайского языков", "English and Chinese language courses"),
    body: t("Балдар жана өспүрүмдөр үчүн кичи топтор, сынак версиясы бекер.", "Мини-группы для детей и подростков, пробное занятие бесплатно.", "Small groups for children and teens, with a free trial lesson."),
    cta: t("Жазылуу", "Записаться", "Sign up"),
  },
  {
    advertiser: "Sample Summer Camp", type: "summer_camp", placement: "banner", url: "https://example.com/summer-camp", label: "Camp",
    headline: t("Ысык-Көлдөгү жайкы лагерь", "Летний лагерь на Иссык-Куле", "Summer camp on Lake Issyk-Kul"),
    body: t("Спорт, англис тили жана жаратылышта тажрыйба: 7–14 жаштагылар үчүн.", "Спорт, английский и приключения на природе для детей 7–14 лет.", "Sports, English and outdoor adventure for ages 7–14."),
    cta: t("Көбүрөөк билүү", "Узнать больше", "Learn more"),
  },
  {
    advertiser: "Sample Robotics Center", type: "robotics_center", placement: "sidebar", url: "https://example.com/robotics", label: "Robotics",
    headline: t("Робототехника боюнча кружок", "Кружок робототехники", "Robotics club for kids"),
    body: t("Конструктор, Scratch жана Arduino 8 жаштан баштап.", "Конструкторы, Scratch и Arduino с 8 лет.", "Building kits, Scratch and Arduino from age 8."),
    cta: t("Сынак сабагы", "Пробный урок", "Book a trial"),
  },
  {
    advertiser: "Sample Study Abroad Fair", type: "edu_event", placement: "home_grid", url: "https://example.com/study-abroad", label: "Fair",
    headline: t("Чет өлкөдө окуу: ата-энелер үчүн жолугушуу", "Учёба за рубежом: встреча для родителей", "Studying abroad: a meeting for parents"),
    body: t("Мектеп бүтүргөндөн кийинки жолдор жана стипендиялар жөнүндө.", "О путях после школы и о стипендиях.", "About paths after school, and scholarships."),
    cta: t("Катталуу", "Зарегистрироваться", "Register"),
  },
  {
    advertiser: "Sample Math Tutor", type: "edu_company", placement: "home_grid", url: "https://example.com/math-tutor", label: "Tutor",
    headline: t("Математика боюнча жеке сабактар", "Индивидуальные занятия по математике", "Private maths lessons"),
    body: t("5–9-класстар үчүн жеке план жана ата-энелер үчүн отчет.", "План для 5–9 классов и отчёты для родителей.", "A plan for grades 5–9 with parent reports."),
    cta: t("Сынак сабагы", "Пробный урок", "Book a trial"),
  },
  {
    advertiser: "Sample Education Expo", type: "edu_event", placement: "featured_article", url: "https://example.com/education-expo", label: "Expo",
    headline: t("Билим берүү көргөзмөсү — ата-энелер үчүн", "Образовательная выставка для родителей", "Education expo for parents"),
    body: t("Мектептер, университеттер жана окутуу борборлору бир жерде. Кирүү акысыз.", "Школы, университеты и учебные центры в одном месте. Вход свободный.", "Schools, universities and learning centres in one place. Free entry."),
    cta: t("Катталуу", "Зарегистрироваться", "Register"),
  },
  {
    advertiser: "Sample Learning App", type: "edu_company", placement: "sidebar", url: "https://example.com/learning-app", label: "App",
    headline: t("Математика боюнча онлайн репетитор", "Онлайн-репетитор по математике", "Online maths tutor"),
    body: t("5–9-класстар үчүн жекече план жана ата-энеге отчет.", "Индивидуальный план для 5–9 классов и отчёты для родителей.", "A personal plan for grades 5–9 with parent reports."),
    cta: t("Баштоо", "Начать", "Get started"),
  },
];
