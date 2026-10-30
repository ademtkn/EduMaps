import type { LegalDoc, LegalKind } from "./types";

/** Placeholders: {company} {city} {email} {phone} {age} {terms} {guidelines} */
export const EN: Record<LegalKind, LegalDoc> = {
  privacy: {
    sections: [
      { id: "who", title: "1. Who we are", paragraphs: [
        "EduMaps.kg is a project developed and operated by Line.kg. The website is run by {company}, {city} (“we”, “us”). We decide why and how the personal data described here is processed.",
        "You can reach us at {email} or {phone}.",
      ] },
      { id: "collect", title: "2. What we collect", items: [
        "Account details: email address, display name, preferred language, your password (stored only as a salted hash by our authentication system) and the time and version of the terms you accepted.",
        "Content you publish: reviews (rating, your relationship to the school, text), community posts and comments, helpful votes, reports, and the schools and articles you save.",
        "Messages you send through the contact form: name, email address, topic, optional school and your message.",
        "Reports of wrong or missing school information: your message, who you are in relation to the school (visitor, parent, school staff), the optional source link and, only if you give them, your name, email address and phone number.",
        "Your opinion of EduMaps.kg, if you send one: the text, your display name and, if you choose, your role. After our team approves it, it can be shown on the home page. You can delete it at any time in “Your opinion of EduMaps.kg”, and it is deleted with your account. We may also show opinions from invited guests who agreed to it.",
        "Anonymous usage counters: the type of event (for example “school viewed”), the page or school concerned, the language and the time. For school pages this includes which part of the page was reached, roughly how long it stayed open (in ranges such as “under 10 seconds”), which part of the site the visit came from, and which contact button (WhatsApp, phone, email, website, directions) was pressed. These records contain no account, IP address or device identifier, and each school gets the same kind of figures.",
        "Technical data: your IP address is held briefly in server memory to block abuse (rate limiting) and is not saved in our database. Our hosting and infrastructure providers may keep standard server logs.",
      ], after: ["We do not collect payment details, and we do not ask for your location."] },
      { id: "why", title: "3. Why we use it", items: [
        "To create and secure your account and let you save schools, write reviews and take part in the community.",
        "To moderate reviews and posts, prevent spam and abuse, and keep the platform trustworthy.",
        "To answer your messages and requests.",
        "To understand, in aggregate, which pages are useful so that we can improve the service.",
        "To meet our legal obligations.",
      ], after: ["We rely on your consent, which you give when you create an account or send a message, and on our legitimate interest in keeping the platform safe and reliable, to the extent the legislation of the Kyrgyz Republic on personal information allows."] },
      { id: "public", title: "4. What is public", paragraphs: [
        "Your display name, the rating and text of your reviews, and your community posts and comments are visible to everyone. Your email address is never shown. Choose a display name you are comfortable with, and do not publish the names or personal details of children.",
      ] },
      { id: "cookies", title: "5. Cookies and local storage", paragraphs: ["We use only what the site needs to work. We do not use advertising or cross-site tracking cookies."], items: [
        "Session cookies set by our authentication system (their names begin with “sb-”) keep you signed in.",
        "The “NEXT_LOCALE” cookie remembers your language for one year.",
        "Your browser’s local storage keeps the list of schools you chose to compare (“edumap.compare.v1”). It never leaves your device unless you share the comparison link.",
      ], after: ["You can delete cookies and local storage in your browser settings. Signing in will then not work until you allow session cookies again."] },
      { id: "third", title: "6. Services we rely on", items: [
        "Supabase provides our database, authentication and file storage.",
        "Mapbox supplies map tiles on the map pages, so your browser contacts Mapbox when a map is shown.",
        "Search suggestions and “Schools near me”: while you type in the search box, the letters are sent to our server to suggest school and city names; they are not stored or linked to you. “Schools near me” asks your browser for your location only when you press the button. A position rounded to about one kilometre becomes part of the page address so we can sort schools by distance; we do not store it or link it to you, but like any page address it can appear in the technical logs of our server and of the hosting provider. You can say no in your browser and the list simply stays as it was.",
        "Google Maps: a school page shows the school’s Google map, loaded when the map comes close to the screen, without a button to press. Loading it sends your IP address and browser details to Google, whose own privacy policy applies. It is not loaded on other pages. “Get directions” lets you choose Google Maps or 2GIS; links to them open those services on their own sites under their own policies.",
        "WhatsApp: when you press the “WhatsApp” button on a school page, WhatsApp opens with a ready message addressed to the school’s WhatsApp number. You decide whether to send it. What you then write goes to the school through WhatsApp, not through us, and WhatsApp’s own privacy policy applies.",
        "Videos are kept on YouTube. Nothing is requested from YouTube until you press play; then YouTube may receive your IP address and set its own cookies.",
        "Documents of a school (brochures, price lists) are links to the school’s own website or to a shared drive such as Google Drive. We do not store them; opening one takes you to that service and its own privacy rules apply.",
        "Fonts are served from our own site.",
      ], after: ["Some of these providers may process data on servers outside the Kyrgyz Republic. We share only what is needed to run the service."] },
      { id: "ads", title: "7. Advertising", paragraphs: ["Advertisements on EduMaps.kg are placed by us, always labelled “Advertisement”, and are not personalised. We count impressions and clicks only as anonymous totals. Advertising never changes ratings, rankings or search results."] },
      { id: "retention", title: "8. How long we keep data", items: [
        "Account data and your content are kept while your account exists.",
        "You can delete your account yourself at any time under Dashboard, Account. This removes your account, personal data, reviews, posts, comments and saved items straight away. Backups that contain it are overwritten in the normal backup cycle.",
        "Contact messages and reports of wrong information are kept for up to 24 months after we resolve them.",
        "Anonymous usage counters are kept as totals.",
      ] },
      { id: "security", title: "9. Security", paragraphs: ["We use encrypted connections, hashed passwords, per-table access rules in the database, limited staff access and an audit log of administrator actions. No system is perfectly secure, so please use a strong, unique password."] },
      { id: "rights", title: "10. Your rights", paragraphs: ["You may ask us to tell you what personal data we hold about you, correct it, delete it, or stop processing it, and you may withdraw your consent at any time. You can change your password and email, download a copy of your data and delete your account under Dashboard, Account. For anything else, write to {email} from the address you registered with. We reply within 30 days."] },
      { id: "children", title: "11. Age", paragraphs: ["EduMaps.kg is intended for people aged {age} and over. If we learn that an account belongs to someone younger, we will delete it. Parents and guardians should not post personal details about their children."] },
      { id: "changes", title: "12. Changes", paragraphs: ["We will update this page when our practices change and show the date at the top. If a change is significant, we will ask you to accept the new version."] },
      { id: "contact", title: "13. Questions and complaints", paragraphs: ["Write to {email}. You may also contact the state authority responsible for personal data protection in the Kyrgyz Republic."] },
    ],
  },
  terms: {
    sections: [
      { id: "service", title: "1. The service", paragraphs: [
        "EduMaps.kg helps families find and compare schools in Kyrgyzstan. It is a project developed and operated by Line.kg, run by {company}. By using the site or creating an account you accept these terms and the Privacy Policy.",
        "EduMaps.kg is an information service. We are not a school, an admissions agent or an education authority, and nothing here is an offer to enrol.",
      ] },
      { id: "account", title: "2. Your account", items: [
        "You must be at least {age} years old.",
        "Give accurate information and keep one account for yourself.",
        "Keep your password secret. You are responsible for what happens under your account. Tell us at once if you suspect misuse.",
      ] },
      { id: "info", title: "3. School information", paragraphs: [
        "School profiles are compiled from the schools, public sources and our users. They can be incomplete or out of date. Profiles marked “Demo” are fictional sample content, and profiles marked “Unverified” have not been confirmed with the school. Photos may be illustrations.",
        "Always confirm tuition, admission rules, licences and other important details directly with the school before you decide. We do not guarantee the accuracy of any listing.",
      ] },
      { id: "content", title: "4. Reviews and community posts", items: [
        "Write only about your own experience and follow the {guidelines}.",
        "Every review and post is checked by a person before it is published. We may reject or remove content that breaks the rules, and we may edit it to remove personal data or prohibited wording. We do not change the meaning of your opinion or your rating.",
        "You keep ownership of what you write. You give us a free, non-exclusive licence to store, display, format and translate it on EduMaps.kg for as long as it is published. If you delete your account, your content is deleted with it.",
        "You promise that your content is yours, true to your knowledge, and does not break anyone’s rights or the law.",
      ] },
      { id: "independence", title: "5. Independence and advertising", paragraphs: [
        "Schools cannot pay for a better rating, a higher position or the removal of a review. Advertisements are always labelled “Advertisement” and never affect ratings, rankings or search results.",
      ] },
      { id: "prohibited", title: "6. What you must not do", items: [
        "Post fake, paid or incentivised reviews, or review a school you own, manage or compete with.",
        "Harass, threaten or discriminate against anyone, or publish personal data of others.",
        "Post spam, advertising or links to harmful sites.",
        "Copy the site at scale, run bots against it, or try to break or bypass its security.",
        "Use the site for anything illegal.",
      ] },
      { id: "schools", title: "7. Schools and businesses", paragraphs: ["School representatives may ask us to correct factual errors or to review content they believe breaks the {guidelines}, by writing to {email}. A review will not be removed only because it is critical. Only the EduMaps.kg team edits school pages, and every school is treated the same way. Schools can send us corrections or missing information with the “Report incorrect information” form; we verify it before we publish it."] },
      { id: "ip", title: "8. Our content", paragraphs: ["The EduMaps.kg name, logo, design and software belong to {company}. School names, logos and photos belong to their owners. You may share links to our pages. Other copying needs our written permission."] },
      { id: "links", title: "9. Other websites and maps", paragraphs: ["Links to school websites, Google Maps, 2GIS and other sites lead to services we do not control. We are not responsible for their content or practices."] },
      { id: "liability", title: "10. Availability and liability", paragraphs: ["The service is provided “as is”. We may change it or pause it for maintenance. To the extent the law of the Kyrgyz Republic permits, we are not liable for decisions you make based on the information shown, or for losses that were not reasonably foreseeable. Nothing in these terms limits liability that cannot be limited by law."] },
      { id: "suspend", title: "11. Suspension", paragraphs: ["We may restrict or close an account that breaks these terms or the {guidelines}. You can stop using EduMaps.kg at any time and may ask us to delete your account."] },
      { id: "changes", title: "12. Changes", paragraphs: ["We may update these terms. The date at the top shows the current version. If you keep using the site after a change, you accept it. Significant changes will be shown to you for acceptance."] },
      { id: "law", title: "13. Governing law", paragraphs: ["These terms are governed by the law of the Kyrgyz Republic. We will try to settle any dispute by talking first. If that fails, the competent courts of the Kyrgyz Republic decide."] },
      { id: "contact", title: "14. Contact", paragraphs: ["{company}, {city}. Email {email}, phone {phone}."] },
    ],
  },
  guidelines: {
    sections: [
      { id: "honest", title: "1. Be honest and first-hand", items: [
        "Write about what you or your child actually experienced.",
        "Choose your relationship to the school truthfully: parent, student, alumni or teacher.",
        "One review per school. Update it later if things change.",
        "No paid, traded or pressured reviews. Do not review a school you own, manage or compete with.",
        "No copied or repeated texts and no organised campaigns, whether they praise a school or attack one. Moderators reject reviews that look coordinated.",
      ] },
      { id: "respect", title: "2. Be respectful", items: [
        "Criticise the school or the service, not people.",
        "No insults, hate speech, threats, harassment or discrimination.",
        "Stick to facts. Do not accuse anyone of a crime without evidence. Report serious concerns about a child’s safety to the proper authorities.",
      ] },
      { id: "privacy", title: "3. Protect privacy", items: [
        "Do not publish the names, photos or details of children.",
        "Do not publish phone numbers, home addresses, documents or private messages of other people.",
        "Refer to staff by role (“the class teacher”) rather than by full name where you can.",
      ] },
      { id: "spam", title: "4. No spam or advertising", items: [
        "No promotions, referral links, repeated posts or copied text.",
        "Keep posts in the right category and write in Kyrgyz, Russian or English.",
      ] },
      { id: "moderation", title: "5. How moderation works", items: [
        "A person reads every review and post before it appears. New content is “pending” until then.",
        "Content that breaks these guidelines is rejected or removed, sometimes after we ask you to edit it.",
        "You can report any review, post or comment with the report button.",
        "To appeal a decision, write to {email} and explain why.",
        "To protect the community, each person can publish up to three reviews or posts per day and twenty comments per hour.",
      ] },
      { id: "consequences", title: "6. What happens if the rules are broken", paragraphs: ["We may remove content, limit your account or close it. Serious or repeated breaches, including fake reviews, lead to a permanent ban."] },
    ],
  },
};
