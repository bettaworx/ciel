// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_emoji_limits.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaEmojiLimits extends MediaEmojiLimits {
  @override
  final MediaEmojiLimitsStatic static_;
  @override
  final MediaEmojiLimitsGif gif;

  factory _$MediaEmojiLimits(
          [void Function(MediaEmojiLimitsBuilder)? updates]) =>
      (MediaEmojiLimitsBuilder()..update(updates))._build();

  _$MediaEmojiLimits._({required this.static_, required this.gif}) : super._();
  @override
  MediaEmojiLimits rebuild(void Function(MediaEmojiLimitsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaEmojiLimitsBuilder toBuilder() =>
      MediaEmojiLimitsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaEmojiLimits &&
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
    return (newBuiltValueToStringHelper(r'MediaEmojiLimits')
          ..add('static_', static_)
          ..add('gif', gif))
        .toString();
  }
}

class MediaEmojiLimitsBuilder
    implements Builder<MediaEmojiLimits, MediaEmojiLimitsBuilder> {
  _$MediaEmojiLimits? _$v;

  MediaEmojiLimitsStaticBuilder? _static_;
  MediaEmojiLimitsStaticBuilder get static_ =>
      _$this._static_ ??= MediaEmojiLimitsStaticBuilder();
  set static_(MediaEmojiLimitsStaticBuilder? static_) =>
      _$this._static_ = static_;

  MediaEmojiLimitsGifBuilder? _gif;
  MediaEmojiLimitsGifBuilder get gif =>
      _$this._gif ??= MediaEmojiLimitsGifBuilder();
  set gif(MediaEmojiLimitsGifBuilder? gif) => _$this._gif = gif;

  MediaEmojiLimitsBuilder() {
    MediaEmojiLimits._defaults(this);
  }

  MediaEmojiLimitsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _static_ = $v.static_.toBuilder();
      _gif = $v.gif.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaEmojiLimits other) {
    _$v = other as _$MediaEmojiLimits;
  }

  @override
  void update(void Function(MediaEmojiLimitsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaEmojiLimits build() => _build();

  _$MediaEmojiLimits _build() {
    _$MediaEmojiLimits _$result;
    try {
      _$result = _$v ??
          _$MediaEmojiLimits._(
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
            r'MediaEmojiLimits', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
