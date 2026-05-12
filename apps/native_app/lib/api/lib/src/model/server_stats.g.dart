// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_stats.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ServerStats extends ServerStats {
  @override
  final int userCount;
  @override
  final int postCount;

  factory _$ServerStats([void Function(ServerStatsBuilder)? updates]) =>
      (ServerStatsBuilder()..update(updates))._build();

  _$ServerStats._({required this.userCount, required this.postCount})
      : super._();
  @override
  ServerStats rebuild(void Function(ServerStatsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerStatsBuilder toBuilder() => ServerStatsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerStats &&
        userCount == other.userCount &&
        postCount == other.postCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, userCount.hashCode);
    _$hash = $jc(_$hash, postCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerStats')
          ..add('userCount', userCount)
          ..add('postCount', postCount))
        .toString();
  }
}

class ServerStatsBuilder implements Builder<ServerStats, ServerStatsBuilder> {
  _$ServerStats? _$v;

  int? _userCount;
  int? get userCount => _$this._userCount;
  set userCount(int? userCount) => _$this._userCount = userCount;

  int? _postCount;
  int? get postCount => _$this._postCount;
  set postCount(int? postCount) => _$this._postCount = postCount;

  ServerStatsBuilder() {
    ServerStats._defaults(this);
  }

  ServerStatsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _userCount = $v.userCount;
      _postCount = $v.postCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerStats other) {
    _$v = other as _$ServerStats;
  }

  @override
  void update(void Function(ServerStatsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerStats build() => _build();

  _$ServerStats _build() {
    final _$result = _$v ??
        _$ServerStats._(
          userCount: BuiltValueNullFieldError.checkNotNull(
              userCount, r'ServerStats', 'userCount'),
          postCount: BuiltValueNullFieldError.checkNotNull(
              postCount, r'ServerStats', 'postCount'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
