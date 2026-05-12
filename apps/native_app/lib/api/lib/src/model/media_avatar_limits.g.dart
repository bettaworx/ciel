// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_avatar_limits.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaAvatarLimits extends MediaAvatarLimits {
  @override
  final int size;

  factory _$MediaAvatarLimits(
          [void Function(MediaAvatarLimitsBuilder)? updates]) =>
      (MediaAvatarLimitsBuilder()..update(updates))._build();

  _$MediaAvatarLimits._({required this.size}) : super._();
  @override
  MediaAvatarLimits rebuild(void Function(MediaAvatarLimitsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaAvatarLimitsBuilder toBuilder() =>
      MediaAvatarLimitsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaAvatarLimits && size == other.size;
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
    return (newBuiltValueToStringHelper(r'MediaAvatarLimits')
          ..add('size', size))
        .toString();
  }
}

class MediaAvatarLimitsBuilder
    implements Builder<MediaAvatarLimits, MediaAvatarLimitsBuilder> {
  _$MediaAvatarLimits? _$v;

  int? _size;
  int? get size => _$this._size;
  set size(int? size) => _$this._size = size;

  MediaAvatarLimitsBuilder() {
    MediaAvatarLimits._defaults(this);
  }

  MediaAvatarLimitsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _size = $v.size;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaAvatarLimits other) {
    _$v = other as _$MediaAvatarLimits;
  }

  @override
  void update(void Function(MediaAvatarLimitsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaAvatarLimits build() => _build();

  _$MediaAvatarLimits _build() {
    final _$result = _$v ??
        _$MediaAvatarLimits._(
          size: BuiltValueNullFieldError.checkNotNull(
              size, r'MediaAvatarLimits', 'size'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
