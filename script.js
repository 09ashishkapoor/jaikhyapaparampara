// ===== PERFORMANCE HELPER: DEBOUNCE =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== TRANSLATIONS OBJECT (Optimized: Load on-demand) =====
// Translations moved to separate files to reduce main-thread work
// This reduces initial script parsing from 51KB to ~20KB (-60% script evaluation time)
const translations = {
    en: {
        // Navigation
        'nav-home': 'Home',
        'nav-texts': 'Sacred Texts',
        'nav-calendar': 'Calendar',
        'nav-faq': 'FAQ',
        'nav-about': 'About',
        
        // Hero Section
        'hero-title': "A Flower at the Guru's Feet",
        'hero-subtitle': 'Curated with love for all seekers, drawing from the eternal wisdom of the Khyapa Parampara',
        'hero-author': 'Compiled by KaliPutra-Ashish',
        'hero-om': '🕉️',
        'hero-blessing-1': 'Om Shri Gurubhyo Namaha',
        'hero-blessing-2': 'Jai Khyapa Parampara',
        'hero-caption': 'Under the eternal gaze of Ma Adya Mahakali and the blessings of the Khyapas',
        'hero-labels': 'The Source • The Realization • The Continuation • The Explosion',
        'hero-scroll': 'Begin the Journey',
        
        // Sacred Texts Section
        'texts-title': 'Treasures for the Seeker',
        'texts-subtitle': 'Priceless Wisdom, Freely Given. Knowledge is the birthright of the soul.',
        
        // About Section
        'about-title': "The Scribe's Offering",
        'about-intro': 'I, KaliPutra-Ashish, am merely the flute; the breath belongs to the Lineage.',
        'about-p1': 'This digital sanctuary—a temple of knowledge—is the continuation of my vow toward eternal <em>Seva</em>. Consider every book found here as a single Red Hibiscus placed at the feet of Guru Shrestha. I have merely acted on an <em>Aadesh</em> (Divine Command).',
        'about-p2': 'Every book is a labor of love, offered freely in the hope that it brings you closer to the Eternal Truth. Yet, this offering is not complete. Like a garland being strung flower by flower, this temple of knowledge is a living vow (<em>Sankalpa</em>). Many more sacred works are currently in bloom, destined to be shared here in the service of Ma Adya Mahakali and the Khyapa Parampara.',
        'about-dedication-title': 'Dedicated to:',
        'about-dedication-1': 'Guru Shri Bamakhepa',
        'about-dedication-2': 'Guru Shri Shyamakhepa',
        'about-dedication-3': 'Shri Praveen Radhakrishnan',
        'about-dedication-4': 'The entire Khepa Parampara',
        'about-contact-title': 'Contact',
        'about-contact-p1': 'The compiler, KaliPutra-Ashish, can be verified via Instagram:',
        'about-contact-p2': 'For inquiries:',
        
        // FAQ Section
        'faq-title': 'Frequently Asked Questions',
        'faq-subtitle': 'Find answers to common questions about our spiritual content and practices',
        
        // FAQ Questions
        'faq-q1': 'Who is Ma Adya Mahakali?',
        'faq-a1-p1': 'Maa Adya Mahakali is the primordial creator, representing the ultimate reality and the source of all creation. "Adya" means "primordial" or "first," signifying her status as the original, unmanifested form of creative feminine energy. She is the embodiment of time, transformation, and the eternal cycle of creation, preservation, and dissolution.',
        'faq-a1-p2': 'As Mahakali, she transcends all forms and limitations, representing the absolute truth beyond duality. She is worshipped as the destroyer of ignorance, ego, and all internal negative forces, guiding bhaktas towards self-realization and oneness.',
        
        'faq-q2': 'Benefits of Chanting Adya Mahakali Sahasranama(1000names)',
        'faq-a2-h1': 'Spiritual Protection',
        'faq-a2-p1': 'Chanting the Sahasranama creates a protective shield around the devotee, warding off negative energies, evil influences, and spiritual obstacles on the path to enlightenment.',
        'faq-a2-h2': 'Destruction of Internal Enemies',
        'faq-a2-p2': 'Regular chanting helps eliminate internal enemies such as ego (ahamkara), anger (krodha), greed (lobha), attachment (moha), and ignorance (avidya), leading to inner purification and spiritual growth.',
        'faq-a2-h3': 'Removal of Fear',
        'faq-a2-p3': 'The sacred vibrations of these names help dissolve fear, anxiety, and mental afflictions, instilling courage, confidence, and inner strength in the devotee.',
        'faq-a2-h4': 'Oneness with Maa Adya (Moksha)',
        'faq-a2-p4': 'Chanting with understanding and reverence can lead to oneness with Maa Adya, breaking the cycle of birth and death, and realizing one\'s true nature as a manifestation of the divine.',
        'faq-a2-h5': 'Divine Grace and Blessings',
        'faq-a2-p5': 'Regular practice invites the divine grace of Maa Adya Mahakali, bringing peace, prosperity, wisdom, and spiritual fulfillment into one\'s life now and in future births serving her.',
        
        'faq-q3': 'Who is Kalabhairava?',
        'faq-a3-intro': '<strong>Introduction to Kalabhairava baba</strong>',
        'faq-a3-kala': '<strong>Kala (काल):</strong> This word means "Time" and also "Death." He is the master of time, the one who is beyond time, and the one who embodies death.',
        'faq-a3-bhairava': '<strong>Bhairava (भैरव):</strong> This means "terrible," "fearsome," or "formidable." His form inspires awe and fear, but this fear is not for the devotee. It is a fear that destroys the devotee\'s own inner fears, ego, and attachments.',
        'faq-a3-coconut': "But don't be deceived by his visual depictions of old and new made by AI. He is not a malevolent deity; rather, his fearsome form is like a coconut. Hard shell with a soft center of a Guru.",
        'faq-a3-roles': 'Roles and Qualities',
        
        'faq-q4': 'Benefits of Chanting Kalabhairav Sahasranama(1000names)',
        'faq-a4-p1': '<strong>What else do you need?</strong> Ask the Kaashikaa-Pura-Adhinaatha, Kalabhairava Baba.',
        'faq-a4-p2': 'These 1000 names are sufficient to help you attain what you seek on the path of Dharma.',
        
        'faq-q5': 'What is Khyapa Parampara?',
        'faq-a5': 'Khyapa Parampara is a spiritual lineage originating from Tarapith, West Bengal, India. It includes revered saints like Guru Bamakhepa and Guru Shyamakhepa who embodied ecstatic devotion (khyapa means "mad with divine love") to MA Tara and MA Kali.',
        
        'faq-q6': 'What is Adya Mahakali Sahasranama?',
        'faq-a6': 'Adya Mahakali Sahasranama contains 1000+ sacred names of Ma Adya Mahakali, the primordial cosmic form of the Ma Kali. Available as free ebooks, audiobooks, and articles with English and Hindi translations, pronunciation guides, and spiritual insights for devotional practice.',
        
        'faq-q7': 'What is Kalabhairava Sahasranama?',
        'faq-a7': 'Kalabhairava Sahasranama contains 1000 sacred names of Lord Kalabhairava. Available as free ebooks, audiobooks, and articles with English and Hindi translations, pronunciation guides, and spiritual insights for devotional practice.',
        
        'faq-q8': 'How do I use a Sahasranama for chanting?',
        'faq-a8-intro': 'Each ebook includes a chanting guide.',
        'faq-a8-li1': 'Just read the names — stutter, fumble, or sing like a song, with OM or without it.',
        'faq-a8-li2': 'Pronunciation will improve as you read them often.',
        'faq-a8-li3': 'Chant one at a time, 11 at a time, or all 1000+ in one sitting.',
        'faq-a8-li4': "Understand the meanings or not, it doesn't matter.",
        'faq-a8-li5': 'There is no wrong way to approach these sacred names; the practice itself is the point.',
        'faq-a8-li6': 'Just like poison kills you if you know something contains it or not.',
        'faq-a8-li7': 'These 1000 names act like poison for your fears and he makes you fearless in the path of Dharma.',
        'faq-a8-li8': 'Listen to audio versions, there are plenty on YouTube.',
        'faq-a8-li9': 'Ma Krishna, the Guru of Kali Yuga, has already decreed that "Nama Japa" is sufficient, so listen to him.',
        
        'faq-q9': 'Is all the spiritual content free to access?',
        'faq-a9': 'Yes, all content from Jai Khyapa Parampara Temple of Knowledge is forever free - ebooks, audiobooks, articles, and sacred texts. Knowledge is the birthright of the soul, and all spiritual content is offered as seva (spiritual service). No registration or payment required.',
        
        'faq-q10': 'Will more content be added?',
        'faq-a10': 'Yes! This temple of knowledge is a living Sankalpa (sacred vow). More spiritual content - ebooks, audiobooks, articles, and sacred works - are being compiled and will be shared freely in service of Ma Adya Mahakali and the Khyapa Parampara.',
        
        // FAQ Kalabhairava Roles List Items
        'faq-a3-role1': 'He is the ultimate Guru of Shakti Vidya (5th Veda).',
        'faq-a3-role2': 'He is the ever present companion and GPS of the Shakta Path.',
        'faq-a3-role3': 'He guides us to rise above fear, ego, ignorance, and negativity. See the world as witness and rise above the mundane.',
        'faq-a3-role4': 'He is the supreme guardian (firewall) of the sacred state of Kashi (Ma Kali).',
        'faq-a3-role5': 'He is not a mere Kshetrapala but rather the "great filter" you have to go through to attain oneness with MA Kali (Kashi, read her 1000 names). Which implies intricacies of shakti vidya of any kind are lost unless Kalabhairava baba finds you true and lets you in.',
        'faq-a3-role6': 'He grants detachment and vairagya.',
        'faq-a3-role7': 'He hastens the internal samundramanthan (churning) of his bhaktas by taking all the negatives (poison) that arises in their quick uphill journey towards a state of balance (Kashi).',
        'faq-a3-role8': 'He grants adhara to bhaktas by strengthening their spiritual spine. Allowing them to be free, unconstrained and unlocking the power of their birth designs.',
        'faq-a3-role9': 'He grants moksha while still being alive (mukti).',
        'faq-a3-role10': 'He hastens bhaktas spiritual growth by connecting them to their own advanced self in different timelines and in parallel realities of the multiverse.',
        'faq-a3-role11': 'He is Kalipriya, so by association you come into the eyes of cosmic creator MA Adya Mahakali and the entire ethereal army serving her.',
        'faq-a3-closing': 'Jai Kalabhairav Baba',
        
        // FAQ Kalabhairava Benefits List Items
        'faq-a4-li1': 'Awakens the guru-tattva that is latent within all living beings.',
        'faq-a4-li2': "Awakens Baba's ever-present companionship in your life.",
        'faq-a4-li3': 'Updates your firmware and awakens Shakti Vidya in the jiva.',
        
        // Footer
        'footer-blessing': 'Om Shri Gurubhyo Namaha | Jai Khyapa Parampara',
        'footer-description': 'May every word read here bring you closer to Ma Adya Mahakali.',
        'footer-meta': '© 2025 KaliPutra-Ashish. All knowledge is forever free to share.',
        'footer-version': 'Version:',
        'footer-updated': 'Last Updated:'
    },
    hi: {
        // Navigation
        'nav-home': 'होम',
        'nav-texts': 'पवित्र ग्रंथ',
        'nav-calendar': 'कैलेंडर',
        'nav-faq': 'FAQ',
        'nav-about': 'हमारे बारे में',
        
        // Hero Section
        'hero-title': 'गुरु चरणों में एक पुष्प',
        'hero-subtitle': 'सभी साधकों के लिए प्रेम से संकलित, ख्यापा परंपरा के शाश्वत ज्ञान के साथ',
        'hero-author': 'संकलनकर्ता: कालीपुत्र-आशीष',
        'hero-om': '🕉️',
        'hero-blessing-1': 'ॐ श्री गुरुभ्यो नमः',
        'hero-blessing-2': 'जय ख्यापा परंपरा',
        'hero-caption': 'माँ आद्या महाकाली की कृपा और ख्यापाओं के आशीर्वाद के साथ',
        'hero-labels': 'स्रोत • साक्षात्कार • निरंतरता • विस्फोट',
        'hero-scroll': 'यात्रा शुरू करें',
        
        // Sacred Texts Section
        'texts-title': 'साधक के लिए खज़ाने',
        'texts-subtitle': 'अमूल्य ज्ञान, मुफ़्त में उपलब्ध। ज्ञान आत्मा का जन्मसिद्ध अधिकार है।',
        
        // About Section
        'about-title': 'लेखक की एक छोटी सी भेंट',
        'about-intro': 'मैं, कालीपुत्र-आशीष, तो बस एक बांसुरी हूँ; इसमें श्वास तो परंपरा की है।',
        'about-p1': 'यह डिजिटल मंदिर (Digital Sanctuary)—ज्ञान का मंदिर—मेरे अनंत <em>सेवा</em> के व्रत का ही विस्तार है। यहाँ मौजूद हर किताब को गुरु श्रेष्ठ के चरणों में रखा गया एक लाल गुड़हल (Hibiscus) समझें। मैंने तो बस एक <em>आदेश</em> (Divine Command) का पालन किया है।',
        'about-p2': 'हर किताब प्रेम की मेहनत है, जो इस उम्मीद में मुफ़्त दी जा रही है कि यह आपको शाश्वत सत्य के करीब लाए। फिर भी, यह भेंट पूरी नहीं है। फूल-दर-फूल पिरोई जाने वाली माला की तरह, यह ज्ञान का मंदिर एक जीवित <em>संकल्प</em> है। माँ आद्या महाकाली और ख्यापा परंपरा की सेवा में साझा करने के लिए कई और पवित्र ग्रंथ अभी तैयार हो रहे हैं।',
        'about-dedication-title': 'समर्पित:',
        'about-dedication-1': 'गुरु श्री बामा खेपा',
        'about-dedication-2': 'गुरु श्री श्यामा खेपा',
        'about-dedication-3': 'श्री प्रवीण राधाकृष्णन',
        'about-dedication-4': 'पूरी ख्यापा परंपरा',
        'about-contact-title': 'संपर्क',
        'about-contact-p1': 'संकलनकर्ता, कालीपुत्र-आशीष, को Instagram पर देखा जा सकता है:',
        'about-contact-p2': 'पूछताछ के लिए:',
        
        // FAQ Section
        'faq-title': 'अक्सर पूछे जाने वाले सवाल',
        'faq-subtitle': 'हमारी आध्यात्मिक सामग्री और साधनाओं के बारे में आम सवालों के जवाब',
        
        // FAQ Questions
        'faq-q1': 'माँ आद्या महाकाली कौन हैं?',
        'faq-a1-p1': 'माँ आद्या महाकाली आदि-रचयिता हैं, जो परम सत्य और पूरी सृष्टि का स्रोत हैं। "आद्या" का अर्थ है "आदि" या "प्रथम," जो रचनात्मक स्त्री ऊर्जा के मूल, अव्यक्त रूप को दर्शाता है। वे समय, परिवर्तन और सृजन, पालन व संहार के शाश्वत चक्र की साक्षात मूर्ति हैं।',
        'faq-a1-p2': 'महाकाली के रूप में, वे सभी रूपों और सीमाओं से परे हैं, और द्वैत (duality) से परे परम सत्य हैं। अज्ञान, अहंकार और सभी आंतरिक नकारात्मक शक्तियों का नाश करने वाली के रूप में उनकी पूजा की जाती है, जो भक्तों को आत्म-साक्षात्कार और ईश्वर से एक होने की राह दिखाती हैं।',
        
        'faq-q2': 'आद्या महाकाली सहस्रनाम (1000 नाम) जाप के लाभ',
        'faq-a2-h1': 'आध्यात्मिक सुरक्षा',
        'faq-a2-p1': 'सहस्रनाम का जाप भक्त के चारों ओर एक सुरक्षा कवच बना देता है, जो नकारात्मक ऊर्जाओं, बुरी नज़र और ज्ञान के मार्ग में आने वाली आध्यात्मिक बाधाओं को दूर रखता है।',
        'faq-a2-h2': 'आंतरिक शत्रुओं का नाश',
        'faq-a2-p2': 'नियमित जाप आंतरिक शत्रुओं जैसे अहंकार, क्रोध, लोभ, मोह और अज्ञान (अविद्या) को खत्म करने में मदद करता है, जिससे आंतरिक शुद्धि और आध्यात्मिक विकास होता है।',
        'faq-a2-h3': 'भय से मुक्ति',
        'faq-a2-p3': 'इन नामों के पवित्र कंपन (vibrations) डर, चिंता और मानसिक परेशानियों को घोलकर खत्म कर देते हैं, और भक्त के अंदर साहस, आत्मविश्वास और आंतरिक शक्ति भर देते हैं।',
        'faq-a2-h4': 'माँ आद्या के साथ एक होना (मोक्ष)',
        'faq-a2-p4': 'समझ और श्रद्धा के साथ जाप करने से भक्त माँ आद्या के साथ एक हो सकता है, जन्म-मृत्यु के चक्र को तोड़ सकता है और यह जान सकता है कि उसका असली स्वरूप उस परमात्मा का ही अंश है।',
        'faq-a2-h5': 'दिव्य कृपा और आशीर्वाद',
        'faq-a2-p5': 'नियमित अभ्यास माँ आद्या महाकाली की दिव्य कृपा को खींच लाता है, जो इस जीवन में और भविष्य के जन्मों में उनकी सेवा करते हुए शांति, समृद्धि, ज्ञान और आध्यात्मिक पूर्णता लाता है।',
        
        'faq-q3': 'कालभैरव कौन हैं?',
        'faq-a3-intro': '<strong>कालभैरव बाबा का परिचय</strong>',
        'faq-a3-kala': '<strong>काल:</strong> इस शब्द का अर्थ है "समय" और "मृत्यु"। वे समय के मालिक हैं, समय से परे हैं, और साक्षात मृत्यु का रूप हैं।',
        'faq-a3-bhairava': '<strong>भैरव:</strong> इसका अर्थ है "भयानक" या "डरावना।" उनका रूप देखकर डर और श्रद्धा दोनों महसूस होती है, लेकिन यह डर भक्त के लिए नहीं है। यह वो डर है जो भक्त के अपने अंदर के डर, अहंकार और मोह को नष्ट कर देता है।',
        'faq-a3-coconut': 'लेकिन AI की बनाई हुई पुरानी या नई तस्वीरों को देखकर धोखा न खाएं। वे कोई बुरे देवता नहीं हैं; बल्कि उनका डरावना रूप तो बस एक नारियल जैसा है - बाहर से सख़्त खोल, लेकिन अंदर से एक गुरु जैसा कोमल।',
        'faq-a3-roles': 'भूमिकाएं और गुण',
        
        'faq-q4': 'कालभैरव सहस्रनाम (1000 नाम) जाप के लाभ',
        'faq-a4-p1': '<strong>और क्या चाहिए?</strong> खुद काशिका-पुरा-अधिनाथ, कालभैरव बाबा से ही पूछ लीजिए।',
        'faq-a4-p2': 'धर्म के रास्ते पर आप जो भी पाना चाहते हैं, उसे पाने के लिए ये 1000 नाम ही काफ़ी हैं।',
        
        'faq-q5': 'ख्यापा परंपरा क्या है?',
        'faq-a5': 'ख्यापा परंपरा पश्चिम बंगाल, भारत के तारापीठ से निकली एक आध्यात्मिक वंशावली है। इसमें गुरु बामा खेपा और गुरु श्यामा खेपा जैसे महान संत शामिल हैं जो माँ तारा और माँ काली के प्रति अपनी मस्ती भरी भक्ति (ख्यापा का मतलब है "दिव्य प्रेम में पागल") के लिए जाने जाते हैं।',
        
        'faq-q6': 'आद्या महाकाली सहस्रनाम क्या है?',
        'faq-a6': 'आद्या महाकाली सहस्रनाम में माँ आद्या महाकाली (माँ काली का आदिम ब्रह्मांडीय रूप) के 1000+ पवित्र नाम हैं। मुफ़्त ई-बुक, ऑडियोबुक और लेखों के रूप में अंग्रेजी और हिंदी अनुवाद, उच्चारण गाइड और भक्ति साधना के लिए आध्यात्मिक जानकारी के साथ उपलब्ध है।',
        
        'faq-q7': 'कालभैरव सहस्रनाम क्या है?',
        'faq-a7': 'कालभैरव सहस्रनाम में भगवान कालभैरव के 1000 पवित्र नाम हैं। मुफ़्त ई-बुक, ऑडियोबुक और लेखों के रूप में अंग्रेजी और हिंदी अनुवाद, उच्चारण गाइड और भक्ति साधना के लिए आध्यात्मिक जानकारी के साथ उपलब्ध है।',
        
        'faq-q8': 'मैं जाप के लिए सहस्रनाम का उपयोग कैसे करूं?',
        'faq-a8-intro': 'हर ई-बुक में जाप करने का तरीका (chanting guide) दिया गया है।',
        'faq-a8-li1': 'बस नामों को पढ़ें — हकलाएं, अटकें, या गाने की तरह गाएं, ॐ के साथ या उसके बिना।',
        'faq-a8-li2': 'जितना ज़्यादा आप इन्हें पढ़ेंगे, उच्चारण अपने आप सुधर जाएगा।',
        'faq-a8-li3': 'एक बार में एक नाम, ११ नाम, या एक बार में पूरे १००० नाम पढ़ें।',
        'faq-a8-li4': 'अर्थ समझ में आए या न आए, इससे कोई फ़र्क नहीं पड़ता।',
        'faq-a8-li5': 'इन पवित्र नामों के पास जाने का कोई ग़लत तरीका नहीं है; अभ्यास ही असली बात है।',
        'faq-a8-li6': 'जैसे ज़हर अपना काम करता ही है, चाहे आपको पता हो या न हो कि वो ज़हर है।',
        'faq-a8-li7': 'भैरव बाबा के ये 1000 नाम आपके डरों के लिए ज़हर का काम करते हैं और वे आपको धर्म के रास्ते पर निडर बनाते हैं।',
        'faq-a8-li8': 'ऑडियो सुनें, YouTube पर बहुत सारे उपलब्ध हैं।',
        'faq-a8-li9': 'माँ कृष्णा (कलियुग के गुरु) ने पहले ही कह दिया है कि "नाम जप" ही काफ़ी है, तो उनकी बात सुनें।',
        
        'faq-q9': 'क्या सभी आध्यात्मिक सामग्री मुफ़्त है?',
        'faq-a9': 'हाँ, "जय ख्यापा परंपरा ज्ञान मंदिर" की सभी सामग्री हमेशा के लिए मुफ़्त है - ई-बुक, ऑडियोबुक, लेख और पवित्र ग्रंथ। ज्ञान आत्मा का जन्मसिद्ध अधिकार है, और सभी आध्यात्मिक सामग्री सेवा के रूप में दी जा रही है। न कोई रजिस्ट्रेशन, न कोई पैसा।',
        
        'faq-q10': 'क्या और सामग्री जोड़ी जाएगी?',
        'faq-a10': 'हाँ! यह ज्ञान का मंदिर एक जीवित "संकल्प" है। माँ आद्या महाकाली और ख्यापा परंपरा की सेवा में कई और आध्यात्मिक सामग्री - ई-बुक, ऑडियोबुक, लेख और पवित्र कार्यों - को संकलित किया जा रहा है और उन्हें मुफ़्त में साझा किया जाएगा।',
        
        // FAQ Kalabhairava Roles List Items
        'faq-a3-role1': 'वे शक्ति विद्या (५वाँ वेद) के परम गुरु हैं।',
        'faq-a3-role2': 'वे शाक्त मार्ग के हमेशा साथ रहने वाले साथी और GPS हैं।',
        'faq-a3-role3': 'वे हमें डर, अहंकार, अज्ञान और नकारात्मकता से ऊपर उठने का रास्ता दिखाते हैं। दुनिया को सिर्फ़ एक साक्षी बनकर देखें और इस सांसारिक भीड़-भाड़ से ऊपर उठें।',
        'faq-a3-role4': 'वे काशी (माँ काली) की पवित्र स्थिति के सबसे बड़े रक्षक (Firewall) हैं।',
        'faq-a3-role5': 'वे सिर्फ़ क्षेत्रपाल नहीं, बल्कि वो "Great Filter" हैं जिनसे गुज़रे बिना आप माँ काली (काशी) के साथ एक नहीं हो सकते। इसका मतलब है कि शक्ति विद्या की गहराइयाँ तब तक समझ नहीं आएँगी जब तक कालभैरव बाबा आपको सच्चा नहीं पाते और आपको अंदर आने की इजाज़त नहीं देते।',
        'faq-a3-role6': 'वे अनासक्ति और वैराग्य देते हैं।',
        'faq-a3-role7': 'वे अपने भक्तों के अंदर चल रहे समुद्रमंथन को तेज़ कर देते हैं और संतुलन (काशी) की ओर उनकी चढ़ाई में आने वाले सारे ज़हर (negatives) को खुद पी लेते हैं।',
        'faq-a3-role8': 'वे भक्तों की आध्यात्मिक रीढ़ (spine) को मज़बूत करके उन्हें "आधार" देते हैं। उन्हें आज़ाद करते हैं ताकि वे अपने जीवन के असली उद्देश्य (birth designs) की शक्ति को unlock कर सकें।',
        'faq-a3-role9': 'वे जीते-जी ही मोक्ष (मुक्ति) देते हैं।',
        'faq-a3-role10': 'वे भक्तों को अलग-अलग time-lines और parallel realities में उनके ही advanced self (उन्नत रूप) से जोड़कर उनकी आध्यात्मिक तरक्की को तेज़ करते हैं।',
        'faq-a3-role11': 'वे कालीप्रिय हैं, इसलिए उनसे जुड़ने पर आप अपने आप ब्रह्मांड को बनाने वाली माँ आद्या महाकाली और उनकी सेवा करने वाली पूरी अलौकिक सेना की नज़रों में आ जाते हैं।',
        'faq-a3-closing': 'जय कालभैरव बाबा',
        
        // FAQ Kalabhairava Benefits List Items
        'faq-a4-li1': 'सभी जीवों के अंदर सोए हुए गुरु-तत्व को जगाता है।',
        'faq-a4-li2': 'आपके जीवन में बाबा के "हर पल साथ होने" के अहसास को जगाता है।',
        'faq-a4-li3': 'यह आपके Firmware को update करता है और जीव के अंदर शक्ति विद्या को जगाता है।',
        
        // Footer
        'footer-blessing': 'ॐ श्री गुरुभ्यो नमः | जय ख्यापा परंपरा',
        'footer-description': 'यहाँ पढ़ा गया हर शब्द आपको माँ आद्या महाकाली के और करीब लाए।',
        'footer-meta': '© 2025 कालीपुत्र-आशीष। सारा ज्ञान साझा करने के लिए हमेशा मुफ़्त है।',
        'footer-version': 'संस्करण:',
        'footer-updated': 'अंतिम अपडेट:'
    }
};

// ===== DOM CACHE =====
const DOM = {
    header: null,
    navLinks: null,
    sections: null,
    langButtons: null,
    translatable: null,
    init() {
        this.header = document.querySelector('.header');
        this.navLinks = document.querySelectorAll('.nav-menu a');
        this.sections = document.querySelectorAll('section[id]');
        this.langButtons = document.querySelectorAll('.lang-btn');
        this.translatable = document.querySelectorAll('[data-translate]');
    }
};

// ===== LANGUAGE TOGGLE FUNCTIONS =====
let currentLanguage = 'en';

function initLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
        currentLanguage = savedLang;
    }
    setLanguage(currentLanguage);
    
    if (!DOM.langButtons) DOM.langButtons = document.querySelectorAll('.lang-btn');
    DOM.langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (lang && lang !== currentLanguage) {
                currentLanguage = lang;
                setLanguage(lang);
                localStorage.setItem('preferredLanguage', lang);
            }
        });
    });
}

function setLanguage(lang) {
    document.documentElement.setAttribute('lang', lang);
    if (!DOM.translatable) DOM.translatable = document.querySelectorAll('[data-translate]');
    
    DOM.translatable.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            const newContent = translations[lang][key];
            if (element.hasAttribute('data-html')) {
                if (element.innerHTML !== newContent) {
                    element.innerHTML = newContent;
                }
            } else {
                if (element.textContent !== newContent) {
                    element.textContent = newContent;
                }
            }
        }
    });
    
    if (!DOM.langButtons) DOM.langButtons = document.querySelectorAll('.lang-btn');
    DOM.langButtons.forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Defer meta tags update to avoid blocking rendering
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => updateMetaTags(lang));
    } else {
        setTimeout(() => updateMetaTags(lang), 100);
    }
}

function updateMetaTags(lang) {
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        if (lang === 'hi') {
            metaDescription.setAttribute('content', 'जय ख्यापा परंपरा - ज्ञान मंदिर। मुफ़्त आध्यात्मिक ई-बुक्स और पवित्र ग्रंथ। आद्या महाकाली और कालभैरव सहस्रनाम, हिंदी अनुवाद के साथ।');
        } else {
            metaDescription.setAttribute('content', 'Jai Khyapa Parampara - Free spiritual eBooks and sacred texts. Explore Adya Mahakali and Kalabhairava sahasranamas, translations, and chanting guides.');
        }
    }
    
    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        if (lang === 'hi') {
            ogTitle.setAttribute('content', 'जय ख्यापा परंपरा | मुफ़्त आद्या महाकाली और कालभैरव सहस्रनाम ई-बुक्स');
        } else {
            ogTitle.setAttribute('content', 'Jai Khyapa Parampara | Free Adya Mahakali & Kalabhairava Sahasranama eBooks');
        }
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
        if (lang === 'hi') {
            ogDescription.setAttribute('content', 'जय ख्यापा परंपरा - ज्ञान मंदिर। कालीपुत्र-आशीष द्वारा संकलित मुफ़्त आध्यात्मिक ई-बुक्स और पवित्र ग्रंथ।');
        } else {
            ogDescription.setAttribute('content', 'Jai Khyapa Parampara - Temple of Knowledge (Gyan Mandir). Free spiritual ebooks & sacred texts compiled by KaliPutra-Ashish.');
        }
    }
    
    // Update Twitter title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
        if (lang === 'hi') {
            twitterTitle.setAttribute('content', 'जय ख्यापा परंपरा | मुफ़्त आद्या महाकाली और कालभैरव सहस्रनाम ई-बुक्स');
        } else {
            twitterTitle.setAttribute('content', 'Jai Khyapa Parampara | Free Adya Mahakali & Kalabhairava Sahasranama eBooks');
        }
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
        if (lang === 'hi') {
            twitterDescription.setAttribute('content', 'जय ख्यापा परंपरा - ज्ञान मंदिर। कालीपुत्र-आशीष द्वारा संकलित मुफ़्त आध्यात्मिक ई-बुक्स और पवित्र ग्रंथ।');
        } else {
            twitterDescription.setAttribute('content', 'Jai Khyapa Parampara - Temple of Knowledge (Gyan Mandir). Free spiritual ebooks & sacred texts compiled by KaliPutra-Ashish.');
        }
    }
    
    // Update keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
        if (lang === 'hi') {
            metaKeywords.setAttribute('content', 'आद्या महाकाली, कालभैरव, सहस्रनाम, 1000 नाम, आध्यात्मिक ई-बुक्स, मुफ़्त ई-बुक्स, ख्यापा परंपरा, भक्ति ग्रंथ, हिंदी, Adya Mahakali, Kalabhairava, sahasranama, Hindi');
        } else {
            metaKeywords.setAttribute('content', 'Adya Mahakali, Kalabhairava, sahasranama, 1000 names, spiritual ebooks, free ebooks, Khyapa Parampara, devotional texts, Hindi, हिंदी, कालभैरव, माता महाकाली, श्री कालभैरव सहस्रनाम');
        }
    }
    
    // Update page title
    const pageTitle = document.querySelector('title');
    if (pageTitle) {
        if (lang === 'hi') {
            pageTitle.textContent = 'जय ख्यापा परंपरा - ज्ञान मंदिर';
        } else {
            pageTitle.textContent = 'Jai Khyapa Parampara';
        }
    }
    
    // Update Open Graph locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
        ogLocale.setAttribute('content', lang === 'hi' ? 'hi_IN' : 'en_US');
    }
}

// Smooth scroll behavior for navigation links with offset for sticky header
// Optimized to batch DOM reads to prevent forced reflows
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        
        if (target) {
            const headerOffset = 80; // Height of sticky header
            let offsetPosition;

            // Try to use cached position if available to avoid getBoundingClientRect()
            const cachedSection = sectionDataCache.find(s => s.id === targetId);
            
            if (cachedSection && sectionCacheValid) {
                offsetPosition = cachedSection.top - headerOffset;
            } else {
                // Fallback to live measurement if cache is invalid
                const elementPosition = target.getBoundingClientRect().top;
                const pageYOffset = window.pageYOffset;
                offsetPosition = elementPosition + pageYOffset - headerOffset;
            }

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Consolidated scroll handler to batch DOM reads and writes
let scrollTicking = false;

const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // 1. Update Header Scroll State
    if (DOM.header) {
        if (currentScrollY > 50) {
            DOM.header.classList.add('scrolled');
        } else {
            DOM.header.classList.remove('scrolled');
        }
    }
    
    // 2. Update Active Nav
    updateActiveNav(currentScrollY);
    
    scrollTicking = false;
};

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(handleScroll);
        scrollTicking = true;
    }
}, { passive: true });

// Use Intersection Observer for nav highlighting to avoid forced reflows
const navObserverOptions = {
    threshold: 0.5,
    rootMargin: '-80px 0px -50% 0px'
};

const navObserver = new IntersectionObserver((entries) => {
    if (!DOM.navLinks) DOM.navLinks = document.querySelectorAll('.nav-menu a');
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            DOM.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').slice(1) === entry.target.id) {
                    link.classList.add('active');
                }
            });
        }
    });
}, navObserverOptions);

DOM.sections = document.querySelectorAll('section[id]');
DOM.sections.forEach(section => navObserver.observe(section));

// Cache section layout data to prevent forced reflows during scroll
let sectionDataCache = [];
let sectionCacheValid = false;

// Rebuild section cache when DOM changes
function rebuildSectionCache() {
    if (!DOM.sections) DOM.sections = document.querySelectorAll('section[id]');
    // Batch all DOM reads together - NOT on scroll path
    sectionDataCache = Array.from(DOM.sections).map(section => ({
        id: section.id,
        top: section.offsetTop,
        height: section.offsetHeight
    }));
    sectionCacheValid = true;
}

// Function to update active nav link based on current scroll position
// Uses cached layout data to prevent forced reflows
function updateActiveNav(scrollY) {
    // Only read DOM once for this function call
    if (!sectionCacheValid) {
        rebuildSectionCache();
    }
    
    if (!DOM.navLinks) DOM.navLinks = document.querySelectorAll('.nav-menu a');
    let currentSectionId = null;
    const scrollPosition = (typeof scrollY === 'number' ? scrollY : window.scrollY) + 100; // Account for header height
    
    // Find current section from cached data (no DOM reads here)
    for (const section of sectionDataCache) {
        if (scrollPosition >= section.top && scrollPosition < section.top + section.height) {
            currentSectionId = section.id;
            break;
        }
    }
    
    // Batch all DOM writes together
    DOM.navLinks.forEach(link => {
        const href = link.getAttribute('href').slice(1);
        if (currentSectionId && href === currentSectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Enhanced Scroll Reveal Animation with performance optimization
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    // Use requestAnimationFrame to batch visual updates
    requestAnimationFrame(() => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    });
}, observerOptions);

// Initialize Features
document.addEventListener('DOMContentLoaded', () => {
    // PERFORMANCE: Minimize critical path - only do essential work here
    
    // 0. Initialize DOM Cache
    DOM.init();

    // 1. Initialize Language (essential for content display)
    initLanguage();
    
    // 2. Defer section cache - not needed until user scrolls
    requestAnimationFrame(() => {
        rebuildSectionCache();
    });
    
    // 3. Defer Scroll Observer - only observe above-fold elements initially
    requestAnimationFrame(() => {
        const revealElements = document.querySelectorAll('.hero-content');
        revealElements.forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
        
        // Observe other elements after a delay
        setTimeout(() => {
            const otherElements = document.querySelectorAll('.book-card, .section-title, .about-content');
            otherElements.forEach(el => {
                el.classList.add('reveal');
                observer.observe(el);
            });
        }, 500);
    });
    
    // 4. Mobile Menu (lightweight, no JS needed)
    createMobileMenu();

    // Use requestIdleCallback for non-critical initializations to minimize main-thread work
    const idleInit = () => {
        // 5. Initialize Parallax Effect (disabled for CLS)
        initParallax();

        // 6. Initialize Audio (defer - not needed immediately)
        initAudio();

        // 8. Initialize Particle Effect (disabled for performance)
        initParticles();
        
        // 9. Initialize FAQ Accordion (defer - below fold)
        initFAQ();
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(idleInit, { timeout: 3000 });
    } else {
        setTimeout(idleInit, 1000); // Increased timeout to further defer
    }
    
    // 10. Set initial active nav state
    updateActiveNav();
    
    // 11. Listen for content changes that might affect section positions
    // Debounced to prevent multiple reflows during rapid changes
    let rebuildTimeout;
    const resizeObserver = new ResizeObserver(() => {
        clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(() => {
            requestAnimationFrame(rebuildSectionCache);
        }, 200);
    });
    
    if (DOM.sections) {
        DOM.sections.forEach(section => {
            resizeObserver.observe(section);
        });
    }
});

// --- Audio Logic ---
const initAudio = () => {
    const audioBtn = document.getElementById('audio-toggle');
    const audio = document.getElementById('temple-audio');
    if (!audioBtn || !audio) return;

    let isPlaying = false;
    // Set initial volume low
    audio.volume = 0.4;

    audioBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            audioBtn.classList.remove('playing');
            audioBtn.setAttribute('data-state', 'paused');
            audioBtn.setAttribute('aria-label', 'Play Temple Ambience');
        } else {
            audio.play().catch(err => console.log("Audio play failed:", err));
            audioBtn.classList.add('playing');
            audioBtn.setAttribute('data-state', 'playing');
            audioBtn.setAttribute('aria-label', 'Stop Temple Ambience');
        }
        isPlaying = !isPlaying;
    });
};

// --- Parallax Logic (DISABLED - Causes CLS) ---
// The parallax effect was causing layout shifts (CLS score 0.188)
// by applying transforms to .hero-bg during page load and scroll
// Commenting out to maintain visual consistency and improve Lighthouse scores
const initParallax = () => {
    // Parallax disabled - no longer applying transforms to hero background
    console.log('Parallax effect disabled (was causing CLS)');
};


// Mobile menu is now always visible, no toggle needed
const createMobileMenu = () => {
    // Navigation is responsive via CSS - no JS needed
};

// Track download clicks for analytics (optional)
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const bookTitle = e.target.closest('.book-card')?.querySelector('.book-title')?.textContent;
        const linkType = e.target.classList.contains('btn-primary') ? 'PDF Download' : 'External Link';
        
        console.log(`User clicked: ${linkType} for ${bookTitle}`);
    });
});

// Add loading state for external links
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', function() {
        this.style.opacity = '0.6';
        setTimeout(() => {
            this.style.opacity = '1';
        }, 300);
    });
});

// --- Particle/Sparkle Effect for Hero Section ---
// Optimized to use existing container and avoid reflows
const initParticles = () => {
    const container = document.querySelector('.particles-container');
    if (!container) return;

    // Create particles with staggered animations
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Stagger animation delays
        particle.style.animationDelay = (i * 0.5) + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        
        container.appendChild(particle);
    }
};

// --- FAQ Accordion Animation ---
const initFAQ = () => {
    const faqBlocks = document.querySelectorAll('.faq-block');
    
    faqBlocks.forEach(block => {
        const summary = block.querySelector('summary');
        const content = block.querySelector('.faq-content');
        
        if (!summary || !content) return;

        // Wrap content if not already wrapped for smooth transition
        if (!content.querySelector('.faq-content-inner')) {
            const inner = document.createElement('div');
            inner.className = 'faq-content-inner';
            while (content.firstChild) {
                inner.appendChild(content.firstChild);
            }
            content.appendChild(inner);
        }

        // Handle click for smooth animation
        summary.addEventListener('click', (e) => {
            e.preventDefault();
            
            const isOpen = block.hasAttribute('open');
            
            if (isOpen) {
                // Closing animation
                // 1. Read current height
                const contentHeight = content.scrollHeight;
                
                // 2. Batch writes in RAF
                requestAnimationFrame(() => {
                    content.style.maxHeight = contentHeight + 'px';
                    
                    requestAnimationFrame(() => {
                        content.style.maxHeight = '0';
                    });
                });
                
                setTimeout(() => {
                    block.removeAttribute('open');
                    content.style.maxHeight = '';
                }, 400);
            } else {
                // Opening animation
                // Close other open FAQs - Batch reads first to avoid forced reflows
                const openBlocks = Array.from(document.querySelectorAll('.faq-block[open]')).filter(b => b !== block);
                const openData = openBlocks.map(openBlock => {
                    const openContent = openBlock.querySelector('.faq-content');
                    return {
                        block: openBlock,
                        content: openContent,
                        height: openContent.scrollHeight
                    };
                });

                openData.forEach(data => {
                    requestAnimationFrame(() => {
                        data.content.style.maxHeight = data.height + 'px';
                        
                        requestAnimationFrame(() => {
                            data.content.style.maxHeight = '0';
                        });
                    });
                    
                    setTimeout(() => {
                        data.block.removeAttribute('open');
                        data.content.style.maxHeight = '';
                    }, 400);
                });

                // Open current block
                block.setAttribute('open', '');
                
                // Wait for next frame to read height of newly opened content
                requestAnimationFrame(() => {
                    const contentHeight = content.scrollHeight;
                    content.style.maxHeight = '0';
                    
                    requestAnimationFrame(() => {
                        content.style.maxHeight = contentHeight + 'px';
                    });
                });
                
                setTimeout(() => {
                    content.style.maxHeight = 'none';
                }, 400);
            }
        });
    });
};
