// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_post_limits_gif.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaPostLimitsGif extends MediaPostLimitsGif {
  @override
  final int maxSize;

  factory _$MediaPostLimitsGif(
          [void Function(MediaPostLimitsGifBuilder)? updates]) =>
      (MediaPostLimitsGifBuilder()..update(updates))._build();

  _$MediaPostLimitsGif._({required this.maxSize}) : super._();
  @override
  MediaPostLimitsGif rebuild(
          void Function(MediaPostLimitsGifBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaPostLimitsGifBuilder toBuilder() =>
      MediaPostLimitsGifBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaPostLimitsGif && maxSize == other.maxSize;
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
    return (newBuiltValueToStringHelper(r'MediaPostLimitsGif')
          ..add('maxSize', maxSize))
        .toString();
  }
}

class MediaPostLimitsGifBuilder
    implements Builder<MediaPostLimitsGif, MediaPostLimitsGifBuilder> {
  _$MediaPostLimitsGif? _$v;

  int? _maxSize;
  int? get maxSize => _$this._maxSize;
  set maxSize(int? maxSize) => _$this._maxSize = maxSize;

  MediaPostLimitsGifBuilder() {
    MediaPostLimitsGif._defaults(this);
  }

  MediaPostLimitsGifBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _maxSize = $v.maxSize;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaPostLimitsGif other) {
    _$v = other as _$MediaPostLimitsGif;
  }

  @override
  void update(void Function(MediaPostLimitsGifBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaPostLimitsGif build() => _build();

  _$MediaPostLimitsGif _build() {
    final _$result = _$v ??
        _$MediaPostLimitsGif._(
          maxSize: BuiltValueNullFieldError.checkNotNull(
              maxSize, r'MediaPostLimitsGif', 'maxSize'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
