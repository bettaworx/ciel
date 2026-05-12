// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_server_icon_limits_static.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaServerIconLimitsStatic extends MediaServerIconLimitsStatic {
  @override
  final int size;

  factory _$MediaServerIconLimitsStatic(
          [void Function(MediaServerIconLimitsStaticBuilder)? updates]) =>
      (MediaServerIconLimitsStaticBuilder()..update(updates))._build();

  _$MediaServerIconLimitsStatic._({required this.size}) : super._();
  @override
  MediaServerIconLimitsStatic rebuild(
          void Function(MediaServerIconLimitsStaticBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaServerIconLimitsStaticBuilder toBuilder() =>
      MediaServerIconLimitsStaticBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaServerIconLimitsStatic && size == other.size;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, size.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MediaServerIconLimitsStatic')
          ..add('size', size))
        .toString();
  }
}

class MediaServerIconLimitsStaticBuilder
    implements
        Builder<MediaServerIconLimitsStatic,
            MediaServerIconLimitsStaticBuilder> {
  _$MediaServerIconLimitsStatic? _$v;

  int? _size;
  int? get size => _$this._size;
  set size(int? size) => _$this._size = size;

  MediaServerIconLimitsStaticBuilder() {
    MediaServerIconLimitsStatic._defaults(this);
  }

  MediaServerIconLimitsStaticBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _size = $v.size;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaServerIconLimitsStatic other) {
    _$v = other as _$MediaServerIconLimitsStatic;
  }

  @override
  void update(void Function(MediaServerIconLimitsStaticBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaServerIconLimitsStatic build() => _build();

  _$MediaServerIconLimitsStatic _build() {
    final _$result = _$v ??
        _$MediaServerIconLimitsStatic._(
          size: BuiltValueNullFieldError.checkNotNull(
              size, r'MediaServerIconLimitsStatic', 'size'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
