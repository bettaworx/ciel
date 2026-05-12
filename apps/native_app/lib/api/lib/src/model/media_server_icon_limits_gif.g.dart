// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_server_icon_limits_gif.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaServerIconLimitsGif extends MediaServerIconLimitsGif {
  @override
  final int maxSize;

  factory _$MediaServerIconLimitsGif(
          [void Function(MediaServerIconLimitsGifBuilder)? updates]) =>
      (MediaServerIconLimitsGifBuilder()..update(updates))._build();

  _$MediaServerIconLimitsGif._({required this.maxSize}) : super._();
  @override
  MediaServerIconLimitsGif rebuild(
          void Function(MediaServerIconLimitsGifBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaServerIconLimitsGifBuilder toBuilder() =>
      MediaServerIconLimitsGifBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaServerIconLimitsGif && maxSize == other.maxSize;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, maxSize.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MediaServerIconLimitsGif')
          ..add('maxSize', maxSize))
        .toString();
  }
}

class MediaServerIconLimitsGifBuilder
    implements
        Builder<MediaServerIconLimitsGif, MediaServerIconLimitsGifBuilder> {
  _$MediaServerIconLimitsGif? _$v;

  int? _maxSize;
  int? get maxSize => _$this._maxSize;
  set maxSize(int? maxSize) => _$this._maxSize = maxSize;

  MediaServerIconLimitsGifBuilder() {
    MediaServerIconLimitsGif._defaults(this);
  }

  MediaServerIconLimitsGifBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _maxSize = $v.maxSize;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaServerIconLimitsGif other) {
    _$v = other as _$MediaServerIconLimitsGif;
  }

  @override
  void update(void Function(MediaServerIconLimitsGifBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaServerIconLimitsGif build() => _build();

  _$MediaServerIconLimitsGif _build() {
    final _$result = _$v ??
        _$MediaServerIconLimitsGif._(
          maxSize: BuiltValueNullFieldError.checkNotNull(
              maxSize, r'MediaServerIconLimitsGif', 'maxSize'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
