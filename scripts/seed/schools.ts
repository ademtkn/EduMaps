import { t, type I18n } from "./i18n";

export type SeedSchool = {
  slug: string;
  city: "bishkek" | "osh" | "jalal-abad" | "karakol" | "tokmok" | "naryn" | "talas";
  type: "public" | "private" | "international" | "specialized";
  name: I18n;
  initial: string;
  tagline: I18n;
  extra: I18n;
  systems: string[];
  grades: [number, number];
  founded: number;
  students: number;
  teachers: number;
  classSize: number;
  tuition: [number, number];
  tuitionNote?: I18n;
  languages: { code: string; primary?: boolean }[];
  transport: boolean;
  boarding: boolean;
  scholarships?: I18n;
  transportInfo?: I18n;
  programs: string[];
  clubs: string[];
  sports: string[];
  facilities: string[];
  /** [lat offset, lng offset] from the city centre, in degrees */
  offset: [number, number];
  street: I18n;
  district?: string;
  featured?: boolean;
  faqs: { q: I18n; a: I18n }[];
  gallery: ("classroom" | "sports" | "library" | "lab")[];
};

const faqAdmission = (grade: string): { q: I18n; a: I18n } => ({
  q: t("Кабыл алуу кандай өтөт?", "Как проходит приём?", "How does admission work?"),
  a: t(
    `Документтерди тапшырып, кыска маектешүүдөн өтөсүз. ${grade}-класска кирүүчүлөр үчүн диагностикалык тест бар.`,
    `Вы подаёте документы и проходите короткое собеседование. Для поступающих в ${grade} класс предусмотрен диагностический тест.`,
    `Families submit documents and attend a short interview. Applicants to grade ${grade} also take a diagnostic test.`
  ),
});
const faqVisit: { q: I18n; a: I18n } = {
  q: t("Мектепке алдын ала барып көрсө болобу?", "Можно ли посетить школу заранее?", "Can we visit the school beforehand?"),
  a: t("Ооба, ачык эшиктер күнү айына бир жолу өтөт. Жазылуу үчүн мектепке чалыңыз.", "Да, день открытых дверей проходит раз в месяц. Для записи позвоните в школу.", "Yes, open days take place monthly. Call the school to register."),
};
const faqMeals: { q: I18n; a: I18n } = {
  q: t("Тамактануу уюштурулганбы?", "Организовано ли питание?", "Are meals provided?"),
  a: t("Күнүнө эки жолу ысык тамак берилет, меню диетолог менен макулдашылган.", "Дважды в день подаётся горячее питание, меню согласовано с диетологом.", "Hot meals are served twice a day and the menu is approved by a dietitian."),
};

export const SCHOOLS: SeedSchool[] = [
  {
    slug: "ala-too-international-school", city: "bishkek", type: "international", initial: "A", featured: true,
    name: t("Ала-Тоо эл аралык мектеби", "Международная школа «Ала-Тоо»", "Ala-Too International School"),
    tagline: t("Дүйнөлүк билим, жергиликтүү тамыр", "Мировое образование на родной земле", "A global education with local roots"),
    extra: t("Класстарда 16 окуучудан ашпайт, ар бир балага жекече көңүл бурулат.", "В классах не более 16 учеников, поэтому каждому ребёнку уделяется индивидуальное внимание.", "Classes never exceed 16 students, so every child gets individual attention."),
    systems: ["ib", "cambridge"], grades: [1, 11], founded: 2008, students: 640, teachers: 78, classSize: 16, tuition: [38000, 52000],
    tuitionNote: t("Баа бир окуу жылы үчүн 10 айга бөлүнгөн. Бир үй-бүлөнүн 2-баласына 10% жеңилдик.", "Стоимость разделена на 10 месяцев учебного года. Скидка 10% на второго ребёнка из семьи.", "Fees are split across the 10-month school year. Siblings receive a 10% discount."),
    scholarships: t("Жыл сайын 12 жогорку жетишкендик стипендиясы берилет.", "Ежегодно выделяется 12 стипендий за академические достижения.", "Twelve merit scholarships are awarded each year."),
    languages: [{ code: "en", primary: true }, { code: "ru" }, { code: "kg" }],
    transport: true, boarding: false, transportInfo: t("Бишкектин 9 маршрутунда автобус.", "Автобусы по 9 маршрутам Бишкека.", "Buses on nine routes across Bishkek."),
    programs: ["ib-pyp-myp", "ib-dp", "cambridge-igcse", "english-intensive", "science-lab", "kyrgyz-lit"], clubs: ["debate-club", "robotics-club", "theatre-club", "journalism-club"], sports: ["swimming", "basketball", "football", "athletics"],
    facilities: ["library", "science_lab", "computer_lab", "robotics_lab", "gym", "swimming_pool", "canteen", "medical_room", "security", "cctv", "wifi", "psychologist", "parking", "theater", "accessible"],
    offset: [-0.035, 0.07], street: t("Ала-Арча айылы, Гагарин көчөсү", "Улица Гагарина, район Ала-Арча", "Gagarin Street, Ala-Archa district"), district: "Pervomaisky",
    faqs: [faqAdmission("1"), faqVisit, faqMeals], gallery: ["classroom", "lab", "sports", "library"],
  },
  {
    slug: "silk-road-lyceum", city: "bishkek", type: "private", initial: "S", featured: true,
    name: t("Жибек Жолу лицейи", "Лицей «Шёлковый путь»", "Silk Road Lyceum"),
    tagline: t("Үч тилде окутуучу заманбап лицей", "Современный лицей с обучением на трёх языках", "A modern lyceum teaching in three languages"),
    extra: t("Лицейдин бүтүрүүчүлөрү Кыргызстандын жана чет өлкөлөрдүн жогорку окуу жайларына тапшырышат.", "Выпускники лицея поступают в вузы Кыргызстана и зарубежья.", "Graduates continue to universities in Kyrgyzstan and abroad."),
    systems: ["national", "cambridge"], grades: [1, 11], founded: 2002, students: 820, teachers: 91, classSize: 20, tuition: [16000, 24000],
    scholarships: t("Олимпиада жеңүүчүлөрүнө 50% чейин жеңилдик.", "Победителям олимпиад — скидка до 50%.", "Olympiad winners receive up to 50% off."),
    languages: [{ code: "ru", primary: true }, { code: "kg" }, { code: "en" }],
    transport: true, boarding: false, transportInfo: t("Борбор жана түштүк райондор боюнча.", "По центру и южным районам.", "Serving the centre and southern districts."),
    programs: ["national-core", "cambridge-igcse", "english-intensive", "math-advanced", "ort-prep", "kyrgyz-lit"], clubs: ["chess-club", "debate-club", "choir-club", "olympiad-club"], sports: ["basketball", "volleyball", "taekwondo", "table-tennis"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "medical_room", "security", "cctv", "wifi", "psychologist", "playground"],
    offset: [0.012, -0.02], street: t("Чүй проспектиси, Бишкек", "проспект Чуй, Бишкек", "Chui Avenue, Bishkek"), district: "Oktyabrsky",
    faqs: [faqAdmission("1"), faqMeals], gallery: ["classroom", "library", "sports"],
  },
  {
    slug: "tengri-stem-gymnasium", city: "bishkek", type: "private", initial: "T",
    name: t("Теңир STEM гимназиясы", "Гимназия «Тенгри» STEM", "Tengri STEM Gymnasium"),
    tagline: t("Илим, технология, инженерия, математика", "Наука, технологии, инженерия, математика", "Science, technology, engineering, mathematics"),
    extra: t("Окуучулар жыл сайын эл аралык робототехника мелдештерине катышат.", "Ученики ежегодно участвуют в международных соревнованиях по робототехнике.", "Students compete in international robotics tournaments every year."),
    systems: ["stem", "national"], grades: [5, 11], founded: 2015, students: 360, teachers: 44, classSize: 18, tuition: [14000, 20000],
    languages: [{ code: "ru", primary: true }, { code: "en" }, { code: "kg" }], transport: false, boarding: false,
    programs: ["national-core", "robotics-coding", "math-advanced", "science-lab", "english-intensive", "entrepreneurship"], clubs: ["robotics-club", "olympiad-club", "chess-club"], sports: ["football", "table-tennis"],
    facilities: ["library", "science_lab", "computer_lab", "robotics_lab", "canteen", "security", "cctv", "wifi"],
    offset: [0.03, 0.045], street: t("Исанов көчөсү, Бишкек", "улица Исанова, Бишкек", "Isanov Street, Bishkek"), district: "Leninsky",
    faqs: [faqAdmission("5"), faqVisit], gallery: ["lab", "classroom"],
  },
  {
    slug: "bilim-secondary-school", city: "bishkek", type: "public", initial: "B",
    name: t("Билим орто мектеби", "Средняя школа «Билим»", "Bilim Secondary School"),
    tagline: t("Ар бир бала үчүн сапаттуу негизги билим", "Качественное базовое образование для каждого ребёнка", "Solid foundations for every child"),
    extra: t("Мектеп жергиликтүү жамаат менен тыгыз иштешип, ата-энелер кеңеши активдүү.", "Школа тесно работает с местным сообществом, активно действует родительский совет.", "The school works closely with the local community and has an active parents' council."),
    systems: ["national"], grades: [1, 11], founded: 1971, students: 1450, teachers: 96, classSize: 32, tuition: [0, 0],
    languages: [{ code: "kg", primary: true }, { code: "ru" }, { code: "en" }], transport: false, boarding: false,
    programs: ["national-core", "ort-prep", "kyrgyz-lit", "russian-lit", "arts-music"], clubs: ["chess-club", "crafts-club", "choir-club"], sports: ["football", "volleyball", "wrestling", "athletics"],
    facilities: ["library", "computer_lab", "gym", "canteen", "medical_room", "playground", "stadium"],
    offset: [-0.02, -0.055], street: t("Ибраимов көчөсү, Бишкек", "улица Ибраимова, Бишкек", "Ibraimov Street, Bishkek"), district: "Sverdlovsky",
    faqs: [faqVisit, { q: t("Окуу акысы барбы?", "Есть ли плата за обучение?", "Is there a tuition fee?"), a: t("Жок, мамлекеттик мектепте окуу акысыз.", "Нет, обучение в государственной школе бесплатное.", "No, education at this public school is free.") }], gallery: ["classroom", "sports"],
  },
  {
    slug: "aigul-montessori-school", city: "bishkek", type: "private", initial: "A",
    name: t("Айгүл Монтессори мектеби", "Школа Монтессори «Айгуль»", "Aigul Montessori School"),
    tagline: t("Бала өз темпинде өсөт", "Ребёнок растёт в своём темпе", "Where children grow at their own pace"),
    extra: t("Аралаш курактагы топтор жана сертификатталган Монтессори мугалимдери.", "Разновозрастные группы и сертифицированные педагоги Монтессори.", "Mixed-age classrooms led by certified Montessori guides."),
    systems: ["montessori"], grades: [0, 4], founded: 2012, students: 140, teachers: 22, classSize: 14, tuition: [18000, 22000],
    languages: [{ code: "ru", primary: true }, { code: "kg" }, { code: "en" }], transport: false, boarding: false,
    programs: ["montessori-prep", "english-intensive", "arts-music"], clubs: ["art-club", "eco-club", "choir-club"], sports: ["gymnastics", "swimming"],
    facilities: ["library", "playground", "canteen", "medical_room", "security", "cctv", "art_studio", "music_room", "wifi"],
    offset: [0.005, 0.01], street: t("Фучик көчөсү, Бишкек", "улица Фучика, Бишкек", "Fuchik Street, Bishkek"), district: "Pervomaisky",
    faqs: [faqVisit, faqMeals], gallery: ["classroom", "library"],
  },
  {
    slug: "mountain-star-waldorf-school", city: "bishkek", type: "private", initial: "M",
    name: t("Тоо Жылдызы Вальдорф мектеби", "Вальдорфская школа «Горная звезда»", "Mountain Star Waldorf School"),
    tagline: t("Башты, жүрөктү жана колду өнүктүрөбүз", "Развиваем голову, сердце и руки", "Educating head, heart and hands"),
    extra: t("Бир класстык мугалим башталгыч класстарда балдарды төрт жыл коштойт.", "Классный учитель сопровождает детей на протяжении четырёх лет начальной школы.", "One class teacher accompanies children through the four primary years."),
    systems: ["waldorf"], grades: [1, 9], founded: 2010, students: 210, teachers: 31, classSize: 18, tuition: [15000, 19000],
    languages: [{ code: "ru", primary: true }, { code: "kg" }, { code: "de" }], transport: false, boarding: false,
    programs: ["waldorf-main-lesson", "german-lang", "arts-music", "ecology"], clubs: ["crafts-club", "theatre-club", "eco-club", "choir-club"], sports: ["gymnastics", "athletics"],
    facilities: ["library", "art_studio", "music_room", "playground", "canteen", "medical_room", "security"],
    offset: [-0.05, -0.01], street: t("Токтогул көчөсү, Бишкек", "улица Токтогула, Бишкек", "Toktogul Street, Bishkek"), district: "Pervomaisky",
    faqs: [faqVisit, faqMeals], gallery: ["classroom", "library"],
  },
  {
    slug: "capital-turkish-kyrgyz-lyceum", city: "bishkek", type: "private", initial: "C",
    name: t("Борбор түрк-кыргыз лицейи", "Столичный турецко-кыргызский лицей", "Capital Turkish-Kyrgyz Lyceum"),
    tagline: t("Тил үйрөнүү жана академиялык тартип", "Языки и академическая дисциплина", "Languages and academic discipline"),
    extra: t("Түрк жана англис тилдерин тереңдетип окутуу, бүтүрүүчүлөр үчүн эл аралык олимпиадалар.", "Углублённое изучение турецкого и английского, международные олимпиады для выпускников.", "Intensive Turkish and English study with international olympiads for senior students."),
    systems: ["turkish", "national"], grades: [5, 11], founded: 1993, students: 540, teachers: 58, classSize: 22, tuition: [12000, 17000],
    scholarships: t("Жөндөмдүү окуучулар үчүн толук стипендия бар.", "Для одарённых учеников предусмотрены полные стипендии.", "Full scholarships are available for gifted students."),
    languages: [{ code: "tr", primary: true }, { code: "ru" }, { code: "en" }, { code: "kg" }], transport: true, boarding: true,
    transportInfo: t("Борбордук маршруттар боюнча.", "По центральным маршрутам.", "Central routes only."),
    programs: ["national-core", "turkish-lang", "english-intensive", "math-advanced", "science-lab"], clubs: ["debate-club", "chess-club", "olympiad-club"], sports: ["football", "basketball", "volleyball"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "dormitory", "medical_room", "security", "cctv", "wifi"],
    offset: [0.025, -0.045], street: t("Тоголок Молдо көчөсү, Бишкек", "улица Тоголок Молдо, Бишкек", "Togolok Moldo Street, Bishkek"), district: "Leninsky",
    faqs: [faqAdmission("5"), faqMeals], gallery: ["classroom", "lab", "sports"],
  },
  {
    slug: "neva-russian-school", city: "bishkek", type: "private", initial: "N",
    name: t("Нева орус мектеби", "Школа «Нева» (российский стандарт)", "Neva Russian-Standard School"),
    tagline: t("Россиянын федералдык стандарты боюнча", "По федеральным стандартам России", "Following the Russian federal standard"),
    extra: t("Бүтүрүүчүлөр Россиянын жана Кыргызстандын университеттерине даярдалат.", "Выпускники готовятся к поступлению в вузы России и Кыргызстана.", "Graduates prepare for universities in Russia and Kyrgyzstan."),
    systems: ["russian"], grades: [1, 11], founded: 2005, students: 480, teachers: 49, classSize: 20, tuition: [13000, 18000],
    languages: [{ code: "ru", primary: true }, { code: "en" }, { code: "kg" }], transport: true, boarding: false,
    programs: ["russian-lit", "math-advanced", "science-lab", "english-intensive", "ort-prep"], clubs: ["chess-club", "journalism-club", "olympiad-club"], sports: ["football", "volleyball", "table-tennis", "athletics"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "medical_room", "security", "wifi", "playground"],
    offset: [-0.01, 0.03], street: t("Московская көчөсү, Бишкек", "улица Московская, Бишкек", "Moskovskaya Street, Bishkek"), district: "Pervomaisky",
    faqs: [faqAdmission("1"), faqVisit], gallery: ["classroom", "sports"],
  },
  {
    slug: "onor-arts-school", city: "bishkek", type: "specialized", initial: "Ө",
    name: t("Өнөр искусство мектеби", "Школа искусств «Өнөр»", "Onor Arts School"),
    tagline: t("Талантты өнүктүрүүчү атайын мектеп", "Специализированная школа для творчески одарённых детей", "A specialised school for creative talent"),
    extra: t("Музыка, хореография жана живопись боюнча профессионалдык окутуу.", "Профессиональное обучение музыке, хореографии и живописи.", "Professional training in music, choreography and painting."),
    systems: ["national"], grades: [1, 11], founded: 1983, students: 390, teachers: 52, classSize: 15, tuition: [3000, 6000],
    scholarships: t("Таланттуу балдар үчүн мамлекеттик стипендиялар.", "Государственные стипендии для талантливых детей.", "State scholarships for talented children."),
    languages: [{ code: "kg", primary: true }, { code: "ru" }], transport: false, boarding: false,
    programs: ["national-core", "arts-music", "kyrgyz-lit"], clubs: ["choir-club", "art-club", "theatre-club", "crafts-club"], sports: ["gymnastics"],
    facilities: ["library", "art_studio", "music_room", "theater", "canteen", "medical_room", "security"],
    offset: [0.004, -0.075], street: t("Абдрахманов көчөсү, Бишкек", "улица Абдрахманова, Бишкек", "Abdrakhmanov Street, Bishkek"), district: "Oktyabrsky",
    faqs: [{ q: t("Кирүү сынагы барбы?", "Есть ли творческое испытание?", "Is there an audition?"), a: t("Ооба, кабыл алуу алдында музыкалык жана көркөм жөндөмдү текшерүү өтөт.", "Да, перед зачислением проводится проверка музыкальных и художественных способностей.", "Yes, applicants complete a musical and artistic aptitude audition.") }, faqVisit], gallery: ["classroom", "library"],
  },
  {
    slug: "sunrise-american-academy", city: "bishkek", type: "international", initial: "S",
    name: t("Таң Америкалык академиясы", "Американская академия «Рассвет»", "Sunrise American Academy"),
    tagline: t("AP курстары жана SAT даярдыгы", "Курсы AP и подготовка к SAT", "AP courses and SAT preparation"),
    extra: t("Бүтүрүүчүлөр АКШнын жана Европанын университеттерине кабыл алынат.", "Выпускники поступают в университеты США и Европы.", "Graduates are admitted to universities in the US and Europe."),
    systems: ["american"], grades: [6, 11], founded: 2017, students: 260, teachers: 35, classSize: 15, tuition: [32000, 45000],
    scholarships: t("Муктаж үй-бүлөлөргө финансылык жардам.", "Финансовая помощь нуждающимся семьям.", "Need-based financial aid is available."),
    languages: [{ code: "en", primary: true }, { code: "ru" }], transport: true, boarding: false,
    programs: ["american-hs", "english-intensive", "math-advanced", "science-lab", "entrepreneurship"], clubs: ["debate-club", "journalism-club", "robotics-club", "photo-club"], sports: ["basketball", "volleyball", "football"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "medical_room", "security", "cctv", "wifi", "psychologist"],
    offset: [0.04, 0.0], street: t("Мира проспектиси, Бишкек", "проспект Мира, Бишкек", "Mira Avenue, Bishkek"), district: "Leninsky",
    faqs: [faqAdmission("6"), faqVisit], gallery: ["classroom", "lab", "sports"],
  },
  // Osh
  {
    slug: "fergana-gate-lyceum", city: "osh", type: "private", initial: "F", featured: true,
    name: t("Фергана дарбазасы лицейи", "Лицей «Ферганские ворота»", "Fergana Gate Lyceum"),
    tagline: t("Түштүктүн алдыңкы лицейи", "Ведущий лицей юга страны", "The south's leading lyceum"),
    extra: t("Математика жана англис тили боюнча республикалык олимпиадалардын жеңүүчүлөрү.", "Победители республиканских олимпиад по математике и английскому языку.", "Winners of national mathematics and English olympiads."),
    systems: ["national", "cambridge"], grades: [1, 11], founded: 2006, students: 560, teachers: 61, classSize: 22, tuition: [9000, 13000],
    languages: [{ code: "kg", primary: true }, { code: "ru" }, { code: "en" }], transport: true, boarding: false,
    programs: ["national-core", "cambridge-igcse", "math-advanced", "english-intensive", "ort-prep"], clubs: ["debate-club", "chess-club", "olympiad-club"], sports: ["football", "volleyball", "wrestling"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "medical_room", "security", "wifi"],
    offset: [0.008, -0.012], street: t("Курманжан Датка көчөсү, Ош", "улица Курманжан Датки, Ош", "Kurmanjan Datka Street, Osh"),
    faqs: [faqAdmission("1"), faqMeals], gallery: ["classroom", "sports"],
  },
  {
    slug: "osh-bright-future-school", city: "osh", type: "private", initial: "J",
    name: t("Ош Жарык келечек мектеби", "Школа «Светлое будущее» Ош", "Osh Bright Future School"),
    tagline: t("Башталгыч класстарда ышкы жана камкордук", "Забота и внимание в начальной школе", "Care and attention in the primary years"),
    extra: t("Узартылган күн тобу жана үй тапшырмасына жардам.", "Группа продлённого дня и помощь с домашними заданиями.", "After-school care with homework support."),
    systems: ["national"], grades: [1, 9], founded: 2011, students: 310, teachers: 33, classSize: 20, tuition: [6000, 9000],
    languages: [{ code: "kg", primary: true }, { code: "ru" }], transport: false, boarding: false,
    programs: ["national-core", "english-intensive", "arts-music"], clubs: ["art-club", "chess-club", "crafts-club"], sports: ["football", "volleyball"],
    facilities: ["library", "computer_lab", "canteen", "playground", "medical_room", "security"],
    offset: [-0.015, 0.02], street: t("Масалиев көчөсү, Ош", "улица Масалиева, Ош", "Masaliev Street, Osh"),
    faqs: [faqVisit, faqMeals], gallery: ["classroom"],
  },
  {
    slug: "alay-public-gymnasium", city: "osh", type: "public", initial: "A",
    name: t("Алай мамлекеттик гимназиясы", "Государственная гимназия «Алай»", "Alay Public Gymnasium"),
    tagline: t("Тереңдетилген программа менен мамлекеттик гимназия", "Государственная гимназия с углублённой программой", "A public gymnasium with an enriched programme"),
    extra: t("Кабыл алуу мелдештик тест аркылуу.", "Приём проводится по результатам конкурсного тестирования.", "Admission is competitive and based on an entrance test."),
    systems: ["national"], grades: [5, 11], founded: 1968, students: 980, teachers: 72, classSize: 28, tuition: [0, 0],
    languages: [{ code: "kg", primary: true }, { code: "ru" }, { code: "en" }], transport: false, boarding: false,
    programs: ["national-core", "math-advanced", "ort-prep", "kyrgyz-lit"], clubs: ["olympiad-club", "chess-club", "journalism-club"], sports: ["wrestling", "football", "athletics", "volleyball"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "stadium"],
    offset: [0.02, 0.035], street: t("Ленин көчөсү, Ош", "улица Ленина, Ош", "Lenin Street, Osh"),
    faqs: [{ q: t("Окуу акысыз бекен?", "Обучение бесплатное?", "Is tuition free?"), a: t("Ооба, мамлекеттик гимназия.", "Да, это государственная гимназия.", "Yes, it is a public gymnasium.") }, faqVisit], gallery: ["classroom", "sports"],
  },
  {
    slug: "southern-cambridge-school", city: "osh", type: "international", initial: "S",
    name: t("Түштүк Кембридж мектеби", "Южная школа Cambridge", "Southern Cambridge School"),
    tagline: t("Түштүктөгү Кембридж программасы", "Программа Cambridge на юге Кыргызстана", "Cambridge education in southern Kyrgyzstan"),
    extra: t("Кембридж борборунун расмий экзамен борбору.", "Официальный экзаменационный центр Cambridge.", "An official Cambridge examination centre."),
    systems: ["cambridge"], grades: [1, 11], founded: 2016, students: 230, teachers: 30, classSize: 14, tuition: [20000, 28000],
    scholarships: t("Жыл сайын 5 жарым-жартылай стипендия.", "Ежегодно 5 частичных стипендий.", "Five partial scholarships each year."),
    languages: [{ code: "en", primary: true }, { code: "kg" }, { code: "ru" }], transport: true, boarding: false,
    programs: ["cambridge-igcse", "cambridge-alevel", "english-intensive", "science-lab"], clubs: ["debate-club", "robotics-club", "photo-club"], sports: ["football", "basketball", "swimming"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "medical_room", "security", "cctv", "wifi"],
    offset: [-0.025, -0.03], street: t("Навои көчөсү, Ош", "улица Навои, Ош", "Navoi Street, Osh"),
    faqs: [faqAdmission("1"), faqMeals], gallery: ["classroom", "lab"],
  },
  // Jalal-Abad
  {
    slug: "kara-alma-lyceum", city: "jalal-abad", type: "private", initial: "K",
    name: t("Кара-Алма лицейи", "Лицей «Кара-Алма»", "Kara-Alma Lyceum"),
    tagline: t("Жалал-Абаддагы эң көп сыйлык алган лицей", "Лицей с наибольшим числом наград в Джалал-Абаде", "Jalal-Abad's most decorated lyceum"),
    extra: t("Жалал-Абад облусунун олимпиадаларында жыл сайын жогорку орундар.", "Ежегодные призовые места на областных олимпиадах.", "Top places at regional olympiads every year."),
    systems: ["national"], grades: [1, 11], founded: 2003, students: 470, teachers: 50, classSize: 22, tuition: [7000, 11000],
    languages: [{ code: "kg", primary: true }, { code: "ru" }, { code: "en" }], transport: true, boarding: false,
    programs: ["national-core", "math-advanced", "english-intensive", "ort-prep"], clubs: ["chess-club", "olympiad-club", "choir-club"], sports: ["football", "wrestling", "volleyball"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "medical_room", "security"],
    offset: [0.005, 0.01], street: t("Ленин көчөсү, Жалал-Абад", "улица Ленина, Джалал-Абад", "Lenin Street, Jalal-Abad"),
    faqs: [faqAdmission("1"), faqMeals], gallery: ["classroom", "sports"],
  },
  {
    slug: "bayan-public-school", city: "jalal-abad", type: "public", initial: "B",
    name: t("Баян орто мектеби", "Средняя школа «Баян»", "Bayan Public School"),
    tagline: t("Жамаатка жакын мектеп", "Школа, близкая к сообществу", "A school at the heart of the community"),
    extra: t("Спорттук секциялар жана көркөм өнөр үйрөтүүчү кошумча сабактар акысыз.", "Бесплатные спортивные секции и кружки по искусству.", "Free sports sections and arts clubs."),
    systems: ["national"], grades: [1, 11], founded: 1975, students: 1250, teachers: 84, classSize: 30, tuition: [0, 0],
    languages: [{ code: "kg", primary: true }, { code: "ru" }], transport: false, boarding: false,
    programs: ["national-core", "ort-prep", "kyrgyz-lit", "russian-lit"], clubs: ["crafts-club", "choir-club", "chess-club"], sports: ["football", "wrestling", "athletics", "volleyball"],
    facilities: ["library", "computer_lab", "gym", "canteen", "stadium", "medical_room"],
    offset: [-0.012, -0.018], street: t("Токтогул көчөсү, Жалал-Абад", "улица Токтогула, Джалал-Абад", "Toktogul Street, Jalal-Abad"),
    faqs: [faqVisit], gallery: ["classroom", "sports"],
  },
  {
    slug: "walnut-grove-international-school", city: "jalal-abad", type: "international", initial: "W",
    name: t("Жаңгак токой эл аралык мектеби", "Международная школа «Ореховая роща»", "Walnut Grove International School"),
    tagline: t("Табият менен тыгыз байланышта окуу", "Обучение в тесной связи с природой", "Learning in close contact with nature"),
    extra: t("Экология жана тоо экспедициялары окуу программасынын бир бөлүгү.", "Экология и горные экспедиции входят в учебную программу.", "Ecology and mountain expeditions are part of the curriculum."),
    systems: ["ib", "stem"], grades: [1, 9], founded: 2018, students: 180, teachers: 26, classSize: 14, tuition: [15000, 21000],
    languages: [{ code: "en", primary: true }, { code: "kg" }, { code: "ru" }], transport: true, boarding: true,
    programs: ["ib-pyp-myp", "ecology", "science-lab", "english-intensive"], clubs: ["eco-club", "photo-club", "robotics-club"], sports: ["skiing", "football", "athletics"],
    facilities: ["library", "science_lab", "computer_lab", "gym", "canteen", "dormitory", "medical_room", "security", "wifi", "playground"],
    offset: [0.03, 0.04], street: t("Арслан-Боб жолу, Жалал-Абад", "Арслан-Бобская дорога, Джалал-Абад", "Arslanbob Road, Jalal-Abad"),
    faqs: [faqAdmission("1"), faqMeals], gallery: ["classroom", "lab", "sports"],
  },
  // Karakol
  {
    slug: "issyk-kul-lake-lyceum", city: "karakol", type: "private", initial: "Y",
    name: t("Ысык-Көл лицейи", "Лицей «Иссык-Куль»", "Issyk-Kul Lake Lyceum"),
    tagline: t("Көлдүн жээгиндеги лицей", "Лицей на берегу озера", "A lyceum by the lake"),
    extra: t("Англис тилин тереңдетип окутуу жана туризм багыты.", "Углублённый английский и туристическое направление.", "Intensive English and a tourism pathway."),
    systems: ["national", "cambridge"], grades: [1, 11], founded: 2007, students: 340, teachers: 38, classSize: 20, tuition: [7000, 10000],
    languages: [{ code: "kg", primary: true }, { code: "ru" }, { code: "en" }], transport: true, boarding: false,
    programs: ["national-core", "english-intensive", "cambridge-igcse", "ecology"], clubs: ["eco-club", "photo-club", "debate-club"], sports: ["skiing", "swimming", "football", "volleyball"],
    facilities: ["library", "computer_lab", "gym", "canteen", "medical_room", "security", "wifi"],
    offset: [0.004, -0.008], street: t("Абдрахманов көчөсү, Каракол", "улица Абдрахманова, Каракол", "Abdrakhmanov Street, Karakol"),
    faqs: [faqAdmission("1"), faqMeals], gallery: ["classroom", "sports"],
  },
  {
    slug: "karakol-peak-gymnasium", city: "karakol", type: "public", initial: "K",
    name: t("Каракол чокусу гимназиясы", "Гимназия «Пик Каракол»", "Karakol Peak Gymnasium"),
    tagline: t("Тоолуу чөйрөдөгү мамлекеттик гимназия", "Государственная гимназия в горной среде", "A public gymnasium in the mountains"),
    extra: t("Кышкы спорттук секциялар жана тоо лыжа мектеби менен кызматташуу.", "Зимние спортивные секции и сотрудничество с горнолыжной школой.", "Winter sports sections in partnership with a ski school."),
    systems: ["national"], grades: [1, 11], founded: 1962, students: 1100, teachers: 74, classSize: 28, tuition: [0, 0],
    languages: [{ code: "kg", primary: true }, { code: "ru" }], transport: false, boarding: false,
    programs: ["national-core", "ort-prep", "kyrgyz-lit", "ecology"], clubs: ["chess-club", "crafts-club", "choir-club"], sports: ["skiing", "football", "wrestling", "athletics"],
    facilities: ["library", "computer_lab", "gym", "canteen", "stadium", "medical_room"],
    offset: [-0.01, 0.02], street: t("Ленин көчөсү, Каракол", "улица Ленина, Каракол", "Lenin Street, Karakol"),
    faqs: [faqVisit], gallery: ["classroom", "sports"],
  },
  {
    slug: "jeti-oguz-boarding-school", city: "karakol", type: "specialized", initial: "J",
    name: t("Жети-Өгүз интернат мектеби", "Школа-интернат «Джеты-Огуз»", "Jeti-Oguz Boarding School"),
    tagline: t("Алыскы айылдардан келген окуучуларга интернат", "Интернат для детей из отдалённых сёл", "Boarding for students from remote villages"),
    extra: t("Тоолуу райондордон келген балдар үчүн толук күтүм жана ар тараптуу колдоо.", "Полный уход и всесторонняя поддержка для детей из горных районов.", "Full care and holistic support for children from mountain districts."),
    systems: ["national"], grades: [1, 11], founded: 1989, students: 280, teachers: 40, classSize: 16, tuition: [0, 3000],
    tuitionNote: t("Негизинен мамлекеттик каржылоо; жатакана үчүн символикалык төлөм.", "Преимущественно государственное финансирование; символическая плата за проживание.", "Mostly state funded; a nominal fee covers accommodation."),
    languages: [{ code: "kg", primary: true }, { code: "ru" }], transport: false, boarding: true,
    programs: ["national-core", "ecology", "kyrgyz-lit"], clubs: ["crafts-club", "choir-club"], sports: ["wrestling", "skiing", "football"],
    facilities: ["library", "gym", "canteen", "dormitory", "medical_room", "security", "playground", "psychologist"],
    offset: [0.05, -0.03], street: t("Жети-Өгүз айылы", "село Джеты-Огуз", "Jeti-Oguz village"),
    faqs: [faqVisit, faqMeals], gallery: ["classroom"],
  },
  // Tokmok
  {
    slug: "chu-valley-lyceum", city: "tokmok", type: "private", initial: "C",
    name: t("Чүй өрөөнү лицейи", "Лицей «Чуйская долина»", "Chu Valley Lyceum"),
    tagline: t("Чүй өрөөнүндөгү заманбап лицей", "Современный лицей в Чуйской долине", "A modern lyceum in the Chu Valley"),
    extra: t("Борбордук Азиянын аймактык олимпиадаларына даярдоо.", "Подготовка к региональным олимпиадам Центральной Азии.", "Preparation for Central Asian regional olympiads."),
    systems: ["national", "stem"], grades: [1, 11], founded: 2009, students: 290, teachers: 32, classSize: 20, tuition: [6000, 9000],
    languages: [{ code: "ru", primary: true }, { code: "kg" }, { code: "en" }], transport: true, boarding: false,
    programs: ["national-core", "robotics-coding", "math-advanced", "english-intensive"], clubs: ["robotics-club", "chess-club", "olympiad-club"], sports: ["football", "volleyball", "table-tennis"],
    facilities: ["library", "computer_lab", "robotics_lab", "gym", "canteen", "medical_room", "security", "wifi"],
    offset: [0.004, -0.006], street: t("Фрунзе көчөсү, Токмок", "улица Фрунзе, Токмок", "Frunze Street, Tokmok"),
    faqs: [faqAdmission("1"), faqMeals], gallery: ["classroom", "lab"],
  },
  {
    slug: "tokmok-harmony-school", city: "tokmok", type: "public", initial: "H",
    name: t("Токмок Гармония мектеби", "Школа «Гармония» Токмок", "Tokmok Harmony School"),
    tagline: t("Музыка жана искусство менен окутуу", "Обучение через музыку и искусство", "Learning through music and the arts"),
    extra: t("Мектептин хору республикалык фестивалдарга катышат.", "Школьный хор участвует в республиканских фестивалях.", "The school choir performs at national festivals."),
    systems: ["national"], grades: [1, 11], founded: 1979, students: 860, teachers: 58, classSize: 27, tuition: [0, 0],
    languages: [{ code: "ru", primary: true }, { code: "kg" }], transport: false, boarding: false,
    programs: ["national-core", "arts-music", "ort-prep", "russian-lit"], clubs: ["choir-club", "art-club", "theatre-club"], sports: ["football", "volleyball", "athletics"],
    facilities: ["library", "computer_lab", "gym", "canteen", "music_room", "theater", "playground"],
    offset: [-0.008, 0.012], street: t("Ленин көчөсү, Токмок", "улица Ленина, Токмок", "Lenin Street, Tokmok"),
    faqs: [faqVisit], gallery: ["classroom", "library"],
  },
  // Naryn
  {
    slug: "ak-sai-highland-school", city: "naryn", type: "public", initial: "A",
    name: t("Ак-Сай бийик тоо мектеби", "Высокогорная школа «Ак-Сай»", "Ak-Sai Highland School"),
    tagline: t("Бийик тоодо сапаттуу билим", "Качественное образование высоко в горах", "Quality education high in the mountains"),
    extra: t("Мектеп Нарындагы биринчилерден болуп санариптик класстарды ачты.", "Школа одной из первых в Нарыне открыла цифровые классы.", "One of the first schools in Naryn to open digital classrooms."),
    systems: ["national"], grades: [1, 11], founded: 1974, students: 720, teachers: 51, classSize: 24, tuition: [0, 0],
    languages: [{ code: "kg", primary: true }, { code: "ru" }, { code: "en" }], transport: true, boarding: true,
    transportInfo: t("Жакынкы айылдардан кичи автобус.", "Микроавтобус из ближайших сёл.", "Minibus from nearby villages."),
    programs: ["national-core", "ort-prep", "kyrgyz-lit", "ecology"], clubs: ["chess-club", "crafts-club", "eco-club"], sports: ["wrestling", "skiing", "football"],
    facilities: ["library", "computer_lab", "gym", "canteen", "dormitory", "medical_room", "playground"],
    offset: [0.004, 0.01], street: t("Ленин көчөсү, Нарын", "улица Ленина, Нарын", "Lenin Street, Naryn"),
    faqs: [faqVisit, faqMeals], gallery: ["classroom", "sports"],
  },
  // Talas
  {
    slug: "talas-valley-gymnasium", city: "talas", type: "public", initial: "T",
    name: t("Талас өрөөнү гимназиясы", "Гимназия «Таласская долина»", "Talas Valley Gymnasium"),
    tagline: t("Манас өрөөнүндөгү гимназия", "Гимназия в долине эпоса Манас", "A gymnasium in the valley of the Manas epic"),
    extra: t("Манас таануу жана улуттук салт-санаа боюнча кошумча программа.", "Дополнительная программа по манасоведению и национальным традициям.", "An extra programme on Manas studies and national traditions."),
    systems: ["national"], grades: [1, 11], founded: 1966, students: 910, teachers: 63, classSize: 27, tuition: [0, 0],
    languages: [{ code: "kg", primary: true }, { code: "ru" }], transport: false, boarding: false,
    programs: ["national-core", "kyrgyz-lit", "ort-prep", "arts-music"], clubs: ["choir-club", "crafts-club", "chess-club"], sports: ["wrestling", "football", "volleyball"],
    facilities: ["library", "computer_lab", "gym", "canteen", "stadium", "medical_room"],
    offset: [-0.006, 0.009], street: t("Манас көчөсү, Талас", "улица Манаса, Талас", "Manas Street, Talas"),
    faqs: [faqVisit], gallery: ["classroom", "sports"],
  },
];

/** Real schools named by the project owner. Only names are stored; everything else is confirmed with each school. */
export const REAL_SCHOOLS: { slug: string; initial: string; name: I18n }[] = [
  { slug: "asylkech-girls-school", initial: "A", name: t("Асылкеч кыздар мектеби", "Школа для девочек «Асылкеч»", "Asylkech Girls School") },
  { slug: "indigo-sapat", initial: "I", name: t("Индиго Сапат", "Индиго Сапат", "Indigo Sapat") },
  { slug: "aim-school", initial: "A", name: t("АИМ мектеби", "Школа AIM", "AIM School") },
  { slug: "avenir", initial: "A", name: t("Авенир", "Авенир", "Avenir") },
  { slug: "light-academy", initial: "L", name: t("Лайт Академия", "Лайт Академия", "Light Academy") },
  { slug: "indigo-prime-academy", initial: "I", name: t("Индиго Прайм Академия", "Индиго Прайм Академия", "Indigo Prime Academy") },
  { slug: "indigo-kids", initial: "I", name: t("Индиго Кидс", "Индиго Кидс", "Indigo Kids") },
];
