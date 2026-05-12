// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_stats.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DashboardStats extends DashboardStats {
  @override
  final int totalUsers;
  @override
  final int totalPosts;
  @override
  final int totalMedia;

  factory _$DashboardStats([void Function(DashboardStatsBuilder)? updates]) =>
      (DashboardStatsBuilder()..update(updates))._build();

  _$DashboardStats._(
      {required this.totalUsers,
      required this.totalPosts,
      required this.totalMedia})
      : super._();
  @override
  DashboardStats rebuild(void Function(DashboardStatsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DashboardStatsBuilder toBuilder() => DashboardStatsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DashboardStats &&
        totalUsers == other.totalUsers &&
        totalPosts == other.totalPosts &&
        totalMedia == other.totalMedia;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, totalUsers.hashCode);
    _$hash = $jc(_$hash, totalPosts.hashCode);
    _$hash = $jc(_$hash, totalMedia.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DashboardStats')
          ..add('totalUsers', totalUsers)
          ..add('totalPosts', totalPosts)
          ..add('totalMedia', totalMedia))
        .toString();
  }
}

class DashboardStatsBuilder
    implements Builder<DashboardStats, DashboardStatsBuilder> {
  _$DashboardStats? _$v;

  int? _totalUsers;
  int? get totalUsers => _$this._totalUsers;
  set totalUsers(int? totalUsers) => _$this._totalUsers = totalUsers;

  int? _totalPosts;
  int? get totalPosts => _$this._totalPosts;
  set totalPosts(int? totalPosts) => _$this._totalPosts = totalPosts;

  int? _totalMedia;
  int? get totalMedia => _$this._totalMedia;
  set totalMedia(int? totalMedia) => _$this._totalMedia = totalMedia;

  DashboardStatsBuilder() {
    DashboardStats._defaults(this);
  }

  DashboardStatsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _totalUsers = $v.totalUsers;
      _totalPosts = $v.totalPosts;
      _totalMedia = $v.totalMedia;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DashboardStats other) {
    _$v = other as _$DashboardStats;
  }

  @override
  void update(void Function(DashboardStatsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DashboardStats build() => _build();

  _$DashboardStats _build() {
    final _$result = _$v ??
        _$DashboardStats._(
          totalUsers: BuiltValueNullFieldError.checkNotNull(
              totalUsers, r'DashboardStats', 'totalUsers'),
          totalPosts: BuiltValueNullFieldError.checkNotNull(
              totalPosts, r'DashboardStats', 'totalPosts'),
          totalMedia: BuiltValueNullFieldError.checkNotNull(
              totalMedia, r'DashboardStats', 'totalMedia'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
