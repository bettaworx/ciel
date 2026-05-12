// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_post_limits_static.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaPostLimitsStatic extends MediaPostLimitsStatic {
  @override
  final int maxSize;

  factory _$MediaPostLimitsStatic(
          [void Function(MediaPostLimitsStaticBuilder)? updates]) =>
      (MediaPostLimitsStaticBuilder()..update(updates))._build();

  _$MediaPostLimitsStatic._({required this.maxSize}) : super._();
  @override
  MediaPostLimitsStatic rebuild(
          void Function(MediaPostLimitsStaticBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaPostLimitsStaticBuilder toBuilder() =>
      MediaPostLimitsStaticBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaPostLimitsStatic && maxSize == other.maxSize;
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
    return (newBuiltValueToStringHelper(r'MediaPostLimitsStatic')
          ..add('maxSize', maxSize))
        .toString();
  }
}

class MediaPostLimitsStaticBuilder
    implements Builder<MediaPostLimitsStatic, MediaPostLimitsStaticBuilder> {
  _$MediaPostLimitsStatic? _$v;

  int? _maxSize;
  int? get maxSize => _$this._maxSize;
  set maxSize(int? maxSize) => _$this._maxSize = maxSize;

  MediaPostLimitsStaticBuilder() {
    MediaPostLimitsStatic._defaults(this);
  }

  MediaPostLimitsStaticBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _maxSize = $v.maxSize;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaPostLimitsStatic other) {
    _$v = other as _$MediaPostLimitsStatic;
  }

  @override
  void update(void Function(MediaPostLimitsStaticBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaPostLimitsStatic build() => _build();

  _$MediaPostLimitsStatic _build() {
    final _$result = _$v ??
        _$MediaPostLimitsStatic._(
          maxSize: BuiltValueNullFieldError.checkNotNull(
              maxSize, r'MediaPostLimitsStatic', 'maxSize'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
