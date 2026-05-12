// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_post_limits.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaPostLimits extends MediaPostLimits {
  @override
  final MediaPostLimitsStatic static_;
  @override
  final MediaPostLimitsGif gif;

  factory _$MediaPostLimits([void Function(MediaPostLimitsBuilder)? updates]) =>
      (MediaPostLimitsBuilder()..update(updates))._build();

  _$MediaPostLimits._({required this.static_, required this.gif}) : super._();
  @override
  MediaPostLimits rebuild(void Function(MediaPostLimitsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaPostLimitsBuilder toBuilder() => MediaPostLimitsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaPostLimits &&
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
    return (newBuiltValueToStringHelper(r'MediaPostLimits')
          ..add('static_', static_)
          ..add('gif', gif))
        .toString();
  }
}

class MediaPostLimitsBuilder
    implements Builder<MediaPostLimits, MediaPostLimitsBuilder> {
  _$MediaPostLimits? _$v;

  MediaPostLimitsStaticBuilder? _static_;
  MediaPostLimitsStaticBuilder get static_ =>
      _$this._static_ ??= MediaPostLimitsStaticBuilder();
  set static_(MediaPostLimitsStaticBuilder? static_) =>
      _$this._static_ = static_;

  MediaPostLimitsGifBuilder? _gif;
  MediaPostLimitsGifBuilder get gif =>
      _$this._gif ??= MediaPostLimitsGifBuilder();
  set gif(MediaPostLimitsGifBuilder? gif) => _$this._gif = gif;

  MediaPostLimitsBuilder() {
    MediaPostLimits._defaults(this);
  }

  MediaPostLimitsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _static_ = $v.static_.toBuilder();
      _gif = $v.gif.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaPostLimits other) {
    _$v = other as _$MediaPostLimits;
  }

  @override
  void update(void Function(MediaPostLimitsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaPostLimits build() => _build();

  _$MediaPostLimits _build() {
    _$MediaPostLimits _$result;
    try {
      _$result = _$v ??
          _$MediaPostLimits._(
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
            r'MediaPostLimits', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
