class AppUrls {
  static const String githubRawBase =
      'https://raw.githubusercontent.com/wwwvasanth507-create/mm/main/public';

  /// Resolves a thumbnail URL to a full network URL suitable for Image loading and MediaItem.
  static String? resolveThumbnailUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) return null;
    final trimmed = rawUrl.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    if (trimmed.startsWith('assets/')) {
      return trimmed;
    }

    if (trimmed.startsWith('/covers/') || trimmed.startsWith('covers/')) {
      final filename = trimmed.split('/').last;
      return '$githubRawBase/covers/$filename';
    }

    if (trimmed.startsWith('/')) {
      return '$githubRawBase$trimmed';
    }

    return '$githubRawBase/covers/$trimmed';
  }

  /// Returns an optimized high-speed CDN URL scaled to target dimensions.
  /// For Apple Music CDN (mzstatic.com), dynamically replaces resolution (e.g. 150x150, 300x300, 600x600)
  /// reducing download payload by 75-90% for lightning-fast loads.
  static String? getOptimizedThumbnailUrl(String? rawUrl, {int width = 300}) {
    final resolved = resolveThumbnailUrl(rawUrl);
    if (resolved == null) return null;

    // Optimize mzstatic.com (Apple Music CDN)
    if (resolved.contains('mzstatic.com')) {
      final targetSize = width.clamp(100, 600);
      return resolved.replaceFirst(
        RegExp(r'/\d+x\d+bb\.(jpg|png|webp)', caseSensitive: false),
        '/${targetSize}x${targetSize}bb.jpg',
      );
    }

    return resolved;
  }

  static final Set<String> _bundledCovers = {
    'aasa-orave.jpg', 'achacho.jpg', 'adangaatha-asuran.jpg', 'aga-naga.jpg',
    'agayam-theepiditha.jpg', 'agriculture-song.jpg', 'ak-the-tiger.jpg', 'amara.jpg',
    'amman-song.jpg', 'anandham-vilayadum-veedu.jpg', 'animal-instinct.jpg',
    'anju-vanna-poove.jpg', 'annaatthe.jpg', 'anthaathi.jpg', 'aranmanai-3.jpg',
    'arasan-theme.jpg', 'aththaan.jpg', 'ayalaa-ayalaa.jpg', 'azhage-agarame.jpg',
    'bachelor.jpg', 'bakasuran.jpg', 'beast.jpg', 'blud-is-on-his-way.jpg',
    'brahmakalasha.jpg', 'cheenikkallu.jpg', 'chikitu.jpg', 'chillanjirukkiye.jpg',
    'chinna-chinna-kangal.jpg', 'cobra.jpg', 'come-back-indian.jpg', 'coolie-disco.jpg',
    'dada.jpg', 'dheivamagane-dheivamagane.jpg', 'dikkiloona.jpg', 'doctor.jpg', 'don.jpg',
    'dude-trailer-blast.jpg', 'edharkaga-marubadi.jpg', 'enemy.jpg', 'engeyo.jpg',
    'enjaami-thandhaane.jpg', 'enjoy-enjaami.jpg', 'enna-sugam.jpg', 'ethana-saami.jpg',
    'etharkkum-thunindhavan.jpg', 'ezhutha-kadhaiyo.jpg', 'fire-song.jpg', 'gatta-kusthi.jpg',
    'ghost-theme.jpg', 'god-bless-u.jpg', 'golden-sparrow.jpg', 'grandma-song.jpg',
    'hey-minnale.jpg', 'hunter-vantaar.jpg', 'i-am-the-danger.jpg', 'iraivaa.jpg',
    'iravingu-theevai.jpg', 'jai-bhim.jpg', 'jail.jpg', 'jailer.jpg', 'jinguchaa.jpg',
    'jo-jo.jpg', 'joe.jpg', 'kaalamaadan-gaanam.jpg', 'kaathalae-kaathalae.jpg',
    'kaathuvaakula-rendu-kaadhal.jpg', 'kaatrodu-pattam-pola.jpg', 'kadharalz.jpg',
    'kallaliye-kallaliye.jpg', 'kalloorum.jpg', 'kanave.jpg', 'kanguva-glimpse.jpg',
    'kanguva-title-announcement.jpg', 'kanimaa.jpg', 'kannadi-poove.jpg',
    'kannale-pesuma.jpg', 'kanne-kalangadha.jpg', 'kannukulla.jpg', 'kantara.jpg',
    'karma-song.jpg', 'karnan.jpg', 'kgf-chapter-2.jpg', 'kissik.jpg', 'kokki.jpg',
    'kulasamy-kaaval-kaaka.jpg', 'kutty-pattas.jpg', 'leo.jpg', 'love-today.jpg',
    'maamannan.jpg', 'maanaadu.jpg', 'maara.jpg', 'maaran.jpg', 'maatikkinaaru-orutharu.jpg',
    'maayoney.jpg', 'mahaan.jpg', 'makkamishi.jpg', 'maname-maname.jpg', 'manasilaayo.jpg',
    'mannichiru.jpg', 'mannippu.jpg', 'mark-antony.jpg', 'master.jpg', 'matta.jpg',
    'minnu-vattaam-poochi.jpg', 'mobsta.jpg', 'monica.jpg', 'mudhal-nee-mudivum-nee.jpg',
    'muththa-mazhai.jpg', 'my-heartu-spinning.jpg', 'naam-2-adi-penne-reprise.jpg',
    'naam-2-kannoram.jpg', 'naam.jpg', 'nallaru-po.jpg', 'neelothi.jpg', 'netrikann.jpg',
    'odatha-da-odatha-da.jpg', 'og-sambavam.jpg', 'oh-manapenne.jpg', 'oh-raaya.jpg',
    'oorum-blood.jpg', 'oru-oorula-raaja.jpg', 'otha-satti-soru.jpg',
    'otha-thamarai-indie.jpg', 'othapada-veriyattam.jpg', 'oyile-oyile.jpg',
    'paadhavathi.jpg', 'paaraa.jpg', 'parambarai.jpg', 'parris-jeyaraj.jpg', 'pathikichu.jpg',
    'pathu-thala.jpg', 'peelings.jpg', 'pisasu-2.jpg', 'playlist-2021-blockbusters.jpg',
    'playlist-2022-blockbusters.jpg', 'playlist-anirudh-vibes.jpg',
    'playlist-arr-classics.jpg', 'playlist-ayothi.jpg', 'playlist-blockbuster-themes.jpg',
    'playlist-featured.jpg', 'playlist-folk-roots.jpg', 'playlist-late-night-chill.jpg',
    'playlist-mass-kuthu.jpg', 'playlist-ponniyin-selvan.jpg', 'playlist-pure-melodies.jpg',
    'playlist-romantic-escapes.jpg', 'playlist-sana-rustic-vibes.jpg',
    'playlist-sita-ramam.jpg', 'playlist-soulful-heartbreak.jpg',
    'playlist-unplugged-karaoke-chill.jpg', 'playlist-workout-adrenaline.jpg',
    'playlist-yuvan-drugs.jpg', 'ponniyin-selvan-2.jpg', 'ponniyin-selvan-part-1-ps1.jpg',
    'por-veeran-azadi.jpg', 'poraen-naa-poraen.jpg', 'powerhouse.jpg', 'pushpa-pushpa.jpg',
    'pushpa-the-rise.jpg', 'raayan-rumble.jpg', 'ranagalam.jpg', 'ravana-tandavam.jpg',
    'rebel-song.jpg', 'rekka-rekka.jpg', 'rise-of-dragon.jpg', 'rrr.jpg', 'rudhran.jpg',
    'sai-pallavi-s-intro.jpg', 'salambala.jpg', 'sardar.jpg', 'sarpatta-parambarai.jpg',
    'sidu-sidu.jpg', 'singari.jpg', 'sita-ramam.jpg', 'soodaana.jpg', 'spark.jpg',
    'sulthan.jpg', 'suro-suro.jpg', 'teddy.jpg', 'thalaivane.jpg', 'thangapoovey.jpg',
    'the-one.jpg', 'theansudare.jpg', 'theekkoluthi.jpg', 'thenkizhakku.jpg', 'thennaadu.jpg',
    'thiruchitrambalam.jpg', 'thunivu.jpg', 'uchathila.jpg', 'udanpirappe.jpg', 'uyirey.jpg',
    'uyirnaadi-nanbane.jpg', 'vaanam-kizhiyuthu.jpg', 'vaane-vaane.jpg', 'vaathi.jpg',
    'vaazh-veesum.jpg', 'vaenguzhalil-ezhaindayadi.jpg', 'valimai.jpg', 'varaha-roopam.jpg',
    'varisu.jpg', 'vazhithunaiye.jpg', 'vendhu-thanindhathu-kaadu.jpg',
    'vennilavu-saaral.jpg', 'viduthalai.jpg', 'vikram.jpg', 'viruman.jpg',
    'vizhuthe-thalavizhuthe.jpg', 'water-packet.jpg', 'whistle-podu.jpg',
    'yaaro-ivan-yaaro.jpg', 'yedi.jpg', 'yen-paattan-saami-varum.jpg', 'yendi-vittu-pona.jpg',
    'yolo.jpg'
  };

  /// Returns the local asset path if a thumbnail exists in bundled assets/covers/
  static String? getLocalAssetCoverPath(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) return null;
    final trimmed = rawUrl.trim();

    if (trimmed.startsWith('assets/covers/')) {
      return trimmed;
    }

    final pathWithoutQuery = trimmed.split('?').first.split('#').first;
    final rawFilename = pathWithoutQuery.split('/').last;
    String filename;
    try {
      filename = Uri.decodeComponent(rawFilename).toLowerCase();
    } catch (_) {
      filename = rawFilename.toLowerCase();
    }
    if (filename.isEmpty) return null;

    if (!filename.contains('.')) {
      filename = '$filename.jpg';
    }

    if (_bundledCovers.contains(filename)) {
      return 'assets/covers/$filename';
    }

    return null;
  }
}

/// Backwards compatibility alias
typedef UrlResolver = AppUrls;
