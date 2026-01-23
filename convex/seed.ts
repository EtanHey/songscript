import { mutation } from "./_generated/server";

// Word-by-word breakdown for all Baraye lyrics
const barayeWords = [
  {
    lineNumber: 1,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "توی", transliteration: "tūye", hebrew: "טוּיֶה", english: "in the", grammarType: "preposition" },
      { persian: "کوچه", transliteration: "kūche", hebrew: "כּוּצֶ'ה", english: "alley", grammarType: "noun" },
      { persian: "رقصیدن", transliteration: "raqsidan", hebrew: "רַקְסִידַן", english: "dancing", grammarType: "verb-infinitive" }
    ]
  },
  {
    lineNumber: 2,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "ترسیدن", transliteration: "tarsidan", hebrew: "טַרְסִידַן", english: "being afraid", grammarType: "verb-infinitive" },
      { persian: "به", transliteration: "be", hebrew: "בֶּה", english: "at", grammarType: "preposition" },
      { persian: "وقت", transliteration: "vaqt", hebrew: "וַקְט", english: "time/moment", grammarType: "noun" },
      { persian: "بوسیدن", transliteration: "būsidan", hebrew: "בּוּסִידַן", english: "kissing", grammarType: "verb-infinitive" }
    ]
  },
  {
    lineNumber: 3,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "خواهرم", transliteration: "khāharam", hebrew: "חָאהַרַם", english: "my sister", grammarType: "noun-possessive" },
      { persian: "خواهرت", transliteration: "khāharet", hebrew: "חָאהַרֶת", english: "your sister", grammarType: "noun-possessive" },
      { persian: "خواهرامون", transliteration: "khāharāmūn", hebrew: "חָאהַרָמוּן", english: "our sisters", grammarType: "noun-possessive" }
    ]
  },
  {
    lineNumber: 4,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "تغییر", transliteration: "taghyir", hebrew: "תַגְ'יִיר", english: "changing", grammarType: "noun" },
      { persian: "مغزها", transliteration: "maghz-hā", hebrew: "מַגְ'זְהָא", english: "minds/brains", grammarType: "noun-plural" },
      { persian: "که", transliteration: "ke", hebrew: "כֶּה", english: "that", grammarType: "conjunction" },
      { persian: "پوسیدن", transliteration: "pūsidan", hebrew: "פּוּסִידַן", english: "have rotted", grammarType: "verb-past" }
    ]
  },
  {
    lineNumber: 5,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "شرمندگی", transliteration: "sharmandegi", hebrew: "שַׁרְמַנְדֶגִי", english: "shame", grammarType: "noun" },
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "for", grammarType: "preposition" },
      { persian: "بی", transliteration: "bi", hebrew: "בִּי", english: "without", grammarType: "prefix" },
      { persian: "پولی", transliteration: "pūli", hebrew: "פּוּלִי", english: "money", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 6,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "حسرت", transliteration: "hasrat", hebrew: "חַסְרַט", english: "longing", grammarType: "noun" },
      { persian: "یک", transliteration: "yek", hebrew: "יֶק", english: "a/one", grammarType: "determiner" },
      { persian: "زندگی", transliteration: "zendegi", hebrew: "זֶנְדֶגִי", english: "life", grammarType: "noun" },
      { persian: "معمولی", transliteration: "ma'mūli", hebrew: "מַעְמוּלִי", english: "ordinary", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 7,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "کودک", transliteration: "kūdak", hebrew: "כּוּדַכּ", english: "child", grammarType: "noun" },
      { persian: "زباله گرد", transliteration: "zobālegard", hebrew: "זוּבָּלֶגַרְד", english: "scavenger", grammarType: "noun" },
      { persian: "و", transliteration: "o", hebrew: "אוֹ", english: "and", grammarType: "conjunction" },
      { persian: "آرزوهاش", transliteration: "ārezūhāsh", hebrew: "אָרֶזוּהָאש", english: "his dreams", grammarType: "noun-possessive" }
    ]
  },
  {
    lineNumber: 8,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "این", transliteration: "in", hebrew: "אִין", english: "this", grammarType: "demonstrative" },
      { persian: "اقتصاد", transliteration: "eqtesād", hebrew: "אֶקְטֶסָאד", english: "economy", grammarType: "noun" },
      { persian: "دستوری", transliteration: "dastūri", hebrew: "דַסְטוּרִי", english: "controlled/command", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 9,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "این", transliteration: "in", hebrew: "אִין", english: "this", grammarType: "demonstrative" },
      { persian: "هوای", transliteration: "havā-ye", hebrew: "הַוָאיֶה", english: "air", grammarType: "noun" },
      { persian: "آلوده", transliteration: "ālūde", hebrew: "אָלוּדֶה", english: "polluted", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 10,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "ولیعصر", transliteration: "Vali-'asr", hebrew: "וַלִיעַסְר", english: "Valiasr", grammarType: "proper-noun" },
      { persian: "و", transliteration: "o", hebrew: "אוֹ", english: "and", grammarType: "conjunction" },
      { persian: "درختان", transliteration: "derakhtān", hebrew: "דֶרַחְטָאן", english: "trees", grammarType: "noun-plural" },
      { persian: "فرسوده", transliteration: "farsūde", hebrew: "פַרְסוּדֶה", english: "worn out/dying", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 11,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "پیروز", transliteration: "Pirūz", hebrew: "פִּירוּז", english: "Pirouz", grammarType: "proper-noun" },
      { persian: "و", transliteration: "o", hebrew: "אוֹ", english: "and", grammarType: "conjunction" },
      { persian: "احتمال", transliteration: "ehtemāl", hebrew: "אֶחְתֶמָאל", english: "possibility", grammarType: "noun" },
      { persian: "انقراضش", transliteration: "enqerāzesh", hebrew: "אֶנְקֶרָאזֶש", english: "its extinction", grammarType: "noun-possessive" }
    ]
  },
  {
    lineNumber: 12,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "سگهای", transliteration: "sag-hāye", hebrew: "סַגְהָאיֶה", english: "dogs", grammarType: "noun-plural" },
      { persian: "بی", transliteration: "bi", hebrew: "בִּי", english: "without", grammarType: "prefix" },
      { persian: "گناه", transliteration: "gonāh", hebrew: "גוּנָאה", english: "guilt/sin", grammarType: "noun" },
      { persian: "ممنوعه", transliteration: "mamnū'e", hebrew: "מַמְנוּעֶה", english: "banned", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 13,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "گریه های", transliteration: "gerye-hāye", hebrew: "גֶרְיֶהָאיֶה", english: "cries/crying", grammarType: "noun-plural" },
      { persian: "بی", transliteration: "bi", hebrew: "בִּי", english: "without", grammarType: "prefix" },
      { persian: "وقفه", transliteration: "vaqfe", hebrew: "וַקְפֶה", english: "pause/stop", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 14,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "تصویر", transliteration: "tasvir", hebrew: "טַסְוִיר", english: "image", grammarType: "noun" },
      { persian: "تکرار", transliteration: "tekrār", hebrew: "טֶכְרָאר", english: "repetition", grammarType: "noun" },
      { persian: "این", transliteration: "in", hebrew: "אִין", english: "this", grammarType: "demonstrative" },
      { persian: "لحظه", transliteration: "lahze", hebrew: "לַחְזֶה", english: "moment", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 15,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "چهره", transliteration: "chehre", hebrew: "צֶ'הְרֶה", english: "face", grammarType: "noun" },
      { persian: "ای", transliteration: "i", hebrew: "אִי", english: "a (indefinite)", grammarType: "suffix" },
      { persian: "که", transliteration: "ke", hebrew: "כֶּה", english: "that", grammarType: "conjunction" },
      { persian: "میخنده", transliteration: "mikhande", hebrew: "מִיחַנְדֶה", english: "is laughing", grammarType: "verb-present" }
    ]
  },
  {
    lineNumber: 16,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "دانش آموزا", transliteration: "dānesh-āmūzā", hebrew: "דָאנֶשְׁאָמוּזָא", english: "students", grammarType: "noun-plural" },
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "for", grammarType: "preposition" },
      { persian: "آینده", transliteration: "āyande", hebrew: "אָיַנְדֶה", english: "future", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 17,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "این", transliteration: "in", hebrew: "אִין", english: "this", grammarType: "demonstrative" },
      { persian: "بهشت", transliteration: "behesht", hebrew: "בֶּהֶשְׁט", english: "paradise", grammarType: "noun" },
      { persian: "اجباری", transliteration: "ejbāri", hebrew: "אֶג'בָּארִי", english: "forced/mandatory", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 18,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "نخبه های", transliteration: "nokhbe-hāye", hebrew: "נוֹחְבֶּהָאיֶה", english: "intellectuals/elites", grammarType: "noun-plural" },
      { persian: "زندانی", transliteration: "zendāni", hebrew: "זֶנְדָאנִי", english: "imprisoned", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 19,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "کودکان", transliteration: "kūdakān", hebrew: "כּוּדַכָּאן", english: "children", grammarType: "noun-plural" },
      { persian: "افغانی", transliteration: "Afghāni", hebrew: "אַפְגָ'אנִי", english: "Afghan", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 20,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "این", transliteration: "in", hebrew: "אִין", english: "this", grammarType: "demonstrative" },
      { persian: "همه", transliteration: "hame", hebrew: "הַמֶה", english: "all", grammarType: "pronoun" },
      { persian: "برای", transliteration: "barāye", hebrew: "בָּרָאיֶה", english: "for's", grammarType: "preposition" },
      { persian: "غیر", transliteration: "gheire", hebrew: "גֵ'ירֶה", english: "non-", grammarType: "prefix" },
      { persian: "تکراری", transliteration: "tekrāri", hebrew: "טֶכְרָארִי", english: "repetitive", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 21,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "اینهمه", transliteration: "in hame", hebrew: "אִין הַמֶה", english: "all these", grammarType: "demonstrative" },
      { persian: "شعار های", transliteration: "sho'ār-hāye", hebrew: "שׁוֹעָארְהָאיֶה", english: "slogans", grammarType: "noun-plural" },
      { persian: "تو", transliteration: "tū", hebrew: "טוּ", english: "empty", grammarType: "adjective" },
      { persian: "خالی", transliteration: "khāli", hebrew: "חָאלִי", english: "hollow", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 22,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "آوار", transliteration: "āvār", hebrew: "אָוָאר", english: "rubble", grammarType: "noun" },
      { persian: "خونه های", transliteration: "khāne-hāye", hebrew: "חָאנֶהָאיֶה", english: "houses", grammarType: "noun-plural" },
      { persian: "پوشالی", transliteration: "pūshāli", hebrew: "פּוּשָׁאלִי", english: "of straw", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 23,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "احساس", transliteration: "ehsās", hebrew: "אֶחְסָאס", english: "feeling", grammarType: "noun" },
      { persian: "آرامش", transliteration: "ārāmesh", hebrew: "אָרָאמֶש", english: "peace/calm", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 24,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "خورشید", transliteration: "khorshid", hebrew: "חוֹרְשִׁיד", english: "sun", grammarType: "noun" },
      { persian: "پس", transliteration: "pas", hebrew: "פַּס", english: "after", grammarType: "preposition" },
      { persian: "از", transliteration: "az", hebrew: "אַז", english: "from", grammarType: "preposition" },
      { persian: "شبای", transliteration: "shab-hāye", hebrew: "שַׁבְּהָאיֶה", english: "nights", grammarType: "noun-plural" },
      { persian: "طولانی", transliteration: "tūlāni", hebrew: "טוּלָאנִי", english: "long", grammarType: "adjective" }
    ]
  },
  {
    lineNumber: 25,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "قرصهای", transliteration: "qors-hāye", hebrew: "קוֹרְסְהָאיֶה", english: "pills", grammarType: "noun-plural" },
      { persian: "اعصاب", transliteration: "a'sāb", hebrew: "אַעְסָאב", english: "nerves", grammarType: "noun" },
      { persian: "و", transliteration: "o", hebrew: "אוֹ", english: "and", grammarType: "conjunction" },
      { persian: "بی", transliteration: "bi", hebrew: "בִּי", english: "without", grammarType: "prefix" },
      { persian: "خوابی", transliteration: "khābi", hebrew: "חָאבִּי", english: "sleep", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 26,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "مرد", transliteration: "mard", hebrew: "מַרְד", english: "man", grammarType: "noun" },
      { persian: "میهن", transliteration: "mihan", hebrew: "מִיהַן", english: "homeland", grammarType: "noun" },
      { persian: "آبادی", transliteration: "ābādi", hebrew: "אָבָּאדִי", english: "prosperity", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 27,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "دختری", transliteration: "dokhtari", hebrew: "דוֹחְטַרִי", english: "a girl", grammarType: "noun" },
      { persian: "که", transliteration: "ke", hebrew: "כֶּה", english: "who", grammarType: "conjunction" },
      { persian: "آرزو", transliteration: "ārezū", hebrew: "אָרֶזוּ", english: "wish", grammarType: "noun" },
      { persian: "داشت", transliteration: "dāsht", hebrew: "דָאשְׁט", english: "had", grammarType: "verb-past" },
      { persian: "پسر", transliteration: "pesar", hebrew: "פֶּסַר", english: "boy", grammarType: "noun" },
      { persian: "بود", transliteration: "būd", hebrew: "בּוּד", english: "was", grammarType: "verb-past" }
    ]
  },
  {
    lineNumber: 28,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "زن", transliteration: "zan", hebrew: "זַן", english: "woman", grammarType: "noun" },
      { persian: "زندگی", transliteration: "zendegi", hebrew: "זֶנְדֶגִי", english: "life", grammarType: "noun" },
      { persian: "آزادی", transliteration: "āzādi", hebrew: "אָזָאדִי", english: "freedom", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 29,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "آزادی", transliteration: "āzādi", hebrew: "אָזָאדִי", english: "freedom", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 30,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "آزادی", transliteration: "āzādi", hebrew: "אָזָאדִי", english: "freedom", grammarType: "noun" }
    ]
  },
  {
    lineNumber: 31,
    words: [
      { persian: "برای", transliteration: "Barāye", hebrew: "בָּרָאיֶה", english: "For", grammarType: "preposition" },
      { persian: "آزادی", transliteration: "āzādi", hebrew: "אָזָאדִי", english: "freedom", grammarType: "noun" }
    ]
  }
];

const barayeLyrics = [
  { lineNumber: 1, startTime: 14.81, endTime: 17.46, original: "برای توی کوچه رقصیدن", transliteration: "Barāye tūye kūche raqsidan", hebrew: "בָּרָאיֶה טוּיֶה כּוּצֶ'ה רַקְסִידַן", english: "For dancing in the alley", audioSnippetUrl: "/audio/baraye/baraye_001.mp3" },
  { lineNumber: 2, startTime: 17.46, endTime: 20.91, original: "برای ترسیدن به وقت بوسیدن", transliteration: "Barāye tarsidan be vaqt-e būsidan", hebrew: "בָּרָאיֶה טַרְסִידַן בֶּה וַקְטֶה בּוּסִידַן", english: "For being afraid at the moment of kissing", audioSnippetUrl: "/audio/baraye/baraye_002.mp3" },
  { lineNumber: 3, startTime: 20.91, endTime: 24.63, original: "برای خواهرم خواهرت خواهرامون", transliteration: "Barāye khāharam khāharet khāharāmūn", hebrew: "בָּרָאיֶה חָאהַרַם חָאהַרֶת חָאהַרָמוּן", english: "For my sister, your sister, our sisters", audioSnippetUrl: "/audio/baraye/baraye_003.mp3" },
  { lineNumber: 4, startTime: 24.63, endTime: 28.61, original: "برای تغییر مغزها که پوسیدن", transliteration: "Barāye taghyir-e maghz-hā ke pūsidan", hebrew: "בָּרָאיֶה תַגְ'יִירֶה מַגְ'זְהָא כֶּה פּוּסִידַן", english: "For changing the minds that have rotted", audioSnippetUrl: "/audio/baraye/baraye_004.mp3" },
  { lineNumber: 5, startTime: 28.61, endTime: 32.33, original: "برای شرمندگی، برای بی پولی", transliteration: "Barāye sharmandegi, Barāye bi-pūli", hebrew: "בָּרָאיֶה שַׁרְמַנְדֶגִי, בָּרָאיֶה בִּיפּוּלִי", english: "For shame, for being penniless", audioSnippetUrl: "/audio/baraye/baraye_005.mp3" },
  { lineNumber: 6, startTime: 32.33, endTime: 35.78, original: "برای حسرت یک زندگی معمولی", transliteration: "Barāye hasrat-e yek zendegi-ye ma'mūli", hebrew: "בָּרָאיֶה חַסְרַטֶה יֶק זֶנְדֶגִיֶה מַעְמוּלִי", english: "For the longing for an ordinary life", audioSnippetUrl: "/audio/baraye/baraye_006.mp3" },
  { lineNumber: 7, startTime: 35.78, endTime: 39.50, original: "برای کودک زباله گرد و آرزوهاش", transliteration: "Barāye kūdak-e zobālegard o ārezūhāsh", hebrew: "בָּרָאיֶה כּוּדַכֶּה זוּבָּלֶגַרְד אוֹ אָרֶזוּהָאש", english: "For the scavenger child and his dreams", audioSnippetUrl: "/audio/baraye/baraye_007.mp3" },
  { lineNumber: 8, startTime: 39.50, endTime: 43.22, original: "برای این اقتصاد دستوری", transliteration: "Barāye in eqtesād-e dastūri", hebrew: "בָּרָאיֶה אִין אֶקְטֶסָאדֶה דַסְטוּרִי", english: "For this controlled economy", audioSnippetUrl: "/audio/baraye/baraye_008.mp3" },
  { lineNumber: 9, startTime: 43.22, endTime: 46.94, original: "برای این هوای آلوده", transliteration: "Barāye in havā-ye ālūde", hebrew: "בָּרָאיֶה אִין הַוָאיֶה אָלוּדֶה", english: "For this polluted air", audioSnippetUrl: "/audio/baraye/baraye_009.mp3" },
  { lineNumber: 10, startTime: 46.94, endTime: 50.66, original: "برای ولیعصر و درختان فرسوده", transliteration: "Barāye Vali-'asr o derakht-hāye farsūde", hebrew: "בָּרָאיֶה וַלִיעַסְר אוֹ דֶרַחְטְהָאיֶה פַרְסוּדֶה", english: "For Valiasr and its dying trees", audioSnippetUrl: "/audio/baraye/baraye_010.mp3" },
  { lineNumber: 11, startTime: 50.66, endTime: 54.38, original: "برای پیروز و احتمال انقراضش", transliteration: "Barāye Pirūz o ehtemāl-e enqerāzesh", hebrew: "בָּרָאיֶה פִּירוּז אוֹ אֶחְתֶמָאלֶה אֶנְקֶרָאזֶש", english: "For Pirouz and the possibility of its extinction", audioSnippetUrl: "/audio/baraye/baraye_011.mp3" },
  { lineNumber: 12, startTime: 54.38, endTime: 58.10, original: "برای سگهای بی گناه ممنوعه", transliteration: "Barāye sag-hāye bi-gonāh-e mamnū'e", hebrew: "בָּרָאיֶה סַגְהָאיֶה בִּיגוּנָאהֶה מַמְנוּעֶה", english: "For the innocent dogs that are banned", audioSnippetUrl: "/audio/baraye/baraye_012.mp3" },
  { lineNumber: 13, startTime: 58.10, endTime: 61.81, original: "برای گریه های بی وقفه", transliteration: "Barāye gerye-hāye bi-vaqfe", hebrew: "בָּרָאיֶה גֶרְיֶהָאיֶה בִּיוַקְפֶה", english: "For the endless crying", audioSnippetUrl: "/audio/baraye/baraye_013.mp3" },
  { lineNumber: 14, startTime: 61.81, endTime: 65.30, original: "برای تصویر تکرار این لحظه", transliteration: "Barāye tasvir-e tekrār-e in lahze", hebrew: "בָּרָאיֶה טַסְוִירֶה טֶכְרָארֶה אִין לַחְזֶה", english: "For the image of repeating this moment", audioSnippetUrl: "/audio/baraye/baraye_014.mp3" },
  { lineNumber: 15, startTime: 65.30, endTime: 69.03, original: "برای چهره ای که میخنده", transliteration: "Barāye chehre-'i ke mikhande", hebrew: "בָּרָאיֶה צֶ'הְרֶאִי כֶּה מִיחַנְדֶה", english: "For a face that is laughing", audioSnippetUrl: "/audio/baraye/baraye_015.mp3" },
  { lineNumber: 16, startTime: 69.03, endTime: 72.75, original: "برای دانش آموزا برای آینده", transliteration: "Barāye dānesh-āmūz-hā, Barāye āyande", hebrew: "בָּרָאיֶה דָאנֶשְׁאָמוּזְהָא, בָּרָאיֶה אָיַנְדֶה", english: "For the students, for the future", audioSnippetUrl: "/audio/baraye/baraye_016.mp3" },
  { lineNumber: 17, startTime: 72.75, endTime: 77.27, original: "برای این بهشت اجباری", transliteration: "Barāye in behesht-e ejbāri", hebrew: "בָּרָאיֶה אִין בֶּהֶשְׁטֶה אֶג'בָּארִי", english: "For this forced paradise", audioSnippetUrl: "/audio/baraye/baraye_017.mp3" },
  { lineNumber: 18, startTime: 77.0, endTime: 80.5, original: "برای نخبه های زندانی", transliteration: "Barāye nokhbe-hāye zendāni", hebrew: "בָּרָאיֶה נוֹחְבֶּהָאיֶה זֶנְדָאנִי", english: "For the imprisoned intellectuals", audioSnippetUrl: "/audio/baraye/baraye_018.mp3" },
  { lineNumber: 19, startTime: 80.0, endTime: 83.5, original: "برای کودکان افغانی", transliteration: "Barāye kūdakān-e Afghāni", hebrew: "בָּרָאיֶה כּוּדַכָּאנֶה אַפְגָ'אנִי", english: "For the Afghan children", audioSnippetUrl: "/audio/baraye/baraye_019.mp3" },
  { lineNumber: 20, startTime: 87.7, endTime: 91.0, original: "برای این همه برای غیر تکراری", transliteration: "Barāye in hame barāye gheire tekrāri", hebrew: "בָּרָאיֶה אִין הַמֶה בָּרָאיֶה גֵ'ירֶה טֶכְרָארִי", english: "For all these 'for's that are not repetitive", audioSnippetUrl: "/audio/baraye/baraye_020.mp3" },
  { lineNumber: 21, startTime: 91.0, endTime: 94.5, original: "برای اینهمه شعار های تو خالی", transliteration: "Barāye in hame sho'ār-hāye tū-khāli", hebrew: "בָּרָאיֶה אִין הַמֶה שׁוֹעָארְהָאיֶה טוּחָאלִי", english: "For all these empty slogans", audioSnippetUrl: "/audio/baraye/baraye_021.mp3" },
  { lineNumber: 22, startTime: 94.5, endTime: 98.2, original: "برای آوار خونه های پوشالی", transliteration: "Barāye āvār-e khāne-hāye pūshāli", hebrew: "בָּרָאיֶה אָוָארֶה חָאנֶהָאיֶה פּוּשָׁאלִי", english: "For the rubble of houses made of straw", audioSnippetUrl: "/audio/baraye/baraye_022.mp3" },
  { lineNumber: 23, startTime: 98.2, endTime: 102.0, original: "برای احساس آرامش", transliteration: "Barāye ehsās-e ārāmesh", hebrew: "בָּרָאיֶה אֶחְסָאסֶה אָרָאמֶש", english: "For the feeling of peace", audioSnippetUrl: "/audio/baraye/baraye_023.mp3" },
  { lineNumber: 24, startTime: 102.0, endTime: 105.7, original: "برای خورشید پس از شبای طولانی", transliteration: "Barāye khorshid pas az shab-hāye tūlāni", hebrew: "בָּרָאיֶה חוֹרְשִׁיד פַּס אַז שַׁבְּהָאיֶה טוּלָאנִי", english: "For the sun after the long nights", audioSnippetUrl: "/audio/baraye/baraye_024.mp3" },
  { lineNumber: 25, startTime: 105.7, endTime: 109.4, original: "برای قرصهای اعصاب و بی خوابی", transliteration: "Barāye qors-hāye a'sāb o bi-khābi", hebrew: "בָּרָאיֶה קוֹרְסְהָאיֶה אַעְסָאב אוֹ בִּיחָאבִּי", english: "For the nerve pills and insomnia", audioSnippetUrl: "/audio/baraye/baraye_025.mp3" },
  { lineNumber: 26, startTime: 109.4, endTime: 113.1, original: "برای مـرد، میهن، آبادی", transliteration: "Barāye mard, mihan, ābādi", hebrew: "בָּרָאיֶה מַרְד, מִיהַן, אָבָּאדִי", english: "For man, homeland, prosperity", audioSnippetUrl: "/audio/baraye/baraye_026.mp3" },
  { lineNumber: 27, startTime: 113.1, endTime: 123.0, original: "برای دختری که آرزو داشت پسر بود", transliteration: "Barāye dokhtari ke ārezū dāsht pesar būd", hebrew: "בָּרָאיֶה דוֹחְטַרִי כֶּה אָרֶזוּ דָאשְׁט פֶּסַר בּוּד", english: "For the girl who wished she was a boy", audioSnippetUrl: "/audio/baraye/baraye_027.mp3" },
  { lineNumber: 28, startTime: 123.0, endTime: 130.5, original: "برای زن، زندگی، آزادی", transliteration: "Barāye zan, zendegi, āzādi", hebrew: "בָּרָאיֶה זַן, זֶנְדֶגִי, אָזָאדִי", english: "For woman, life, freedom", audioSnippetUrl: "/audio/baraye/baraye_028.mp3" },
  { lineNumber: 29, startTime: 130.5, endTime: 137.8, original: "بــــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom", audioSnippetUrl: "/audio/baraye/baraye_029.mp3" },
  { lineNumber: 30, startTime: 137.8, endTime: 145.0, original: "بـــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom", audioSnippetUrl: "/audio/baraye/baraye_030.mp3" },
  { lineNumber: 31, startTime: 145.0, endTime: 151.46, original: "بـــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom", audioSnippetUrl: "/audio/baraye/baraye_031.mp3" },
];

export const seedBaraye = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if Baraye already exists (try new youtubeId first, then old)
    let existingSong = await ctx.db
      .query("songs")
      .filter((q) => q.eq(q.field("youtubeId"), "0th9_v-BbUI"))
      .first();

    // Also check for the old youtubeId
    if (!existingSong) {
      existingSong = await ctx.db
        .query("songs")
        .filter((q) => q.eq(q.field("youtubeId"), "xLvUEF2zpj8"))
        .first();
    }

    if (existingSong) {
      // Song exists - update song with new youtubeId and videoUrl
      await ctx.db.patch(existingSong._id, {
        youtubeId: "0th9_v-BbUI",
        videoUrl: "/video/baraye/baraye.mp4",
      });

      // Update existing lyrics with audio URLs
      const existingLyrics = await ctx.db
        .query("lyrics")
        .withIndex("by_song", (q) => q.eq("songId", existingSong._id))
        .collect();

      let updatedCount = 0;
      for (const existingLyric of existingLyrics) {
        const newLyricData = barayeLyrics.find(
          (l) => l.lineNumber === existingLyric.lineNumber
        );
        if (newLyricData && newLyricData.audioSnippetUrl) {
          await ctx.db.patch(existingLyric._id, {
            audioSnippetUrl: newLyricData.audioSnippetUrl,
          });
          updatedCount++;
        }
      }

      return {
        message: "Baraye song updated with new video and audio URLs",
        songId: existingSong._id,
        updatedCount,
        updatedFields: ["youtubeId", "videoUrl"],
      };
    }

    // Create the song
    const songId = await ctx.db.insert("songs", {
      title: "Baraye (برای)",
      artist: "Shervin Hajipour",
      youtubeId: "0th9_v-BbUI",
      sourceLanguage: "persian",
      createdAt: Date.now(),
      videoUrl: "/video/baraye/baraye.mp4",
    });

    // Create all lyrics
    for (const lyric of barayeLyrics) {
      await ctx.db.insert("lyrics", {
        songId,
        ...lyric,
      });
    }

    return { message: "Baraye seeded successfully", songId, lyricsCount: barayeLyrics.length };
  },
});

// Seed word data for Baraye song
export const seedBarayeWords = mutation({
  args: {},
  handler: async (ctx) => {
    // Find Baraye song
    const song = await ctx.db
      .query("songs")
      .filter((q) => q.eq(q.field("youtubeId"), "0th9_v-BbUI"))
      .first();

    if (!song) {
      return { error: "Baraye song not found. Run seedBaraye first." };
    }

    // Check if words already exist for this song
    const existingWords = await ctx.db
      .query("words")
      .withIndex("by_song_line", (q) => q.eq("songId", song._id))
      .first();

    if (existingWords) {
      // Delete existing words and re-insert
      const allExistingWords = await ctx.db
        .query("words")
        .withIndex("by_song_line", (q) => q.eq("songId", song._id))
        .collect();

      for (const word of allExistingWords) {
        await ctx.db.delete(word._id);
      }
    }

    // Insert all word data
    let totalWords = 0;
    for (const line of barayeWords) {
      for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
        const word = line.words[wordIndex];
        await ctx.db.insert("words", {
          songId: song._id,
          lineNumber: line.lineNumber,
          wordIndex,
          persian: word.persian,
          transliteration: word.transliteration,
          hebrew: word.hebrew,
          english: word.english,
          grammarType: word.grammarType,
        });
        totalWords++;
      }
    }

    return {
      message: "Baraye words seeded successfully",
      songId: song._id,
      totalWords,
      totalLines: barayeWords.length,
    };
  },
});
