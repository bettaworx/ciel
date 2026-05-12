// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_server_icon_limits.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaServerIconLimits extends MediaServerIconLimits {
  @override
  final MediaServerIconLimitsStatic static_;
  @override
  final MediaServerIconLimitsGif gif;

  factory _$MediaServerIconLimits(
          [void Function(MediaServerIconLimitsBuilder)? updates]) =>
      (MediaServerIconLimitsBuilder()..update(updates))._build();

  _$MediaServerIconLimits._({required this.static_, required this.gif})
      : super._();
  @override
  MediaServerIconLimits rebuild(
          void Function(MediaServerIconLimitsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaServerIconLimitsBuilder toBuilder() =>
      MediaServerIconLimitsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaServerIconLimits &&
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
    return (newBuiltValueToStringHelper(r'MediaServerIconLimits')
          ..add('static_', static_)
          ..add('gif', gif))
        .toString();
  }
}

class MediaServerIconLimitsBuilder
    implements Builder<MediaServerIconLimits, MediaServerIconLimitsBuilder> {
  _$MediaServerIconLimits? _$v;

  MediaServerIconLimitsStaticBuilder? _static_;
  MediaServerIconLimitsStaticBuilder get static_ =>
      _$this._static_ ??= MediaServerIconLimitsStaticBuilder();
  set static_(MediaServerIconLimitsStaticBuilder? static_) =>
      _$this._static_ = static_;

  MediaServerIconLimitsGifBuilder? _gif;
  MediaServerIconLimitsGifBuilder get gif =>
      _$this._gif ??= MediaServerIconLimitsGifBuilder();
  set gif(MediaServerIconLimitsGifBuilder? gif) => _$this._gif = gif;

  MediaServerIconLimitsBuilder() {
    MediaServerIconLimits._defaults(this);
  }

  MediaServerIconLimitsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _static_ = $v.static_.toBuilder();
      _gif = $v.gif.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaServerIconLimits other) {
    _$v = other as _$MediaServerIconLimits;
  }

  @override
  void update(void Function(MediaServerIconLimitsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaServerIconLimits build() => _build();

  _$MediaServerIconLimits _build() {
    _$MediaServerIconLimits _$result;
    try {
      _$result = _$v ??
          _$MediaServerIconLimits._(
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
            r'MediaServerIconLimits', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
