export type I18n = { kg: string; ru: string; en: string };
export const t = (kg: string, ru: string, en: string): I18n => ({ kg, ru, en });

export const CITY_NAMES: Record<string, I18n> = {
  bishkek: t("Бишкек", "Бишкеке", "Bishkek"),
  osh: t("Ош", "Оше", "Osh"),
  "jalal-abad": t("Жалал-Абад", "Джалал-Абаде", "Jalal-Abad"),
  karakol: t("Каракол", "Караколе", "Karakol"),
  tokmok: t("Токмок", "Токмоке", "Tokmok"),
  naryn: t("Нарын", "Нарыне", "Naryn"),
  talas: t("Талас", "Таласе", "Talas"),
};

export const TYPE_LABEL: Record<string, I18n> = {
  public: t("мамлекеттик", "государственная", "public"),
  private: t("жеке менчик", "частная", "private"),
  international: t("эл аралык", "международная", "international"),
  specialized: t("адистештирилген", "специализированная", "specialized"),
};

export const SYSTEM_LABEL: Record<string, I18n> = {
  national: t("улуттук программа", "национальная программа", "the national curriculum"),
  ib: t("Эл аралык бакалавриат (IB)", "Международный бакалавриат (IB)", "the International Baccalaureate (IB)"),
  cambridge: t("Кембридж программасы", "программа Cambridge", "the Cambridge curriculum"),
  american: t("америкалык программа", "американская программа", "an American curriculum"),
  montessori: t("Монтессори методикасы", "методика Монтессори", "the Montessori method"),
  waldorf: t("Вальдорф педагогикасы", "вальдорфская педагогика", "Waldorf pedagogy"),
  turkish: t("түрк программасы", "турецкая программа", "a Turkish curriculum"),
  russian: t("орус стандарты", "российский стандарт", "the Russian standard"),
  stem: t("STEM багыты", "STEM-направление", "a STEM focus"),
};

export const LANG_LABEL: Record<string, I18n> = {
  kg: t("кыргыз", "кыргызском", "Kyrgyz"),
  ru: t("орус", "русском", "Russian"),
  en: t("англис", "английском", "English"),
  tr: t("түрк", "турецком", "Turkish"),
  de: t("герман", "немецком", "German"),
  zh: t("кытай", "китайском", "Chinese"),
};

export const FACILITY_NOTE: Record<string, I18n | undefined> = {};

export const PROGRAMS: Record<string, { kind: "academic" | "club" | "sport"; name: I18n; description?: I18n }> = {
  // academic
  "national-core": { kind: "academic", name: t("Улуттук базалык программа", "Национальная базовая программа", "National core curriculum"), description: t("Билим берүү министрлигинин стандарттарына ылайык.", "В соответствии со стандартами Министерства образования.", "Aligned with Ministry of Education standards.") },
  "ib-pyp-myp": { kind: "academic", name: t("IB PYP жана MYP", "IB PYP и MYP", "IB PYP and MYP"), description: t("Изилдөөгө негизделген эл аралык программа.", "Международная программа, основанная на исследовании.", "Inquiry-based international programmes.") },
  "ib-dp": { kind: "academic", name: t("IB Diploma", "IB Diploma", "IB Diploma Programme"), description: t("11–12-класстарга даярдоо, университеттерге кирүү үчүн.", "Подготовка 11–12 классов к поступлению в университеты.", "Pre-university programme for grades 11–12.") },
  "cambridge-igcse": { kind: "academic", name: t("Cambridge IGCSE", "Cambridge IGCSE", "Cambridge IGCSE"), description: t("Эл аралык экзамендерге даярдык.", "Подготовка к международным экзаменам.", "Preparation for international examinations.") },
  "cambridge-alevel": { kind: "academic", name: t("Cambridge A-Level", "Cambridge A-Level", "Cambridge A-Level") },
  "american-hs": { kind: "academic", name: t("Америкалык орто мектеп диплому", "Диплом американской старшей школы", "American high school diploma"), description: t("AP курстары жана SAT даярдыгы.", "Курсы AP и подготовка к SAT.", "AP courses and SAT preparation.") },
  "english-intensive": { kind: "academic", name: t("Англис тилин тереңдетип окутуу", "Углублённый английский язык", "Intensive English"), description: t("Күнүнө эки сабак, IELTS даярдыгы.", "Два урока в день, подготовка к IELTS.", "Two lessons per day with IELTS preparation.") },
  "math-advanced": { kind: "academic", name: t("Математиканы тереңдетип окутуу", "Углублённая математика", "Advanced mathematics"), description: t("Олимпиадаларга даярдык жана логика.", "Подготовка к олимпиадам и развитие логики.", "Olympiad preparation and logical reasoning.") },
  "robotics-coding": { kind: "academic", name: t("Робототехника жана программалоо", "Робототехника и программирование", "Robotics and coding"), description: t("1-класстан баштап Scratch, Python, Arduino.", "С 1 класса: Scratch, Python, Arduino.", "Scratch, Python and Arduino from grade 1.") },
  "science-lab": { kind: "academic", name: t("Табигый илимдер лабораториясы", "Лабораторные естественные науки", "Laboratory sciences"), description: t("Физика, химия, биология боюнча практикалык иштер.", "Практические работы по физике, химии и биологии.", "Hands-on physics, chemistry and biology.") },
  "turkish-lang": { kind: "academic", name: t("Түрк тили", "Турецкий язык", "Turkish language") },
  "russian-lit": { kind: "academic", name: t("Орус адабияты жана тили", "Русский язык и литература", "Russian language and literature") },
  "kyrgyz-lit": { kind: "academic", name: t("Кыргыз адабияты жана Манас таануу", "Кыргызская литература и манасоведение", "Kyrgyz literature and Manas studies") },
  "chinese-lang": { kind: "academic", name: t("Кытай тили", "Китайский язык", "Chinese language") },
  "german-lang": { kind: "academic", name: t("Герман тили", "Немецкий язык", "German language") },
  "montessori-prep": { kind: "academic", name: t("Монтессори даярдоо чөйрөсү", "Подготовленная среда Монтессори", "Montessori prepared environment"), description: t("Балдар өз темпинде өз алдынча үйрөнөт.", "Дети учатся самостоятельно в своём темпе.", "Children learn independently at their own pace.") },
  "waldorf-main-lesson": { kind: "academic", name: t("Негизги сабак (Вальдорф)", "Эпоховое обучение (Вальдорф)", "Main lesson blocks (Waldorf)") },
  "arts-music": { kind: "academic", name: t("Искусство жана музыка", "Искусство и музыка", "Arts and music"), description: t("Комуз, живопись жана хор.", "Комуз, живопись и хор.", "Komuz, painting and choir.") },
  "ort-prep": { kind: "academic", name: t("ЖРТ (ОРТ) даярдыгы", "Подготовка к ОРТ", "National exam (ORT) preparation") },
  "entrepreneurship": { kind: "academic", name: t("Ишкердик негиздери", "Основы предпринимательства", "Entrepreneurship basics") },
  "ecology": { kind: "academic", name: t("Экология жана тоо таануу", "Экология и горные исследования", "Ecology and mountain studies") },
  // clubs
  "chess-club": { kind: "club", name: t("Шахмат", "Шахматы", "Chess") },
  "debate-club": { kind: "club", name: t("Дебат клубу", "Дебатный клуб", "Debate club") },
  "robotics-club": { kind: "club", name: t("Робототехника", "Робототехника", "Robotics") },
  "theatre-club": { kind: "club", name: t("Театр студиясы", "Театральная студия", "Drama studio") },
  "choir-club": { kind: "club", name: t("Хор жана комуз", "Хор и комуз", "Choir and komuz") },
  "art-club": { kind: "club", name: t("Сүрөт студиясы", "Художественная студия", "Art studio") },
  "olympiad-club": { kind: "club", name: t("Олимпиада даярдыгы", "Олимпиадная подготовка", "Olympiad training") },
  "eco-club": { kind: "club", name: t("Эко-клуб", "Эко-клуб", "Eco club") },
  "journalism-club": { kind: "club", name: t("Мектеп гезити", "Школьная газета", "School newspaper") },
  "crafts-club": { kind: "club", name: t("Улуттук кол өнөрчүлүк", "Народные ремёсла", "Traditional crafts") },
  "photo-club": { kind: "club", name: t("Фотография", "Фотография", "Photography") },
  // sports
  football: { kind: "sport", name: t("Футбол", "Футбол", "Football") },
  basketball: { kind: "sport", name: t("Баскетбол", "Баскетбол", "Basketball") },
  volleyball: { kind: "sport", name: t("Волейбол", "Волейбол", "Volleyball") },
  swimming: { kind: "sport", name: t("Сууда сүзүү", "Плавание", "Swimming") },
  taekwondo: { kind: "sport", name: t("Таэквондо", "Таэквондо", "Taekwondo") },
  wrestling: { kind: "sport", name: t("Күрөш", "Борьба (кураш)", "Wrestling (kurosh)") },
  athletics: { kind: "sport", name: t("Жеңил атлетика", "Лёгкая атлетика", "Athletics") },
  skiing: { kind: "sport", name: t("Тоо лыжа", "Горные лыжи", "Skiing") },
  "table-tennis": { kind: "sport", name: t("Стол тенниси", "Настольный теннис", "Table tennis") },
  gymnastics: { kind: "sport", name: t("Гимнастика", "Гимнастика", "Gymnastics") },
};
