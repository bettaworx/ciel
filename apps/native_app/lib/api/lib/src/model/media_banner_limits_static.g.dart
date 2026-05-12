// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_banner_limits_static.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaBannerLimitsStatic extends MediaBannerLimitsStatic {
  @override
  final int width;
  @override
  final int height;

  factory _$MediaBannerLimitsStatic(
          [void Function(MediaBannerLimitsStaticBuilder)? updates]) =>
      (MediaBannerLimitsStaticBuilder()..update(updates))._build();

  _$MediaBannerLimitsStatic._({required this.width, required this.height})
      : super._();
  @override
  MediaBannerLimitsStatic rebuild(
          void Function(MediaBannerLimitsStaticBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaBannerLimitsStaticBuilder toBuilder() =>
      MediaBannerLimitsStaticBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaBannerLimitsStatic &&
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
    return (newBuiltValueToStringHelper(r'MediaBannerLimitsStatic')
          ..add('width', width)
          ..add('height', height))
        .toString();
  }
}

class MediaBannerLimitsStaticBuilder
    implements
        Builder<MediaBannerLimitsStatic, MediaBannerLimitsStaticBuilder> {
  _$MediaBannerLimitsStatic? _$v;

  int? _width;
  int? get width => _$this._width;
  set width(int? width) => _$this._width = width;

  int? _height;
  int? get height => _$this._height;
  set height(int? height) => _$this._height = height;

  MediaBannerLimitsStaticBuilder() {
    MediaBannerLimitsStatic._defaults(this);
  }

  MediaBannerLimitsStaticBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _width = $v.width;
      _height = $v.height;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaBannerLimitsStatic other) {
    _$v = other as _$MediaBannerLimitsStatic;
  }

  @override
  void update(void Function(MediaBannerLimitsStaticBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaBannerLimitsStatic build() => _build();

  _$MediaBannerLimitsStatic _build() {
    final _$result = _$v ??
        _$MediaBannerLimitsStatic._(
          width: BuiltValueNullFieldError.checkNotNull(
              width, r'MediaBannerLimitsStatic', 'width'),
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'MediaBannerLimitsStatic', 'height'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
