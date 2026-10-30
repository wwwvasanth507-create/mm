const fs = require('fs');

const urls = [
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Adi-Penne-MassTamilan.fm-Naam%20-%20Adi%20Penne%20Indie%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Andha-Kanna-Paathaakaa-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Anney-Yaaranney-MassTamilan.fm-Udanpirappe%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Beat-of-Master-(Instrumental)-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Bodhai-Kaname-MassTamilan.fm-%20Oh%20Manapenne%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Dancing-Rose-MassTamilan.fm-Sarpatta%20Parambarai%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/En-Iniya-Thanimaye-Karaoke-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/En-Iniya-Thanimaye-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Eppadi-Iruntha-Naanga-MassTamilan.io-Sulthan%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Eyy-Beta-Idhu-En-Patta-MassTamilan.fm-Pushpa%20-%20The%20Rise%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Harmonica-Sizzles-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Idhuvum-Kadandhu-Pogum-(Reprise)-MassTamilan.fm-%20Netrikann%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Idhuvum-Kadandhu-Pogum-(The-Healing-Song)-MassTamilan.fm-%20Netrikann%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Jai-Sulthan-MassTamilan.io-Sulthan%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Kaathirundhen-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Kaathodu-Kaathanen-MassTamilan.fm-Jail%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Kaatrilae-MassTamilan.io-Mudhal%20Nee%20Mudivum%20Nee%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Kandaa-Vara-Sollunga-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Karnan-Kodai-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Karnan-Purappadu-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Kavan-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Kutti-Story-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Kutty-Pattas-MassTamilan.fm-%20Kutty%20Pattas%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Life-Of-Bachelor-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Little-India-MassTamilan.fm-Enemy%202021%20t.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Lojakku-Mojakku-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Maara-%26-Paaru-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Manja-Colouru-Kuruvi-MassTamilan.io-Dikkiloona%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Manjanathi-Puranam-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Manniley-Eeramundu-MassTamilan.fm-Jai%20Bhim%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Marandaaye-(Unplugged-Version)-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Marandaaye-Karaoke-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Marandhaye-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Marudhaani-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Master-the-Blaster-MassTamilan.io-Master%20Additional%20Songs%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Master-the-Blaster-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Meherezylaa-MassTamilan.fm-Maanaadu%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Miss-You-Baby-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Mudhal-Nee-Mudivum-Nee-Title-Track-MassTamilan.io-Mudhal%20Nee%20Mudivum%20Nee%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Nanbiye-Karaoke-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Nanbiye-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Nedunaal-MassTamilan.io-Mudhal%20Nee%20Mudivum%20Nee%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Neel-Koadugaal-(An-Ode-to-Time)-MassTamilan.io-Mudhal%20Nee%20Mudivum%20Nee%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Neeye-Oli-MassTamilan.fm-Sarpatta%20Parambarai%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Nenjame-MassTamilan.fm-%20Doctor%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Nesamaguren-MassTamilan.fm-Parambarai%20-%20Nesamaguren%20Indie%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Netrikann-Title-Track-MassTamilan.fm-%20Netrikann%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/O-Ajooba-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Odu-Odu-Aadu-MassTamilan.fm-Pushpa%20-%20The%20Rise%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Oh-Azhage-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Oo-Solriya-Oo-Oo-Solriya-MassTamilan.fm-Pushpa%20-%20The%20Rise%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Orey-Naan-Orey-Nee-MassTamilan.fm-Enemy%202021%20t.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Oru-Arai-Unathu-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Oru-Kutti-Katha-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Othapana-Kaatteri-MassTamilan.fm-Udanpirappe%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Pachigalam-Paravaigalam-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Pathala-MassTamilan.fmEnemy%202021%20t.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Per-Vachaalum-Vaikkaama-MassTamilan.io-Dikkiloona%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Photographic-Memory-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Po-Nilladhe-MassTamilan.fm-%20Netrikann%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Polakatum-Para-Para-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Polladha-Ulagathiley-MassTamilan.fm-Jai%20Bhim%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Pona-Pogattum-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Power-MassTamilan.fm-Jai%20Bhim%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Pudhidhaai-MassTamilan.io-Mudhal%20Nee%20Mudivum%20Nee%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Pudhu-Saththam-MassTamilan.fm-Sulthan%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Puli-Manga-Pulip-MassTamilan.io-Parris%20Jeyaraj%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Quit-Pannuda-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Rasavaachiye-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Ratatapata-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Ready-Steady-Teddy-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Saami-Saami-MassTamilan.fm-Pushpa%20-%20The%20Rise%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Saara-Kaattrae-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Search-of-Soul-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Sendumalli-MassTamilan.fm-Jai%20Bhim%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Sengaandhale-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/So-Baby-MassTamilan.fm-%20Doctor%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Sonthamulla-Vazhkkai-MassTamilan.fm-d%20Anandham%20Vilayadum%20Veedu%202021.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Soul-of-Doctor-(Theme)-MassTamilan.fm-%20Doctor%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Srivalli-MassTamilan.fm-Pushpa%20-%20The%20Rise%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Teddy-Bear-Rhyme-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Thala-Kodhum-MassTamilan.fm-Jai%20Bhim%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Thattaan-Thattaan-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Theeraanadhi-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Theeyaga-Thondri-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Tickle-My-Funny-Bone-MassTamilan.io-%20Teddy%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Tum-Tum-MassTamilan.fm-Enemy%202021%20t.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Uchanthala-Regaiyile-MassTamilan.fm-%20Pisasu%202%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Uttradheenga-Yeppov-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Vaa-Saamy-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Vaathi-Coming-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Vaathi-Kabaddi-MassTamilan.io-Master%20Additional%20Songs%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Vaathi-Kabaddi-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Vaathi-Raid-MassTamilan.io.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Vambula-Thumbula-MassTamilan.fm-Sarpatta%20Parambarai%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Veezhaadhae-MassTamilan.fm-Mudhal%20Nee%20Mudivum%20Nee%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Vettakaara-Kootam-MassTamilan.fm-Jai%20Bhim%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Yaar-Azhaippadhu-MassTamilan.fm-Maara%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Yaaraiyum-Ivlo-Azhaga-MassTamilan.io-Sulthan%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-1/Yedhum-Solladhe-MassTamilan.io-Dikkiloona%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-2/A-For-Annaatthe-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-2/Adiye-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-2/Annaatthe-Annaatthe-MassTamilan.fm.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-2/Chellamma-MassTamilan.fm-%20Doctor%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-2/Cycle-Wheela-Pola-MassTamilan.io-Dikkiloona%202021%20tamil%20movie.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-2/Enjoy-Enjaami-MassTamilan.io-Enjoy%20Enjaami%202021%20tamil.mp3',
'https://pub-e756afa74cc047fcaa33b6d2ced3fa04.r2.dev/songs/2021-2/Kaadhal-Kanmani-MassTamilan.fm.mp3'
];

async function fetchOne(u, idx) {
  try {
    const res = await fetch(u, { 
      headers: { Range: 'bytes=0-131071' },
      signal: AbortSignal.timeout(6000)
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const cl = res.headers.get('content-range');
    const totalSize = cl ? parseInt(cl.split('/')[1], 10) : 0;
    
    let title = '', artist = '', album = '', year = 2021;
    if (buf.slice(0, 3).toString() === 'ID3') {
      const version = buf[3];
      const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
      let pos = 10;
      while (pos < 10 + size && pos + 10 <= buf.length) {
        const frameId = buf.slice(pos, pos + 4).toString('ascii');
        if (!frameId.match(/^[A-Z0-9]{4}$/)) break;
        const frameSize = version === 4 
          ? ((buf[pos+4] & 0x7f) << 21) | ((buf[pos+5] & 0x7f) << 14) | ((buf[pos+6] & 0x7f) << 7) | (buf[pos+7] & 0x7f)
          : buf.readUInt32BE(pos + 4);
        if (frameSize <= 0 || pos + 10 + frameSize > buf.length) break;
        const frameData = buf.slice(pos + 10, pos + 10 + frameSize);
        if (frameId.startsWith('T')) {
          const encoding = frameData[0];
          let text = '';
          if (encoding === 0) text = frameData.slice(1).toString('latin1');
          else if (encoding === 1) text = frameData.slice(1).toString('utf16le');
          else text = frameData.slice(1).toString('utf8');
          text = text.replace(/\0/g, '').trim();
          if (frameId === 'TIT2') title = text;
          else if (frameId === 'TPE1') artist = text;
          else if (frameId === 'TALB') album = text;
          else if (frameId === 'TDRC' || frameId === 'TYER') year = parseInt(text, 10) || 2021;
        }
        pos += 10 + frameSize;
      }
    }

    let duration = 0;
    for (let j = 0; j < buf.length - 4; j++) {
      if (buf[j] === 0xFF && (buf[j+1] & 0xE0) === 0xE0) {
        const b1 = buf[j+1], b2 = buf[j+2];
        const v = (b1 >> 3) & 3;
        const l = (b1 >> 1) & 3;
        const sampleRateIdx = (b2 >> 2) & 3;
        const sampleRates = [44100, 48000, 32000, 0];
        const sr = sampleRates[sampleRateIdx];
        if (v === 3 && l === 1 && sr > 0) {
          const xingPos = j + 36;
          const tag = buf.slice(xingPos, xingPos + 4).toString('ascii');
          if (tag === 'Xing' || tag === 'Info') {
            const flags = buf.readUInt32BE(xingPos + 4);
            if (flags & 1) {
              const frames = buf.readUInt32BE(xingPos + 8);
              duration = Math.round(frames * 1152 / sr);
            }
          }
          break;
        }
      }
    }
    return { idx, url: u, title, artist, album, year, duration, totalSize };
  } catch (err) {
    return { idx, url: u, title: '', artist: '', album: '', year: 2021, duration: 0, totalSize: 0, error: err.message };
  }
}

async function run() {
  const BATCH_SIZE = 10;
  const results = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const chunk = urls.slice(i, i + BATCH_SIZE);
    const chunkRes = await Promise.all(chunk.map((u, cIdx) => fetchOne(u, i + cIdx + 1)));
    results.push(...chunkRes);
    console.log(`Processed ${results.length} / ${urls.length}`);
  }
  fs.writeFileSync('./scratch_raw_songs.json', JSON.stringify(results, null, 2));
  console.log('ALL DONE! Saved to scratch_raw_songs.json');
}
run();
