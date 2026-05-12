// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_stats.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UserStats extends UserStats {
  @override
  final int postsCount;
  @override
  final int mediaCount;
  @override
  final int reportsCount;

  factory _$UserStats([void Function(UserStatsBuilder)? updates]) =>
      (UserStatsBuilder()..update(updates))._build();

  _$UserStats._(
      {required this.postsCount,
      required this.mediaCount,
      required this.reportsCount})
      : super._();
  @override
  UserStats rebuild(void Function(UserStatsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserStatsBuilder toBuilder() => UserStatsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserStats &&
        postsCount == other.postsCount &&
        mediaCount == other.mediaCount &&
        reportsCount == other.reportsCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, postsCount.hashCode);
    _$hash = $jc(_$hash, mediaCount.hashCode);
    _$hash = $jc(_$hash, reportsCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserStats')
          ..add('postsCount', postsCount)
          ..add('mediaCount', mediaCount)
          ..add('reportsCount', reportsCount))
        .toString();
  }
}

class UserStatsBuilder implements Builder<UserStats, UserStatsBuilder> {
  _$UserStats? _$v;

  int? _postsCount;
  int? get postsCount => _$this._postsCount;
  set postsCount(int? postsCount) => _$this._postsCount = postsCount;

  int? _mediaCount;
  int? get mediaCount => _$this._mediaCount;
  set mediaCount(int? mediaCount) => _$this._mediaCount = mediaCount;

  int? _reportsCount;
  int? get reportsCount => _$this._reportsCount;
  set reportsCount(int? reportsCount) => _$this._reportsCount = reportsCount;

  UserStatsBuilder() {
    UserStats._defaults(this);
  }

  UserStatsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _postsCount = $v.postsCount;
      _mediaCount = $v.mediaCount;
      _reportsCount = $v.reportsCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserStats other) {
    _$v = other as _$UserStats;
  }

  @override
  void update(void Function(UserStatsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserStats build() => _build();

  _$UserStats _build() {
    final _$result = _$v ??
        _$UserStats._(
          postsCount: BuiltValueNullFieldError.checkNotNull(
              postsCount, r'UserStats', 'postsCount'),
          mediaCount: BuiltValueNullFieldError.checkNotNull(
              mediaCount, r'UserStats', 'mediaCount'),
          reportsCount: BuiltValueNullFieldError.checkNotNull(
              reportsCount, r'UserStats', 'reportsCount'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
