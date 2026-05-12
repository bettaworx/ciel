// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_banner_limits_gif.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaBannerLimitsGif extends MediaBannerLimitsGif {
  @override
  final int width;
  @override
  final int height;

  factory _$MediaBannerLimitsGif(
          [void Function(MediaBannerLimitsGifBuilder)? updates]) =>
      (MediaBannerLimitsGifBuilder()..update(updates))._build();

  _$MediaBannerLimitsGif._({required this.width, required this.height})
      : super._();
  @override
  MediaBannerLimitsGif rebuild(
          void Function(MediaBannerLimitsGifBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaBannerLimitsGifBuilder toBuilder() =>
      MediaBannerLimitsGifBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaBannerLimitsGif &&
        width == other.width &&
        height == other.height;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MediaBannerLimitsGif')
          ..add('width', width)
          ..add('height', height))
        .toString();
  }
}

class MediaBannerLimitsGifBuilder
    implements Builder<MediaBannerLimitsGif, MediaBannerLimitsGifBuilder> {
  _$MediaBannerLimitsGif? _$v;

  int? _width;
  int? get width => _$this._width;
  set width(int? width) => _$this._width = width;

  int? _height;
  int? get height => _$this._height;
  set height(int? height) => _$this._height = height;

  MediaBannerLimitsGifBuilder() {
    MediaBannerLimitsGif._defaults(this);
  }

  MediaBannerLimitsGifBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _width = $v.width;
      _height = $v.height;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaBannerLimitsGif other) {
    _$v = other as _$MediaBannerLimitsGif;
  }

  @override
  void update(void Function(MediaBannerLimitsGifBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaBannerLimitsGif build() => _build();

  _$MediaBannerLimitsGif _build() {
    final _$result = _$v ??
        _$MediaBannerLimitsGif._(
          width: BuiltValueNullFieldError.checkNotNull(
              width, r'MediaBannerLimitsGif', 'width'),
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'MediaBannerLimitsGif', 'height'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
