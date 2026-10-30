import type { I18n } from "./i18n";

type Lang = keyof I18n;
type Pool = Record<Lang, string[]>;

/** Sentence pools used to compose varied, plausible review text per language. */
export const OPENING: Record<"pos" | "mid" | "neg", Pool> = {
  pos: {
    en: ["We have been very happy with this school.", "Our daughter looks forward to going every morning.", "Choosing this school was one of our best decisions.", "Our son has grown in confidence since he started here."],
    ru: ["Мы очень довольны этой школой.", "Дочь каждое утро с радостью идёт на уроки.", "Выбор этой школы стал одним из лучших наших решений.", "Сын стал заметно увереннее с тех пор, как начал здесь учиться."],
    kg: ["Бул мектепке абдан ыраазыбыз.", "Кызым эртең менен мектепке кубанып барат.", "Бул мектепти тандаганыбыз эң туура чечим болду.", "Уулум бул жерге келгенден бери ишеними бекемдеди."],
  },
  mid: {
    en: ["A solid school with a few things to improve.", "Overall decent, though it is not perfect.", "Good in some areas and average in others."],
    ru: ["Достойная школа, но есть над чем поработать.", "В целом неплохо, хотя идеальной её не назовёшь.", "В чём-то отлично, в чём-то средне."],
    kg: ["Жакшы мектеп, бирок оңдой турган жерлери бар.", "Жалпысынан жаман эмес, бирок кемчиликсиз деле эмес.", "Кээ бир жагынан мыкты, кээ бирлеринде орто."],
  },
  neg: {
    en: ["We expected more from this school.", "Unfortunately our experience was mixed to disappointing."],
    ru: ["Мы ожидали от школы большего.", "К сожалению, наш опыт оказался разочаровывающим."],
    kg: ["Мектептен көбүрөөк күткөнбүз.", "Тилекке каршы, тажрыйбабыз көңүл калтырды."],
  },
};

export const ASPECTS: Record<"teaching" | "facilities" | "safety" | "communication", { pos: Pool; low: Pool }> = {
  teaching: {
    pos: {
      en: ["The teachers are attentive and genuinely care about each child.", "Lessons are well prepared and the homework load is reasonable.", "Teachers explain patiently and the results are visible."],
      ru: ["Учителя внимательные и действительно заботятся о каждом ребёнке.", "Уроки хорошо подготовлены, а нагрузка по домашним заданиям разумная.", "Педагоги объясняют терпеливо, результаты видны."],
      kg: ["Мугалимдер көңүл бурып, ар бир балага чын дилинен кам көрүшөт.", "Сабактар жакшы даярдалган, үй тапшырмасы акылга сыярлык.", "Мугалимдер сабырдуулук менен түшүндүрөт, натыйжасы көрүнүп турат."],
    },
    low: {
      en: ["Some teachers change too often, which unsettles the children.", "The teaching quality varies a lot between classes."],
      ru: ["Некоторые учителя слишком часто меняются, и это выбивает детей из ритма.", "Качество преподавания заметно отличается от класса к классу."],
      kg: ["Айрым мугалимдер өтө көп алмашат, бул балдарга таасир этет.", "Сабактын сапаты класстан класска бир кыйла айырмаланат."],
    },
  },
  facilities: {
    pos: {
      en: ["The classrooms, library and sports areas are clean and well equipped.", "The science lab and computer room are used regularly.", "The building is modern and the canteen food is decent."],
      ru: ["Классы, библиотека и спортивные зоны чистые и хорошо оснащены.", "Лаборатория и компьютерный класс используются регулярно.", "Здание современное, а еда в столовой приличная."],
      kg: ["Класстар, китепкана жана спорт аянтчалары таза жана жакшы жабдылган.", "Лаборатория жана компьютер классы үзгүлтүксүз колдонулат.", "Имарат заманбап, ашканадагы тамак жакшы."],
    },
    low: {
      en: ["The building would benefit from renovation.", "The gym is too small for the number of students."],
      ru: ["Зданию не помешал бы ремонт.", "Спортзал тесноват для такого числа учеников."],
      kg: ["Имаратты оңдоп-түзөө керек.", "Спорт залы окуучулардын санына салыштырмалуу тар."],
    },
  },
  safety: {
    pos: {
      en: ["We feel the children are safe: entry is controlled and staff know every child.", "Supervision during breaks is attentive."],
      ru: ["Мы спокойны за безопасность: вход контролируется, персонал знает каждого ребёнка.", "На переменах дети находятся под внимательным присмотром."],
      kg: ["Коопсуздукка ишенебиз: кире бериш көзөмөлдө, кызматкерлер ар бир баланы таанышат.", "Тыныгууларда балдарга көңүл бурулат."],
    },
    low: {
      en: ["Supervision outside the building could be stricter.", "Pick-up time is chaotic."],
      ru: ["Присмотр за территорией мог бы быть строже.", "Во время забора детей бывает неразбериха."],
      kg: ["Короодогу көзөмөлдү күчөтсө болмок.", "Балдарды алып кетүү убагында башаламандык болот."],
    },
  },
  communication: {
    pos: {
      en: ["The administration answers parents quickly and listens to feedback.", "We get regular progress updates and clear reports."],
      ru: ["Администрация быстро отвечает родителям и прислушивается к отзывам.", "Мы регулярно получаем информацию об успехах и понятные отчёты."],
      kg: ["Администрация ата-энелерге тез жооп берет жана пикирин угат.", "Ийгиликтер тууралуу маалымат жана түшүнүктүү отчеттор үзгүлтүксүз берилет."],
    },
    low: {
      en: ["Communication with parents is slow and sometimes unclear.", "We often learn about changes at the last minute."],
      ru: ["Общение с родителями медленное, иногда неясное.", "Об изменениях мы часто узнаём в последний момент."],
      kg: ["Ата-энелер менен байланыш жай жана кээде түшүнүксүз.", "Өзгөрүүлөр тууралуу көбүнчө акыркы мүнөттө билебиз."],
    },
  },
};

export const CLOSING: Record<"pos" | "mid" | "neg", Pool> = {
  pos: {
    en: ["We would recommend it to other families.", "Highly recommended for parents who value a caring environment."],
    ru: ["Рекомендуем её другим семьям.", "Советуем родителям, которые ценят заботливую атмосферу."],
    kg: ["Башка үй-бүлөлөргө сунуштайбыз.", "Камкор чөйрөнү баалаган ата-энелерге сунуштайбыз."],
  },
  mid: {
    en: ["Visit in person and ask about the points above before deciding.", "Worth considering if the location suits you."],
    ru: ["Прежде чем решать, посетите школу и уточните перечисленные моменты.", "Стоит рассмотреть, если вам подходит расположение."],
    kg: ["Чечим кабыл алганга чейин мектепке барып, жогорудагы суроолорду тактап алыңыз.", "Жайгашуусу ылайыктуу болсо, карап көрүүгө арзыйт."],
  },
  neg: {
    en: ["We hope the administration addresses these issues.", "Ask many questions before enrolling."],
    ru: ["Надеемся, что администрация займётся этими вопросами.", "Перед зачислением задавайте как можно больше вопросов."],
    kg: ["Администрация бул маселелерди чечет деп үмүттөнөбүз.", "Кабыл алынаардан мурун көбүрөөк суроо бериңиз."],
  },
};

export const TITLES: Record<"pos" | "mid" | "neg", Pool> = {
  pos: {
    en: ["Caring teachers, happy kids", "Excellent choice for our family", "Great atmosphere and strong results", "Worth every som"],
    ru: ["Заботливые учителя, счастливые дети", "Отличный выбор для нашей семьи", "Хорошая атмосфера и сильные результаты", "Каждый сом оправдан"],
    kg: ["Камкор мугалимдер, бактылуу балдар", "Үй-бүлөбүз үчүн мыкты тандоо", "Жакшы чөйрө жана күчтүү натыйжалар", "Төлөгөн акчаңа арзыйт"],
  },
  mid: {
    en: ["Good, with room to grow", "Decent overall", "Mixed but fair"],
    ru: ["Хорошо, но есть куда расти", "В целом достойно", "По-разному, но справедливо"],
    kg: ["Жакшы, бирок өсө турган жери бар", "Жалпысынан жаман эмес", "Ар кандай, бирок калыс"],
  },
  neg: {
    en: ["Expected more", "Some real concerns"],
    ru: ["Ожидали большего", "Есть серьёзные замечания"],
    kg: ["Көбүрөөк күткөнбүз", "Олуттуу эскертмелер бар"],
  },
};
