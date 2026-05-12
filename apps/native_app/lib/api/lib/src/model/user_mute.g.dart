// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_mute.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UserMute extends UserMute {
  @override
  final String id;
  @override
  final String userId;
  @override
  final MuteType muteType;
  @override
  final String mutedBy;
  @override
  final DateTime createdAt;
  @override
  final String? reason;
  @override
  final DateTime? expiresAt;

  factory _$UserMute([void Function(UserMuteBuilder)? updates]) =>
      (UserMuteBuilder()..update(updates))._build();

  _$UserMute._(
      {required this.id,
      required this.userId,
      required this.muteType,
      required this.mutedBy,
      required this.createdAt,
      this.reason,
      this.expiresAt})
      : super._();
  @override
  UserMute rebuild(void Function(UserMuteBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserMuteBuilder toBuilder() => UserMuteBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserMute &&
        id == other.id &&
        userId == other.userId &&
        muteType == other.muteType &&
        mutedBy == other.mutedBy &&
        createdAt == other.createdAt &&
        reason == other.reason &&
        expiresAt == other.expiresAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, muteType.hashCode);
    _$hash = $jc(_$hash, mutedBy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserMute')
          ..add('id', id)
          ..add('userId', userId)
          ..add('muteType', muteType)
          ..add('mutedBy', mutedBy)
          ..add('createdAt', createdAt)
          ..add('reason', reason)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class UserMuteBuilder implements Builder<UserMute, UserMuteBuilder> {
  _$UserMute? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  MuteType? _muteType;
  MuteType? get muteType => _$this._muteType;
  set muteType(MuteType? muteType) => _$this._muteType = muteType;

  String? _mutedBy;
  String? get mutedBy => _$this._mutedBy;
  set mutedBy(String? mutedBy) => _$this._mutedBy = mutedBy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  UserMuteBuilder() {
    UserMute._defaults(this);
  }

  UserMuteBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _userId = $v.userId;
      _muteType = $v.muteType;
      _mutedBy = $v.mutedBy;
      _createdAt = $v.createdAt;
      _reason = $v.reason;
      _expiresAt = $v.expiresAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserMute other) {
    _$v = other as _$UserMute;
  }

  @override
  void update(void Function(UserMuteBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserMute build() => _build();

  _$UserMute _build() {
    final _$result = _$v ??
        _$UserMute._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'UserMute', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'UserMute', 'userId'),
          muteType: BuiltValueNullFieldError.checkNotNull(
              muteType, r'UserMute', 'muteType'),
          mutedBy: BuiltValueNullFieldError.checkNotNull(
              mutedBy, r'UserMute', 'mutedBy'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'UserMute', 'createdAt'),
          reason: reason,
          expiresAt: expiresAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
