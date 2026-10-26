class AppValidators {
  AppValidators._();

  static String? validateTitle(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Song title is required';
    }
    if (value.trim().length > 150) {
      return 'Title must be 150 characters or fewer';
    }
    return null;
  }

  static String? validateArtist(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Artist name is required';
    }
    return null;
  }

  static String? validateAudioUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Audio URL is required';
    }

    final trimmed = value.trim();
    final uri = Uri.tryParse(trimmed);

    if (uri == null || !uri.hasScheme || !uri.hasAuthority) {
      return 'Please enter a valid URL (e.g. https://domain.com/track.mp3)';
    }

    if (uri.scheme.toLowerCase() != 'https' && uri.scheme.toLowerCase() != 'http') {
      return 'Only HTTPS and HTTP URLs are supported';
    }

    return null;
  }

  static String? validateThumbnailUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Thumbnail is optional
    }

    final trimmed = value.trim();
    final uri = Uri.tryParse(trimmed);

    if (uri == null || !uri.hasScheme || !uri.hasAuthority) {
      return 'Enter a valid image URL or leave blank';
    }

    if (uri.scheme.toLowerCase() != 'https' && uri.scheme.toLowerCase() != 'http') {
      return 'Image URL must start with http:// or https://';
    }

    return null;
  }

  static String? validateReleaseYear(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Optional
    }

    final year = int.tryParse(value.trim());
    if (year == null) {
      return 'Year must be a valid number';
    }

    final currentYear = DateTime.now().year + 2;
    if (year < 1850 || year > currentYear) {
      return 'Year must be between 1850 and $currentYear';
    }

    return null;
  }
}
