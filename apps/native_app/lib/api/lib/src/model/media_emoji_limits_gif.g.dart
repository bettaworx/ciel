// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_emoji_limits_gif.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaEmojiLimitsGif extends MediaEmojiLimitsGif {
  @override
  final int height;

  factory _$MediaEmojiLimitsGif(
          [void Function(MediaEmojiLimitsGifBuilder)? updates]) =>
      (MediaEmojiLimitsGifBuilder()..update(updates))._build();

  _$MediaEmojiLimitsGif._({required this.height}) : super._();
  @override
  MediaEmojiLimitsGif rebuild(
          void Function(MediaEmojiLimitsGifBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaEmojiLimitsGifBuilder toBuilder() =>
      MediaEmojiLimitsGifBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaEmojiLimitsGif && height == other.height;
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
    return (newBuiltValueToStringHelper(r'MediaEmojiLimitsGif')
          ..add('height', height))
        .toString();
  }
}

class MediaEmojiLimitsGifBuilder
    implements Builder<MediaEmojiLimitsGif, MediaEmojiLimitsGifBuilder> {
  _$MediaEmojiLimitsGif? _$v;

  int? _height;
  int? get height => _$this._height;
  set height(int? height) => _$this._height = height;

  MediaEmojiLimitsGifBuilder() {
    MediaEmojiLimitsGif._defaults(this);
  }

  MediaEmojiLimitsGifBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _height = $v.height;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaEmojiLimitsGif other) {
    _$v = other as _$MediaEmojiLimitsGif;
  }

  @override
  void update(void Function(MediaEmojiLimitsGifBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaEmojiLimitsGif build() => _build();

  _$MediaEmojiLimitsGif _build() {
    final _$result = _$v ??
        _$MediaEmojiLimitsGif._(
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'MediaEmojiLimitsGif', 'height'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
