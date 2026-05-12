// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_limits.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaLimits extends MediaLimits {
  @override
  final int maxUploadSizeMB;
  @override
  final BuiltList<String> allowedExtensions;
  @override
  final MediaPostLimits post;
  @override
  final MediaAvatarLimits avatar;
  @override
  final MediaBannerLimits banner;
  @override
  final MediaServerIconLimits serverIcon;
  @override
  final MediaEmojiLimits emoji;
  @override
  final MediaVideoLimits video;

  factory _$MediaLimits([void Function(MediaLimitsBuilder)? updates]) =>
      (MediaLimitsBuilder()..update(updates))._build();

  _$MediaLimits._(
      {required this.maxUploadSizeMB,
      required this.allowedExtensions,
      required this.post,
      required this.avatar,
      required this.banner,
      required this.serverIcon,
      required this.emoji,
      required this.video})
      : super._();
  @override
  MediaLimits rebuild(void Function(MediaLimitsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaLimitsBuilder toBuilder() => MediaLimitsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaLimits &&
        maxUploadSizeMB == other.maxUploadSizeMB &&
        allowedExtensions == other.allowedExtensions &&
        post == other.post &&
        avatar == other.avatar &&
        banner == other.banner &&
        serverIcon == other.serverIcon &&
        emoji == other.emoji &&
        video == other.video;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, maxUploadSizeMB.hashCode);
    _$hash = $jc(_$hash, allowedExtensions.hashCode);
    _$hash = $jc(_$hash, post.hashCode);
    _$hash = $jc(_$hash, avatar.hashCode);
    _$hash = $jc(_$hash, banner.hashCode);
    _$hash = $jc(_$hash, serverIcon.hashCode);
    _$hash = $jc(_$hash, emoji.hashCode);
    _$hash = $jc(_$hash, video.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MediaLimits')
          ..add('maxUploadSizeMB', maxUploadSizeMB)
          ..add('allowedExtensions', allowedExtensions)
          ..add('post', post)
          ..add('avatar', avatar)
          ..add('banner', banner)
          ..add('serverIcon', serverIcon)
          ..add('emoji', emoji)
          ..add('video', video))
        .toString();
  }
}

class MediaLimitsBuilder implements Builder<MediaLimits, MediaLimitsBuilder> {
  _$MediaLimits? _$v;

  int? _maxUploadSizeMB;
  int? get maxUploadSizeMB => _$this._maxUploadSizeMB;
  set maxUploadSizeMB(int? maxUploadSizeMB) =>
      _$this._maxUploadSizeMB = maxUploadSizeMB;

  ListBuilder<String>? _allowedExtensions;
  ListBuilder<String> get allowedExtensions =>
      _$this._allowedExtensions ??= ListBuilder<String>();
  set allowedExtensions(ListBuilder<String>? allowedExtensions) =>
      _$this._allowedExtensions = allowedExtensions;

  MediaPostLimitsBuilder? _post;
  MediaPostLimitsBuilder get post => _$this._post ??= MediaPostLimitsBuilder();
  set post(MediaPostLimitsBuilder? post) => _$this._post = post;

  MediaAvatarLimitsBuilder? _avatar;
  MediaAvatarLimitsBuilder get avatar =>
      _$this._avatar ??= MediaAvatarLimitsBuilder();
  set avatar(MediaAvatarLimitsBuilder? avatar) => _$this._avatar = avatar;

  MediaBannerLimitsBuilder? _banner;
  MediaBannerLimitsBuilder get banner =>
      _$this._banner ??= MediaBannerLimitsBuilder();
  set banner(MediaBannerLimitsBuilder? banner) => _$this._banner = banner;

  MediaServerIconLimitsBuilder? _serverIcon;
  MediaServerIconLimitsBuilder get serverIcon =>
      _$this._serverIcon ??= MediaServerIconLimitsBuilder();
  set serverIcon(MediaServerIconLimitsBuilder? serverIcon) =>
      _$this._serverIcon = serverIcon;

  MediaEmojiLimitsBuilder? _emoji;
  MediaEmojiLimitsBuilder get emoji =>
      _$this._emoji ??= MediaEmojiLimitsBuilder();
  set emoji(MediaEmojiLimitsBuilder? emoji) => _$this._emoji = emoji;

  MediaVideoLimitsBuilder? _video;
  MediaVideoLimitsBuilder get video =>
      _$this._video ??= MediaVideoLimitsBuilder();
  set video(MediaVideoLimitsBuilder? video) => _$this._video = video;

  MediaLimitsBuilder() {
    MediaLimits._defaults(this);
  }

  MediaLimitsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _maxUploadSizeMB = $v.maxUploadSizeMB;
      _allowedExtensions = $v.allowedExtensions.toBuilder();
      _post = $v.post.toBuilder();
      _avatar = $v.avatar.toBuilder();
      _banner = $v.banner.toBuilder();
      _serverIcon = $v.serverIcon.toBuilder();
      _emoji = $v.emoji.toBuilder();
      _video = $v.video.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaLimits other) {
    _$v = other as _$MediaLimits;
  }

  @override
  void update(void Function(MediaLimitsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaLimits build() => _build();

  _$MediaLimits _build() {
    _$MediaLimits _$result;
    try {
      _$result = _$v ??
          _$MediaLimits._(
            maxUploadSizeMB: BuiltValueNullFieldError.checkNotNull(
                maxUploadSizeMB, r'MediaLimits', 'maxUploadSizeMB'),
            allowedExtensions: allowedExtensions.build(),
            post: post.build(),
            avatar: avatar.build(),
            banner: banner.build(),
            serverIcon: serverIcon.build(),
            emoji: emoji.build(),
            video: video.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'allowedExtensions';
        allowedExtensions.build();
        _$failedField = 'post';
        post.build();
        _$failedField = 'avatar';
        avatar.build();
        _$failedField = 'banner';
        banner.build();
        _$failedField = 'serverIcon';
        serverIcon.build();
        _$failedField = 'emoji';
        emoji.build();
        _$failedField = 'video';
        video.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'MediaLimits', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
