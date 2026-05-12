// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_video_limits.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MediaVideoLimits extends MediaVideoLimits {
  @override
  final int maxUploadSizeMB;
  @override
  final int maxDurationSeconds;
  @override
  final int maxSize;

  factory _$MediaVideoLimits(
          [void Function(MediaVideoLimitsBuilder)? updates]) =>
      (MediaVideoLimitsBuilder()..update(updates))._build();

  _$MediaVideoLimits._(
      {required this.maxUploadSizeMB,
      required this.maxDurationSeconds,
      required this.maxSize})
      : super._();
  @override
  MediaVideoLimits rebuild(void Function(MediaVideoLimitsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MediaVideoLimitsBuilder toBuilder() =>
      MediaVideoLimitsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MediaVideoLimits &&
        maxUploadSizeMB == other.maxUploadSizeMB &&
        maxDurationSeconds == other.maxDurationSeconds &&
        maxSize == other.maxSize;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, maxUploadSizeMB.hashCode);
    _$hash = $jc(_$hash, maxDurationSeconds.hashCode);
    _$hash = $jc(_$hash, maxSize.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MediaVideoLimits')
          ..add('maxUploadSizeMB', maxUploadSizeMB)
          ..add('maxDurationSeconds', maxDurationSeconds)
          ..add('maxSize', maxSize))
        .toString();
  }
}

class MediaVideoLimitsBuilder
    implements Builder<MediaVideoLimits, MediaVideoLimitsBuilder> {
  _$MediaVideoLimits? _$v;

  int? _maxUploadSizeMB;
  int? get maxUploadSizeMB => _$this._maxUploadSizeMB;
  set maxUploadSizeMB(int? maxUploadSizeMB) =>
      _$this._maxUploadSizeMB = maxUploadSizeMB;

  int? _maxDurationSeconds;
  int? get maxDurationSeconds => _$this._maxDurationSeconds;
  set maxDurationSeconds(int? maxDurationSeconds) =>
      _$this._maxDurationSeconds = maxDurationSeconds;

  int? _maxSize;
  int? get maxSize => _$this._maxSize;
  set maxSize(int? maxSize) => _$this._maxSize = maxSize;

  MediaVideoLimitsBuilder() {
    MediaVideoLimits._defaults(this);
  }

  MediaVideoLimitsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _maxUploadSizeMB = $v.maxUploadSizeMB;
      _maxDurationSeconds = $v.maxDurationSeconds;
      _maxSize = $v.maxSize;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MediaVideoLimits other) {
    _$v = other as _$MediaVideoLimits;
  }

  @override
  void update(void Function(MediaVideoLimitsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MediaVideoLimits build() => _build();

  _$MediaVideoLimits _build() {
    final _$result = _$v ??
        _$MediaVideoLimits._(
          maxUploadSizeMB: BuiltValueNullFieldError.checkNotNull(
              maxUploadSizeMB, r'MediaVideoLimits', 'maxUploadSizeMB'),
          maxDurationSeconds: BuiltValueNullFieldError.checkNotNull(
              maxDurationSeconds, r'MediaVideoLimits', 'maxDurationSeconds'),
          maxSize: BuiltValueNullFieldError.checkNotNull(
              maxSize, r'MediaVideoLimits', 'maxSize'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
