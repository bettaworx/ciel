// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_banner_limits.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaBannerLimits extends MediaBannerLimits {
  @override
  final MediaBannerLimitsStatic static_;
  @override
  final MediaBannerLimitsGif gif;

  factory _$MediaBannerLimits(
          [void Function(MediaBannerLimitsBuilder)? updates]) =>
      (MediaBannerLimitsBuilder()..update(updates))._build();

  _$MediaBannerLimits._({required this.static_, required this.gif}) : super._();
  @override
  MediaBannerLimits rebuild(void Function(MediaBannerLimitsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaBannerLimitsBuilder toBuilder() =>
      MediaBannerLimitsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaBannerLimits &&
        static_ == other.static_ &&
        gif == other.gif;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, static_.hashCode);
    _$hash = $jc(_$hash, gif.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MediaBannerLimits')
          ..add('static_', static_)
          ..add('gif', gif))
        .toString();
  }
}

class MediaBannerLimitsBuilder
    implements Builder<MediaBannerLimits, MediaBannerLimitsBuilder> {
  _$MediaBannerLimits? _$v;

  MediaBannerLimitsStaticBuilder? _static_;
  MediaBannerLimitsStaticBuilder get static_ =>
      _$this._static_ ??= MediaBannerLimitsStaticBuilder();
  set static_(MediaBannerLimitsStaticBuilder? static_) =>
      _$this._static_ = static_;

  MediaBannerLimitsGifBuilder? _gif;
  MediaBannerLimitsGifBuilder get gif =>
      _$this._gif ??= MediaBannerLimitsGifBuilder();
  set gif(MediaBannerLimitsGifBuilder? gif) => _$this._gif = gif;

  MediaBannerLimitsBuilder() {
    MediaBannerLimits._defaults(this);
  }

  MediaBannerLimitsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _static_ = $v.static_.toBuilder();
      _gif = $v.gif.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaBannerLimits other) {
    _$v = other as _$MediaBannerLimits;
  }

  @override
  void update(void Function(MediaBannerLimitsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaBannerLimits build() => _build();

  _$MediaBannerLimits _build() {
    _$MediaBannerLimits _$result;
    try {
      _$result = _$v ??
          _$MediaBannerLimits._(
            static_: static_.build(),
            gif: gif.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'static_';
        static_.build();
        _$failedField = 'gif';
        gif.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'MediaBannerLimits', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
