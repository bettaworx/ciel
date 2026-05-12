// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_emoji_limits_static.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaEmojiLimitsStatic extends MediaEmojiLimitsStatic {
  @override
  final int height;

  factory _$MediaEmojiLimitsStatic(
          [void Function(MediaEmojiLimitsStaticBuilder)? updates]) =>
      (MediaEmojiLimitsStaticBuilder()..update(updates))._build();

  _$MediaEmojiLimitsStatic._({required this.height}) : super._();
  @override
  MediaEmojiLimitsStatic rebuild(
          void Function(MediaEmojiLimitsStaticBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaEmojiLimitsStaticBuilder toBuilder() =>
      MediaEmojiLimitsStaticBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaEmojiLimitsStatic && height == other.height;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MediaEmojiLimitsStatic')
          ..add('height', height))
        .toString();
  }
}

class MediaEmojiLimitsStaticBuilder
    implements Builder<MediaEmojiLimitsStatic, MediaEmojiLimitsStaticBuilder> {
  _$MediaEmojiLimitsStatic? _$v;

  int? _height;
  int? get height => _$this._height;
  set height(int? height) => _$this._height = height;

  MediaEmojiLimitsStaticBuilder() {
    MediaEmojiLimitsStatic._defaults(this);
  }

  MediaEmojiLimitsStaticBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _height = $v.height;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaEmojiLimitsStatic other) {
    _$v = other as _$MediaEmojiLimitsStatic;
  }

  @override
  void update(void Function(MediaEmojiLimitsStaticBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaEmojiLimitsStatic build() => _build();

  _$MediaEmojiLimitsStatic _build() {
    final _$result = _$v ??
        _$MediaEmojiLimitsStatic._(
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'MediaEmojiLimitsStatic', 'height'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
