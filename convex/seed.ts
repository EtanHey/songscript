import { mutation } from "./_generated/server";

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
  { lineNumber: 18, startTime: 77.27, endTime: 83.94, original: "برای نخبه های زندانی", transliteration: "Barāye nokhbe-hāye zendāni", hebrew: "בָּרָאיֶה נוֹחְבֶּהָאיֶה זֶנְדָאנִי", english: "For the imprisoned intellectuals", audioSnippetUrl: "/audio/baraye/baraye_018.mp3" },
  { lineNumber: 19, startTime: 83.94, endTime: 84.47, original: "برای کودکان افغانی", transliteration: "Barāye kūdakān-e Afghāni", hebrew: "בָּרָאיֶה כּוּדַכָּאנֶה אַפְגָ'אנִי", english: "For the Afghan children", audioSnippetUrl: "/audio/baraye/baraye_019.mp3" },
  { lineNumber: 20, startTime: 84.47, endTime: 87.39, original: "برای این همه برای غیر تکراری", transliteration: "Barāye in hame barāye gheire tekrāri", hebrew: "בָּרָאיֶה אִין הַמֶה בָּרָאיֶה גֵ'ירֶה טֶכְרָארִי", english: "For all these 'for's that are not repetitive", audioSnippetUrl: "/audio/baraye/baraye_020.mp3" },
  { lineNumber: 21, startTime: 87.39, endTime: 91.38, original: "برای اینهمه شعار های تو خالی", transliteration: "Barāye in hame sho'ār-hāye tū-khāli", hebrew: "בָּרָאיֶה אִין הַמֶה שׁוֹעָארְהָאיֶה טוּחָאלִי", english: "For all these empty slogans", audioSnippetUrl: "/audio/baraye/baraye_021.mp3" },
  { lineNumber: 22, startTime: 91.38, endTime: 94.83, original: "برای آوار خونه های پوشالی", transliteration: "Barāye āvār-e khāne-hāye pūshāli", hebrew: "בָּרָאיֶה אָוָארֶה חָאנֶהָאיֶה פּוּשָׁאלִי", english: "For the rubble of houses made of straw", audioSnippetUrl: "/audio/baraye/baraye_022.mp3" },
  { lineNumber: 23, startTime: 94.83, endTime: 98.55, original: "برای احساس آرامش", transliteration: "Barāye ehsās-e ārāmesh", hebrew: "בָּרָאיֶה אֶחְסָאסֶה אָרָאמֶש", english: "For the feeling of peace", audioSnippetUrl: "/audio/baraye/baraye_023.mp3" },
  { lineNumber: 24, startTime: 98.55, endTime: 102.27, original: "برای خورشید پس از شبای طولانی", transliteration: "Barāye khorshid pas az shab-hāye tūlāni", hebrew: "בָּרָאיֶה חוֹרְשִׁיד פַּס אַז שַׁבְּהָאיֶה טוּלָאנִי", english: "For the sun after the long nights", audioSnippetUrl: "/audio/baraye/baraye_024.mp3" },
  { lineNumber: 25, startTime: 102.27, endTime: 105.99, original: "برای قرصهای اعصاب و بی خوابی", transliteration: "Barāye qors-hāye a'sāb o bi-khābi", hebrew: "בָּרָאיֶה קוֹרְסְהָאיֶה אַעְסָאב אוֹ בִּיחָאבִּי", english: "For the nerve pills and insomnia", audioSnippetUrl: "/audio/baraye/baraye_025.mp3" },
  { lineNumber: 26, startTime: 105.99, endTime: 109.71, original: "برای مـرد، میهن، آبادی", transliteration: "Barāye mard, mihan, ābādi", hebrew: "בָּרָאיֶה מַרְד, מִיהַן, אָבָּאדִי", english: "For man, homeland, prosperity", audioSnippetUrl: "/audio/baraye/baraye_026.mp3" },
  { lineNumber: 27, startTime: 109.71, endTime: 113.43, original: "برای دختری که آرزو داشت پسر بود", transliteration: "Barāye dokhtari ke ārezū dāsht pesar būd", hebrew: "בָּרָאיֶה דוֹחְטַרִי כֶּה אָרֶזוּ דָאשְׁט פֶּסַר בּוּד", english: "For the girl who wished she was a boy", audioSnippetUrl: "/audio/baraye/baraye_027.mp3" },
  { lineNumber: 28, startTime: 113.43, endTime: 123.56, original: "برای زن، زندگی، آزادی", transliteration: "Barāye zan, zendegi, āzādi", hebrew: "בָּרָאיֶה זַן, זֶנְדֶגִי, אָזָאדִי", english: "For woman, life, freedom", audioSnippetUrl: "/audio/baraye/baraye_028.mp3" },
  { lineNumber: 29, startTime: 123.56, endTime: 130.81, original: "بــــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom", audioSnippetUrl: "/audio/baraye/baraye_029.mp3" },
  { lineNumber: 30, startTime: 130.81, endTime: 138.15, original: "بـــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom", audioSnippetUrl: "/audio/baraye/baraye_030.mp3" },
  { lineNumber: 31, startTime: 138.15, endTime: 151.46, original: "بـــرای آزادی", transliteration: "Barāye āzādi", hebrew: "בָּרָאיֶה אָזָאדִי", english: "For freedom", audioSnippetUrl: "/audio/baraye/baraye_031.mp3" },
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
