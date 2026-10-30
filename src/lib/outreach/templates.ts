import type { Lang } from "@/lib/i18n/config";

/** Introduction messages for schools, sent by hand (WhatsApp, email). Kept as plain text so they can be copied anywhere. */
export type OutreachInput = { school: string; url: string; signer: string };
export type OutreachMessage = { whatsapp: string; emailSubject: string; emailBody: string };

const CONTACT = "linekginfo@gmail.com · +996 502 00 19 03 (WhatsApp) · www.line.kg";
const COMPANY_LINE = "EduMaps.kg (Line LLC, Бишкек, Кыргызстан)";

const ru = ({ school, url, signer }: OutreachInput): OutreachMessage => ({
  whatsapp: [
    "Здравствуйте! Это команда EduMaps.kg — независимого справочника школ Кыргызстана.",
    `Мы подготовили страницу «${school}»: ${url}`,
    "Базовое размещение бесплатное. Отзывы проходят модерацию, а реклама никогда не влияет на оценки школ.",
    "Если в данных есть неточности, пришлите правки в ответ на это сообщение или через кнопку «Сообщить об ошибке» на странице. Мы проверим и обновим информацию.",
    "Если не хотите, чтобы школа была на сайте, напишите, и мы уберём её.",
    `${signer}, EduMaps.kg`,
  ].join("\n"),
  emailSubject: `Страница «${school}» на EduMaps.kg: проверьте данные`,
  emailBody: [
    `Уважаемый(ая) директор школы «${school}»!`,
    "",
    "EduMaps.kg — независимый справочник школ Кыргызстана на кыргызском, русском и английском языках. Родители могут сравнивать школы по городу, стоимости, языку обучения и программам, смотреть школы на карте и читать отзывы.",
    "",
    `Мы подготовили страницу вашей школы по открытым источникам: ${url}`,
    "",
    "Что важно знать:",
    "• Базовое размещение бесплатное.",
    "• Оценки формируются только из отзывов родителей и учеников, прошедших модерацию. Реклама на оценки не влияет.",
    "• Мы не редактируем страницы по запросу рекламодателей. Все школы обрабатываются одинаково.",
    "• Пока данные не подтверждены, на странице есть пометка «информация ещё не подтверждена».",
    "",
    "Что мы просим вас сделать:",
    "1. Проверьте адрес, телефон, график работы, стоимость и перечень программ.",
    "2. Пришлите исправления ответом на это письмо или через кнопку «Сообщить об ошибке» на странице. Укажите телефон или e-mail, по которому мы сможем подтвердить, что письмо от школы.",
    "3. При желании пришлите фотографии и ссылку на видео (YouTube). Фотографии детей публикуются только при наличии согласия родителей.",
    "",
    "Если вы не хотите, чтобы школа присутствовала на сайте, ответьте на это письмо, и мы удалим страницу.",
    "",
    "С уважением,",
    signer,
    COMPANY_LINE,
    CONTACT,
  ].join("\n"),
});

const kg = ({ school, url, signer }: OutreachInput): OutreachMessage => ({
  whatsapp: [
    "Саламатсызбы! Бул EduMaps.kg командасы — Кыргызстандагы мектептердин көз карандысыз маалымдамасы.",
    `«${school}» мектебинин баракчасын даярдадык: ${url}`,
    "Негизги жайгаштыруу акысыз. Пикирлер модерациядан өтөт, ал эми жарнама мектептердин баасына эч качан таасир этпейт.",
    "Маалыматта каталар болсо, ушул билдирүүгө жооп катары жөнөтүңүз же баракчадагы «Туура эмес маалымат жөнүндө кабарлоо» баскычын колдонуңуз. Биз текшерип, жаңыртабыз.",
    "Мектеп сайтта болушун каалабасаңыз, жазыңыз, биз алып салабыз.",
    `${signer}, EduMaps.kg`,
  ].join("\n"),
  emailSubject: `EduMaps.kg сайтындагы «${school}» баракчасы: маалыматты текшериңиз`,
  emailBody: [
    `«${school}» мектебинин урматтуу директору!`,
    "",
    "EduMaps.kg — Кыргызстандагы мектептердин кыргыз, орус жана англис тилдериндеги көз карандысыз маалымдамасы. Ата-энелер мектептерди шаар, төлөм, окутуу тили жана программалар боюнча салыштырып, картадан көрүп, пикирлерди окуй алышат.",
    "",
    `Мектебиңиздин баракчасын ачык булактардын негизинде даярдадык: ${url}`,
    "",
    "Билүүгө маанилүү:",
    "• Негизги жайгаштыруу акысыз.",
    "• Баалар модерациядан өткөн ата-энелер менен окуучулардын пикирлеринен гана түзүлөт. Жарнама баага таасир этпейт.",
    "• Баракчаларды жарнама берүүчүлөрдүн өтүнүчү боюнча түзөтпөйбүз. Бардык мектептерге бирдей мамиле кылабыз.",
    "• Маалымат тастыкталмайынча баракчада «маалымат азырынча тастыкталган жок» деген белги болот.",
    "",
    "Сизден суранабыз:",
    "1. Дарегин, телефонун, иш графигин, төлөмүн жана программаларын текшериңиз.",
    "2. Оңдоолорду ушул катка жооп катары же баракчадагы «Туура эмес маалымат жөнүндө кабарлоо» баскычы аркылуу жөнөтүңүз. Кат мектептен экенин тастыктай алышыбыз үчүн телефон же e-mail жазыңыз.",
    "3. Кааласаңыз, сүрөттөрдү жана видеого (YouTube) шилтеме жөнөтүңүз. Балдардын сүрөттөрү ата-энелеринин макулдугу болгондо гана жарыяланат.",
    "",
    "Мектеп сайтта болушун каалабасаңыз, ушул катка жооп бериңиз, биз баракчаны өчүрөбүз.",
    "",
    "Урмат менен,",
    signer,
    COMPANY_LINE,
    CONTACT,
  ].join("\n"),
});

const en = ({ school, url, signer }: OutreachInput): OutreachMessage => ({
  whatsapp: [
    "Hello! This is the EduMaps.kg team, an independent guide to schools in Kyrgyzstan.",
    `We have prepared a page for ${school}: ${url}`,
    "A basic listing is free. Reviews are moderated, and advertising never affects school grades.",
    "If anything is inaccurate, reply to this message or use the \"Report incorrect information\" button on the page. We will check and update it.",
    "If you would rather not be listed, tell us and we will remove it.",
    `${signer}, EduMaps.kg`,
  ].join("\n"),
  emailSubject: "Your school's page on EduMaps.kg: please check the details",
  emailBody: [
    `Dear Director of ${school},`,
    "",
    "EduMaps.kg is an independent guide to schools in Kyrgyzstan, available in Kyrgyz, Russian and English. Parents can compare schools by city, tuition, language of instruction and programmes, see them on a map and read reviews.",
    "",
    `We prepared a page for your school from public sources: ${url}`,
    "",
    "What you should know:",
    "• A basic listing is free.",
    "• Grades come only from moderated reviews by parents and students. Advertising never affects them.",
    "• We do not edit pages on behalf of advertisers. Every school is handled the same way.",
    "• Until the details are confirmed, the page carries a notice that the information has not been confirmed yet.",
    "",
    "What we ask you to do:",
    "1. Check the address, phone, school hours, tuition and programmes.",
    "2. Send corrections by replying to this email or with the \"Report incorrect information\" button on the page. Please include a phone number or email so we can confirm the message comes from the school.",
    "3. If you wish, send photos and a YouTube video link. Photos of children are published only with parental consent.",
    "",
    "If you would rather not be listed, reply to this email and we will remove the page.",
    "",
    "Kind regards,",
    signer,
    "EduMaps.kg (Line LLC, Bishkek, Kyrgyzstan)",
    CONTACT,
  ].join("\n"),
});

const TEMPLATES: Record<Lang, (input: OutreachInput) => OutreachMessage> = { ru, kg, en };

export function buildOutreach(lang: Lang, input: OutreachInput): OutreachMessage {
  return TEMPLATES[lang](input);
}
