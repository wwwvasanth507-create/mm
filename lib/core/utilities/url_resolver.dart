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
    'aasa-orave.jpg', 'achacho.jpg', 'adangaatha-asuran.jpg', 'aga-naga.jpg', 'agayam-theepiditha.jpg',
    'agriculture-song.jpg', 'ak-the-tiger.jpg', 'amara.jpg', 'amman-song.jpg', 'animal-instinct.jpg',
    'anju-vanna-poove.jpg', 'anthaathi.jpg', 'arasan-theme.jpg', 'aththaan.jpg', 'ayalaa-ayalaa.jpg',
    'azhage-agarame.jpg', 'blud-is-on-his-way.jpg', 'brahmakalasha.jpg', 'cheenikkallu.jpg', 'chikitu.jpg',
    'chillanjirukkiye.jpg', 'chinna-chinna-kangal.jpg', 'come-back-indian.jpg', 'coolie-disco.jpg',
    'dheivamagane-dheivamagane.jpg', 'dude-trailer-blast.jpg', 'edharkaga-marubadi.jpg', 'engeyo.jpg',
    'enjaami-thandhaane.jpg', 'enna-sugam.jpg', 'ethana-saami.jpg', 'ezhutha-kadhaiyo.jpg', 'fire-song.jpg',
    'ghost-theme.jpg', 'god-bless-u.jpg', 'golden-sparrow.jpg', 'grandma-song.jpg', 'hey-minnale.jpg',
    'hunter-vantaar.jpg', 'i-am-the-danger.jpg', 'iraivaa.jpg', 'iravingu-theevai.jpg', 'jinguchaa.jpg',
    'jo-jo.jpg', 'kaalamaadan-gaanam.jpg', 'kaathalae-kaathalae.jpg', 'kaatrodu-pattam-pola.jpg',
    'kadharalz.jpg', 'kallaliye-kallaliye.jpg', 'kalloorum.jpg', 'kanave.jpg', 'kanguva-glimpse.jpg',
    'kanguva-title-announcement.jpg', 'kanimaa.jpg', 'kannadi-poove.jpg', 'kannale-pesuma.jpg',
    'kanne-kalangadha.jpg', 'kannukulla.jpg', 'karma-song.jpg', 'kissik.jpg', 'kokki.jpg',
    'kulasamy-kaaval-kaaka.jpg', 'maatikkinaaru-orutharu.jpg', 'maayoney.jpg', 'makkamishi.jpg',
    'maname-maname.jpg', 'manasilaayo.jpg', 'mannichiru.jpg', 'mannippu.jpg', 'matta.jpg',
    'minnu-vattaam-poochi.jpg', 'mobsta.jpg', 'monica.jpg', 'muththa-mazhai.jpg', 'my-heartu-spinning.jpg',
    'nallaru-po.jpg', 'neelothi.jpg', 'odatha-da-odatha-da.jpg', 'og-sambavam.jpg', 'oh-raaya.jpg',
    'oorum-blood.jpg', 'oru-oorula-raaja.jpg', 'otha-satti-soru.jpg', 'othapada-veriyattam.jpg',
    'oyile-oyile.jpg', 'paadhavathi.jpg', 'paaraa.jpg', 'pathikichu.jpg', 'peelings.jpg',
    'por-veeran-azadi.jpg', 'poraen-naa-poraen.jpg', 'powerhouse.jpg', 'pushpa-pushpa.jpg',
    'raayan-rumble.jpg', 'ranagalam.jpg', 'ravana-tandavam.jpg', 'rebel-song.jpg', 'rekka-rekka.jpg',
    'rise-of-dragon.jpg', 'sai-pallavi-s-intro.jpg', 'salambala.jpg', 'sidu-sidu.jpg', 'singari.jpg',
    'soodaana.jpg', 'spark.jpg', 'suro-suro.jpg', 'thalaivane.jpg', 'thangapoovey.jpg', 'the-one.jpg',
    'theansudare.jpg', 'theekkoluthi.jpg', 'thenkizhakku.jpg', 'thennaadu.jpg', 'uchathila.jpg',
    'uyirey.jpg', 'uyirnaadi-nanbane.jpg', 'vaanam-kizhiyuthu.jpg', 'vaane-vaane.jpg', 'vaazh-veesum.jpg',
    'vaenguzhalil-ezhaindayadi.jpg', 'varaha-roopam.jpg', 'vazhithunaiye.jpg', 'vennilavu-saaral.jpg',
    'vizhuthe-thalavizhuthe.jpg', 'water-packet.jpg', 'whistle-podu.jpg', 'yaaro-ivan-yaaro.jpg',
    'yedi.jpg', 'yen-paattan-saami-varum.jpg', 'yendi-vittu-pona.jpg', 'yolo.jpg'
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
