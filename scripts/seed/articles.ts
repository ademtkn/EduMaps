import { t, type I18n } from "./i18n";

export type SeedArticle = {
  slug: string;
  category: string;
  kind: "article" | "guide" | "video";
  title: I18n;
  excerpt: I18n;
  body: I18n;
  tags: string[];
  minutes: number;
  featured?: boolean;
  daysAgo: number;
};

export const ARTICLES: SeedArticle[] = [
  {
    slug: "ib-cambridge-or-national-curriculum", category: "education-systems", kind: "article", featured: true, minutes: 6, daysAgo: 4, tags: ["ib", "cambridge", "curriculum"],
    title: t("IB, Cambridge же улуттук программа: кантип тандоо керек", "IB, Cambridge или национальная программа: как выбрать", "IB, Cambridge or the national curriculum: how to choose"),
    excerpt: t("Үч негизги жолдун айырмасы жана өз балаңызга кайсынысы ылайыктуу экенин аныктоонун жөнөкөй ыкмасы.", "Чем отличаются три основных пути и как понять, какой подходит вашему ребёнку.", "How the three main pathways differ, and a simple way to decide which fits your child."),
    body: t(
`## Үч жол

**Улуттук программа** Кыргызстандын мамлекеттик стандарттарына негизделген жана ЖРТ (ОРТ) аркылуу жергиликтүү университеттерге кирүүгө түз даярдайт.

**Cambridge** (IGCSE жана A-Level) предметтик терең билимди жана экзамендик система аркылуу так баа берүүнү сунуштайт.

**IB** изилдөөгө, сын көз карашка жана предметтер аралык байланышка басым жасайт.

## Кантип тандоо керек

- Балаңыз кайсы университетке кирет деп ойлойсуз: жергиликтүүбү же чет өлкөдөбү?
- Үй-бүлөңүз үчүн окуу тили канчалык маанилүү?
- Бала түзүлгөн тартипти жактырабы, же өз алдынча изилдегенди?

> Эң жакшы программа жок. Эң жакшы тандоо — балаңыздын мүнөзүнө жана үй-бүлөнүн максаттарына дал келген тандоо.

Тандоо алдында мектептерди **салыштыруу** барагынан колдонуп, мектепке өзүңүз барып көрүңүз.`,
`## Три пути

**Национальная программа** построена на государственных стандартах Кыргызстана и напрямую готовит к поступлению в местные вузы через ОРТ.

**Cambridge** (IGCSE и A-Level) предлагает глубокое предметное обучение и чёткую оценку через систему экзаменов.

**IB** делает акцент на исследовании, критическом мышлении и межпредметных связях.

## Как выбрать

- В какой университет, скорее всего, будет поступать ребёнок: местный или зарубежный?
- Насколько важен язык обучения для вашей семьи?
- Ребёнку ближе чёткая структура или самостоятельные исследования?

> Лучшей программы не существует. Лучший выбор — тот, который подходит характеру ребёнка и целям семьи.

Используйте страницу **сравнения школ** и обязательно посетите школу лично.`,
`## Three pathways

The **national curriculum** is built on Kyrgyzstan's state standards and prepares students directly for local universities through the ORT exam.

**Cambridge** (IGCSE and A-Level) offers deep subject study and clear grading through an exam system.

**IB** emphasises inquiry, critical thinking and links between subjects.

## How to choose

- Where is your child likely to study at university: locally or abroad?
- How important is the language of instruction to your family?
- Does your child prefer clear structure or self-directed exploration?

> There is no single best curriculum. The best choice is the one that fits your child's temperament and your family's goals.

Use the **school comparison** page, and always visit in person before deciding.`),
  },
  {
    slug: "how-the-kyrgyz-school-system-works", category: "education-systems", kind: "article", minutes: 5, daysAgo: 12, tags: ["national", "ort", "grades"],
    title: t("Кыргызстандын мектеп системасы кантип түзүлгөн", "Как устроена школьная система Кыргызстана", "How Kyrgyzstan's school system is organised"),
    excerpt: t("1-классынан 11-класска чейинки баскычтар жана жогорку окуу жайына кирүү жолу.", "Ступени от 1 до 11 класса и путь к поступлению в вуз.", "The stages from grade 1 to grade 11 and the path to university."),
    body: t(
`## Баскычтар

- **Башталгыч мектеп:** 1–4-класстар
- **Негизги мектеп:** 5–9-класстар
- **Орто мектеп:** 10–11-класстар

Мектепке чейинки даярдык бала бакчада же даярдык топторунда өтөт.

## Университетке кирүү

Жогорку окуу жайларына кирүү үчүн окуучулар **ЖРТ (ОРТ)** — жалпы республикалык тестти тапшырышат. Көптөгөн мектептер 10–11-класстарда тестке атайын даярдык сабактарын өткөрөт.

## Эмнеге көңүл буруу керек

Мектептин ЖРТ боюнча натыйжаларын, окутуу тилин жана кошумча программаларын сураңыз.`,
`## Ступени

- **Начальная школа:** 1–4 классы
- **Основная школа:** 5–9 классы
- **Средняя школа:** 10–11 классы

Дошкольная подготовка проходит в детских садах и подготовительных группах.

## Поступление в вуз

Для поступления в вузы выпускники сдают **ОРТ** — общереспубликанское тестирование. Многие школы проводят специальные подготовительные занятия в 10–11 классах.

## На что обратить внимание

Спросите о результатах школы по ОРТ, языке обучения и дополнительных программах.`,
`## Stages

- **Primary school:** grades 1–4
- **Basic school:** grades 5–9
- **Secondary school:** grades 10–11

Pre-school preparation takes place in kindergartens and preparatory groups.

## Getting into university

To enter universities, graduates sit the **ORT**, the general national test. Many schools run dedicated preparation classes in grades 10–11.

## What to look at

Ask about the school's ORT results, language of instruction and enrichment programmes.`),
  },
  {
    slug: "school-visit-checklist", category: "school-selection", kind: "guide", featured: true, minutes: 7, daysAgo: 2, tags: ["checklist", "visit"],
    title: t("Мектепке баруу: 10 суроо жана текшерүү тизмеси", "Визит в школу: 10 вопросов и чек-лист", "School visit guide: 10 questions and a checklist"),
    excerpt: t("Ачык эшиктер күнүндө эмнени көрүп, кимден эмнени сурасаңыз болот.", "Что посмотреть и о чём спросить на дне открытых дверей.", "What to look at and what to ask on an open day."),
    body: t(
`## Баруудан мурун

Окуу акысын, окуу тилдерин жана транспортту мектептин барагынан карап алыңыз.

## 10 суроо

1. Класста канча окуучу бар?
2. Мугалимдер канча жылдан бери иштейт?
3. Үй тапшырмасы канча убакыт алат?
4. Бала сабакта кыйналса эмне болот?
5. Ата-энелер менен байланыш кандай уюштурулган?
6. Тамактануу кандай жана аллергияда эмне кылышат?
7. Коопсуздук: кирүү тартиби кандай?
8. Кошумча секциялар жана алардын баасы?
9. Мектеп жылы эмнеге бөлүнөт, эс алуу күндөрү?
10. Кабыл алуу жана жеңилдиктер кандай?

## Көрүүгө тийиш

- Класстардын тазалыгы жана жарыктыгы
- Балдардын мугалимдер менен мамилеси
- Тыныгуудагы чөйрө`,
`## Перед визитом

Заранее изучите стоимость, языки обучения и транспорт на странице школы.

## 10 вопросов

1. Сколько учеников в классе?
2. Как давно работают учителя?
3. Сколько времени занимают домашние задания?
4. Что происходит, если ребёнку трудно на уроках?
5. Как организовано общение с родителями?
6. Как организовано питание и что делают при аллергии?
7. Безопасность: каков порядок входа?
8. Какие дополнительные секции и сколько они стоят?
9. Как устроен учебный год и каникулы?
10. Как проходит приём и какие есть льготы?

## На что смотреть

- Чистота и освещённость классов
- Как дети общаются с учителями
- Атмосфера на перемене`,
`## Before you go

Check tuition, languages of instruction and transport on the school's page first.

## 10 questions

1. How many students are in each class?
2. How long have the teachers been at the school?
3. How much time does homework take?
4. What happens if a child struggles in lessons?
5. How is communication with parents organised?
6. What are the meals like, and how are allergies handled?
7. Safety: how is entry controlled?
8. Which extra activities are offered and what do they cost?
9. How is the school year and holiday calendar structured?
10. How does admission work and what discounts exist?

## What to look for

- Clean, bright classrooms
- How children interact with teachers
- The atmosphere during breaks`),
  },
  {
    slug: "how-to-read-school-reviews", category: "school-selection", kind: "article", minutes: 4, daysAgo: 20, tags: ["reviews"],
    title: t("Мектеп пикирлерин кантип туура окуу керек", "Как правильно читать отзывы о школах", "How to read school reviews wisely"),
    excerpt: t("Бир пикирге эмес, мыйзам ченемдүүлүккө көңүл буруңуз.", "Смотрите не на один отзыв, а на закономерности.", "Look for patterns, not single opinions."),
    body: t(
`Бир пикир — бир үй-бүлөнүн тажрыйбасы. Көптөгөн пикирлерде кайталанган темалар чыныгы сүрөттү көрсөтөт.

## Эмнеге көңүл буруу керек

- Рейтингдин жанында **пикирлердин саны**
- Белгилүү бир жагдайды сүрөттөгөн **так маалымат**
- Жакшы жана жаман жактарды теңдештирген пикирлер

## EduMaps.kg пикирлерди кантип текшерет

Бардык пикирлерди модератор окуп чыгат, шектүү пикирлер жарыяланбайт. Мектептер рейтингди сатып ала албайт.`,
`Один отзыв — это опыт одной семьи. Повторяющиеся в разных отзывах темы дают реальную картину.

## На что обратить внимание

- **Количество отзывов** рядом с рейтингом
- **Конкретные факты** вместо общих эмоций
- Отзывы, в которых есть и плюсы, и минусы

## Как EduMaps.kg проверяет отзывы

Каждый отзыв читает модератор, сомнительные отзывы не публикуются. Школы не могут купить рейтинг.`,
`A single review is one family's experience. Themes that repeat across many reviews reveal the real picture.

## What to look for

- The **number of reviews** next to the rating
- **Specific details** rather than general emotion
- Reviews that balance strengths and weaknesses

## How EduMaps.kg checks reviews

Every review is read by a moderator and questionable ones are not published. Schools cannot buy ratings.`),
  },
  {
    slug: "settling-into-first-grade", category: "parenting", kind: "article", minutes: 5, daysAgo: 30, tags: ["first-grade", "routine"],
    title: t("Биринчи класска көнүүгө кантип жардам берүү керек", "Как помочь ребёнку привыкнуть к первому классу", "Helping your child settle into first grade"),
    excerpt: t("Режим, чарчоону көзөмөлдөө жана мектепке болгон жылуу мамиле.", "Режим, контроль усталости и тёплое отношение к школе.", "Routine, managing tiredness and building a warm attitude to school."),
    body: t(
`Биринчи ай көптөгөн балдар үчүн чарчоо менен коштолот. Бул нормалдуу көрүнүш.

## Жөнөкөй кадамдар

- Уктоо убактысын туруктуу кармаңыз
- Мектептен кийин эс алууга убакыт бериңиз
- «Бүгүн эмне жакшы болду?» деп сураңыз

## Качан кабатыр болуу керек

Эки-үч жуманын ичинде чарчоо кетпесе же бала мектепке барбай турганын билдирсе, мугалим менен сүйлөшүңүз.`,
`Первый месяц у многих детей проходит в усталости. Это нормально.

## Простые шаги

- Держите стабильное время сна
- Оставляйте время на отдых после школы
- Спрашивайте: «Что сегодня было хорошего?»

## Когда стоит беспокоиться

Если усталость не проходит за две–три недели или ребёнок отказывается идти в школу, поговорите с учителем.`,
`The first month leaves many children tired. That is normal.

## Simple steps

- Keep a steady bedtime
- Leave time to rest after school
- Ask, "What was good today?"

## When to worry

If tiredness doesn't ease within two to three weeks, or your child refuses to go to school, talk to the teacher.`),
  },
  {
    slug: "calm-homework-routine", category: "child-psychology", kind: "article", minutes: 5, daysAgo: 45, tags: ["homework", "habits"],
    title: t("Көз жаш жок үй тапшырмасы: тынч режим", "Домашние задания без слёз: спокойный режим", "Homework without tears: a calm routine"),
    excerpt: t("Бала өз алдынча иштөөнү үйрөнүшү үчүн эмне кылыш керек.", "Что делать, чтобы ребёнок научился работать самостоятельно.", "How to help your child learn to work independently."),
    body: t(
`Үй тапшырмасы — жоопкерчиликти үйрөнүүнүн жолу, күрөш талаасы эмес.

## Режим түзүү

1. Бир эле убакытты жана ордун белгилеңиз
2. 25 мүнөт иштеп, 5 мүнөт эс алыңыз
3. Жардам бериңиз, бирок тапшырманы балага жасап бербеңиз

## Эмне кылбаш керек

Башка балдар менен салыштырбаңыз жана ар бир катаны оңдобоңуз. Аракетти мактаңыз.`,
`Домашнее задание — это способ учиться ответственности, а не поле битвы.

## Выстраиваем режим

1. Выберите постоянное время и место
2. Работайте 25 минут, затем отдыхайте 5
3. Помогайте, но не делайте задание за ребёнка

## Чего лучше не делать

Не сравнивайте с другими детьми и не исправляйте каждую ошибку. Хвалите усилия.`,
`Homework is a way to learn responsibility, not a battlefield.

## Build a routine

1. Pick a fixed time and place
2. Work for 25 minutes, then rest for 5
3. Help, but don't do the task for your child

## What to avoid

Don't compare with other children or fix every mistake. Praise effort.`),
  },
  {
    slug: "montessori-vs-waldorf", category: "methodology-comparisons", kind: "article", minutes: 6, daysAgo: 8, tags: ["montessori", "waldorf"],
    title: t("Монтессори жана Вальдорф: кандай айырма бар", "Монтессори и Вальдорф: в чём разница", "Montessori vs Waldorf: how do they differ"),
    excerpt: t("Эки альтернативалуу ыкманын философиясы, күнүмдүк жашоосу жана ким үчүн ылайыктуу экени.", "Философия, повседневность двух альтернативных подходов и кому они подходят.", "The philosophy and daily life of two alternative approaches, and who they suit."),
    body: t(
`## Монтессори

Бала **өз тандоосу** менен даярдалган чөйрөдө үйрөнөт. Мугалим — жетекчи. Материалдар конкреттүү жана өз алдынча текшерилет.

## Вальдорф

Окутуу **ритмге, көркөм өнөргө жана оюнга** негизделет. Башталгыч мектепте бир мугалим балдарды узак убакыт коштойт.

## Салыштыруу

| | Монтессори | Вальдорф |
|---|---|---|
| Фокус | Өз алдынчалык | Фантазия жана ритм |
| Технологиялар | Орто | Кеч киргизилет |
| Топтор | Аралаш куракта | Бир куракта |

Экөөнү тең **мектептердин баракчаларынан** көрө аласыз.`,
`## Монтессори

Ребёнок учится **по собственному выбору** в подготовленной среде. Педагог — наставник. Материалы конкретны и позволяют самопроверку.

## Вальдорф

Обучение строится на **ритме, искусстве и игре**. В начальной школе один учитель долго сопровождает класс.

## Сравнение

| | Монтессори | Вальдорф |
|---|---|---|
| Фокус | Самостоятельность | Воображение и ритм |
| Технологии | Умеренно | Вводятся позже |
| Группы | Разновозрастные | Одновозрастные |

Школы обоих направлений можно найти в **каталоге**.`,
`## Montessori

Children learn through **their own choices** in a prepared environment. The teacher is a guide. Materials are concrete and self-correcting.

## Waldorf

Learning is built on **rhythm, the arts and play**. In primary school one teacher accompanies the class for years.

## Side by side

| | Montessori | Waldorf |
|---|---|---|
| Focus | Independence | Imagination and rhythm |
| Technology | Moderate | Introduced later |
| Groups | Mixed ages | Single age |

You can find schools of both kinds in the **directory**.`),
  },
  {
    slug: "edumap-launch", category: "news", kind: "article", minutes: 3, daysAgo: 1, tags: ["edumap", "news"],
    title: t("EduMaps.kg ишке кирди: Кыргызстандагы мектептерди табуунун көз карандысыз жолу", "EduMaps.kg запущен: независимый поиск школ в Кыргызстане", "EduMaps.kg is live: independent school discovery for Kyrgyzstan"),
    excerpt: t("Line.kg жараткан платформа ата-энелерге мектептерди табууга, салыштырууга жана пикир окууга жардам берет.", "Платформа Line.kg помогает родителям находить, сравнивать школы и читать отзывы.", "A platform from Line.kg helps parents find and compare schools and read reviews."),
    body: t(
`EduMaps.kg — Line.kg тарабынан иштелип чыккан жана жүргүзүлгөн долбоор.

## Эмнелерди таба аласыз

- Бардык ири шаарлардагы мектептердин каталогу
- Интерактивдүү карта
- 4 мектепке чейин салыштыруу
- Модерацияланган пикирлер
- Билим берүү борбору жана ата-энелер жамааты

## Көз карандысыздык

Рейтингдер жана тартип жарнамага көз каранды эмес. Жарнамалар ар дайым «Жарнама» деп белгиленет.`,
`EduMaps.kg — проект, разработанный и управляемый Line.kg.

## Что вы найдёте

- Каталог школ во всех крупных городах
- Интерактивную карту
- Сравнение до 4 школ
- Модерируемые отзывы
- Образовательный центр и сообщество родителей

## Независимость

Рейтинги и порядок школ не зависят от рекламы. Реклама всегда помечена как «Реклама».`,
`EduMaps.kg is a project developed and operated by Line.kg.

## What you will find

- A directory of schools in every major city
- An interactive map
- Side-by-side comparison of up to four schools
- Moderated reviews
- An Education Hub and a parent community

## Independence

Ratings and school order never depend on advertising. Ads are always labelled "Advertisement".`),
  },
];
