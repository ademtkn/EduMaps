-- Reference data every installation needs: site languages, administrative geography and content taxonomies.

insert into public.languages (code, name, native_name, html_lang, is_enabled, is_default, sort_order) values
  ('kg', 'Kyrgyz', 'Кыргызча', 'ky', true, true, 1),
  ('ru', 'Russian', 'Русский', 'ru', true, false, 2),
  ('en', 'English', 'English', 'en', true, false, 3);

insert into public.provinces (slug, name, description, sort_order) values
  ('bishkek', '{"kg":"Бишкек шаары","ru":"город Бишкек","en":"Bishkek City"}',
    '{"kg":"Кыргызстандын борбору жана эң ири билим берүү борбору.","ru":"Столица Кыргызстана и крупнейший образовательный центр страны.","en":"The capital of Kyrgyzstan and the country''s largest education hub."}', 1),
  ('chuy', '{"kg":"Чүй облусу","ru":"Чуйская область","en":"Chuy Region"}',
    '{"kg":"Бишкекти курчап турган өнүккөн аймак.","ru":"Развитый регион вокруг Бишкека.","en":"The developed region surrounding Bishkek."}', 2),
  ('issyk-kul', '{"kg":"Ысык-Көл облусу","ru":"Иссык-Кульская область","en":"Issyk-Kul Region"}',
    '{"kg":"Ысык-Көлдүн жээгиндеги аймак.","ru":"Регион на берегах озера Иссык-Куль.","en":"The region on the shores of Lake Issyk-Kul."}', 3),
  ('naryn', '{"kg":"Нарын облусу","ru":"Нарынская область","en":"Naryn Region"}',
    '{"kg":"Тоолуу борбордук аймак.","ru":"Горный центральный регион.","en":"The mountainous central region."}', 4),
  ('talas', '{"kg":"Талас облусу","ru":"Таласская область","en":"Talas Region"}',
    '{"kg":"Түндүк-батыштагы тарыхый аймак.","ru":"Исторический регион на северо-западе.","en":"The historic region in the north-west."}', 5),
  ('jalal-abad', '{"kg":"Жалал-Абад облусу","ru":"Джалал-Абадская область","en":"Jalal-Abad Region"}',
    '{"kg":"Түштүк-батыштагы чоң аймак.","ru":"Крупный регион на юго-западе.","en":"A large region in the south-west."}', 6),
  ('osh', '{"kg":"Ош облусу","ru":"Ошская область","en":"Osh Region"}',
    '{"kg":"Түштүк борбору жана Фергана өрөөнүнүн аймагы.","ru":"Южная столица и регион Ферганской долины.","en":"The southern capital and the Fergana Valley region."}', 7),
  ('batken', '{"kg":"Баткен облусу","ru":"Баткенская область","en":"Batken Region"}',
    '{"kg":"Түштүк-батыш чек арадагы аймак.","ru":"Приграничный регион на юго-западе.","en":"The south-western border region."}', 8);

insert into public.cities (province_id, slug, name, description, lat, lng, zoom, sort_order)
select p.id, c.slug, c.name::jsonb, c.description::jsonb, c.lat, c.lng, c.zoom, c.sort_order
from (values
  ('bishkek', 'bishkek', '{"kg":"Бишкек","ru":"Бишкек","en":"Bishkek"}',
    '{"kg":"Борбор шаардагы мектептер: мамлекеттик, жеке жана эл аралык.","ru":"Школы столицы: государственные, частные и международные.","en":"Schools of the capital: public, private and international."}', 42.874600, 74.569800, 11.5, 1),
  ('osh', 'osh', '{"kg":"Ош","ru":"Ош","en":"Osh"}',
    '{"kg":"Түштүк борборунун мектептери.","ru":"Школы южной столицы.","en":"Schools of the southern capital."}', 40.528300, 72.798500, 12, 2),
  ('jalal-abad', 'jalal-abad', '{"kg":"Жалал-Абад","ru":"Джалал-Абад","en":"Jalal-Abad"}',
    '{"kg":"Жалал-Абад шаарындагы мектептер.","ru":"Школы города Джалал-Абад.","en":"Schools of Jalal-Abad city."}', 40.933300, 72.983300, 12, 3),
  ('issyk-kul', 'karakol', '{"kg":"Каракол","ru":"Каракол","en":"Karakol"}',
    '{"kg":"Ысык-Көл облусунун борборундагы мектептер.","ru":"Школы центра Иссык-Кульской области.","en":"Schools of the Issyk-Kul regional centre."}', 42.490700, 78.393600, 12, 4),
  ('chuy', 'tokmok', '{"kg":"Токмок","ru":"Токмок","en":"Tokmok"}',
    '{"kg":"Чүй өрөөнүндөгү Токмок шаарынын мектептери.","ru":"Школы города Токмок в Чуйской долине.","en":"Schools of Tokmok in the Chuy Valley."}', 42.841900, 75.301500, 12, 5),
  ('naryn', 'naryn', '{"kg":"Нарын","ru":"Нарын","en":"Naryn"}',
    '{"kg":"Нарын шаарындагы мектептер.","ru":"Школы города Нарын.","en":"Schools of Naryn city."}', 41.428700, 75.991100, 12, 6),
  ('talas', 'talas', '{"kg":"Талас","ru":"Талас","en":"Talas"}',
    '{"kg":"Талас шаарындагы мектептер.","ru":"Школы города Талас.","en":"Schools of Talas city."}', 42.522800, 72.242800, 12, 7)
) as c(province_slug, slug, name, description, lat, lng, zoom, sort_order)
join public.provinces p on p.slug = c.province_slug;

insert into public.article_categories (slug, name, description, sort_order) values
  ('education-systems', '{"kg":"Билим берүү системалары","ru":"Системы образования","en":"Education Systems"}',
    '{"kg":"Улуттук жана эл аралык программалар кандай иштейт.","ru":"Как устроены национальные и международные программы.","en":"How national and international curricula work."}', 1),
  ('parenting', '{"kg":"Ата-эне тарбиясы","ru":"Воспитание","en":"Parenting"}',
    '{"kg":"Бала тарбиясы боюнча практикалык кеңештер.","ru":"Практические советы по воспитанию детей.","en":"Practical advice for raising children."}', 2),
  ('school-selection', '{"kg":"Мектеп тандоо","ru":"Выбор школы","en":"School Selection"}',
    '{"kg":"Туура мектепти тандоого жардам берген колдонмолор.","ru":"Руководства, которые помогают выбрать подходящую школу.","en":"Guides that help you choose the right school."}', 3),
  ('child-psychology', '{"kg":"Баланын психологиясы","ru":"Детская психология","en":"Child Psychology"}',
    '{"kg":"Баланын өнүгүүсү жана эмоционалдык ден соолугу.","ru":"Развитие ребёнка и эмоциональное здоровье.","en":"Child development and emotional wellbeing."}', 4),
  ('news', '{"kg":"Жаңылыктар","ru":"Новости","en":"News"}',
    '{"kg":"Билим берүү тармагындагы жаңылыктар.","ru":"Новости сферы образования.","en":"News from the education sector."}', 5),
  ('methodology-comparisons', '{"kg":"Методикаларды салыштыруу","ru":"Сравнение методик","en":"Methodology Comparisons"}',
    '{"kg":"Монтессори, Вальдорф жана башка ыкмалардын айырмасы.","ru":"Чем отличаются Монтессори, Вальдорф и другие подходы.","en":"How Montessori, Waldorf and other approaches differ."}', 6);

insert into public.community_categories (slug, name, description, sort_order) values
  ('preschool', '{"kg":"Мектепке чейинки билим","ru":"Дошкольное образование","en":"Preschool"}',
    '{"kg":"Бала бакча жана мектепке даярдык.","ru":"Детские сады и подготовка к школе.","en":"Kindergartens and school readiness."}', 1),
  ('elementary', '{"kg":"Башталгыч класстар","ru":"Начальная школа","en":"Elementary"}',
    '{"kg":"1–4-класстар боюнча суроолор жана тажрыйба.","ru":"Вопросы и опыт по 1–4 классам.","en":"Questions and experience for grades 1–4."}', 2),
  ('middle-school', '{"kg":"Орто класстар","ru":"Средняя школа","en":"Middle School"}',
    '{"kg":"5–9-класстар жана өспүрүмдүк куракка өтүү.","ru":"5–9 классы и подростковый возраст.","en":"Grades 5–9 and the teenage years."}', 3),
  ('high-school', '{"kg":"Жогорку класстар","ru":"Старшая школа","en":"High School"}',
    '{"kg":"10–11-класстар, ЖРТ жана университетке даярдык.","ru":"10–11 классы, ОРТ и подготовка к университету.","en":"Grades 10–11, exams and university preparation."}', 4),
  ('special-education', '{"kg":"Атайын билим берүү","ru":"Специальное образование","en":"Special Education"}',
    '{"kg":"Инклюзивдүү жана атайын билим берүү.","ru":"Инклюзивное и специальное образование.","en":"Inclusive and special needs education."}', 5),
  ('abroad-education', '{"kg":"Чет өлкөдө билим алуу","ru":"Обучение за рубежом","en":"Abroad Education"}',
    '{"kg":"Чет өлкөдө окуу, стипендиялар жана документтер.","ru":"Учёба за границей, стипендии и документы.","en":"Studying abroad, scholarships and paperwork."}', 6);
