// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'moderation_log.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ModerationLog extends ModerationLog {
  @override
  final String id;
  @override
  final String? adminUserId;
  @override
  final ModerationAction action;
  @override
  final ModerationTargetType targetType;
  @override
  final String targetId;
  @override
  final DateTime createdAt;
  @override
  final String? adminUsername;
  @override
  final String? adminDisplayName;
  @override
  final JsonObject? details;

  factory _$ModerationLog([void Function(ModerationLogBuilder)? updates]) =>
      (ModerationLogBuilder()..update(updates))._build();

  _$ModerationLog._(
      {required this.id,
      this.adminUserId,
      required this.action,
      required this.targetType,
      required this.targetId,
      required this.createdAt,
      this.adminUsername,
      this.adminDisplayName,
      this.details})
      : super._();
  @override
  ModerationLog rebuild(void Function(ModerationLogBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ModerationLogBuilder toBuilder() => ModerationLogBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ModerationLog &&
        id == other.id &&
        adminUserId == other.adminUserId &&
        action == other.action &&
        targetType == other.targetType &&
        targetId == other.targetId &&
        createdAt == other.createdAt &&
        adminUsername == other.adminUsername &&
        adminDisplayName == other.adminDisplayName &&
        details == other.details;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, adminUserId.hashCode);
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jc(_$hash, targetType.hashCode);
    _$hash = $jc(_$hash, targetId.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, adminUsername.hashCode);
    _$hash = $jc(_$hash, adminDisplayName.hashCode);
    _$hash = $jc(_$hash, details.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ModerationLog')
          ..add('id', id)
          ..add('adminUserId', adminUserId)
          ..add('action', action)
          ..add('targetType', targetType)
          ..add('targetId', targetId)
          ..add('createdAt', createdAt)
          ..add('adminUsername', adminUsername)
          ..add('adminDisplayName', adminDisplayName)
          ..add('details', details))
        .toString();
  }
}

class ModerationLogBuilder
    implements Builder<ModerationLog, ModerationLogBuilder> {
  _$ModerationLog? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _adminUserId;
  String? get adminUserId => _$this._adminUserId;
  set adminUserId(String? adminUserId) => _$this._adminUserId = adminUserId;

  ModerationAction? _action;
  ModerationAction? get action => _$this._action;
  set action(ModerationAction? action) => _$this._action = action;

  ModerationTargetType? _targetType;
  ModerationTargetType? get targetType => _$this._targetType;
  set targetType(ModerationTargetType? targetType) =>
      _$this._targetType = targetType;

  String? _targetId;
  String? get targetId => _$this._targetId;
  set targetId(String? targetId) => _$this._targetId = targetId;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  String? _adminUsername;
  String? get adminUsername => _$this._adminUsername;
  set adminUsername(String? adminUsername) =>
      _$this._adminUsername = adminUsername;

  String? _adminDisplayName;
  String? get adminDisplayName => _$this._adminDisplayName;
  set adminDisplayName(String? adminDisplayName) =>
      _$this._adminDisplayName = adminDisplayName;

  JsonObject? _details;
  JsonObject? get details => _$this._details;
  set details(JsonObject? details) => _$this._details = details;

  ModerationLogBuilder() {
    ModerationLog._defaults(this);
  }

  ModerationLogBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _adminUserId = $v.adminUserId;
      _action = $v.action;
      _targetType = $v.targetType;
      _targetId = $v.targetId;
      _createdAt = $v.createdAt;
      _adminUsername = $v.adminUsername;
      _adminDisplayName = $v.adminDisplayName;
      _details = $v.details;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ModerationLog other) {
    _$v = other as _$ModerationLog;
  }

  @override
  void update(void Function(ModerationLogBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ModerationLog build() => _build();

  _$ModerationLog _build() {
    final _$result = _$v ??
        _$ModerationLog._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'ModerationLog', 'id'),
          adminUserId: adminUserId,
          action: BuiltValueNullFieldError.checkNotNull(
              action, r'ModerationLog', 'action'),
          targetType: BuiltValueNullFieldError.checkNotNull(
              targetType, r'ModerationLog', 'targetType'),
          targetId: BuiltValueNullFieldError.checkNotNull(
              targetId, r'ModerationLog', 'targetId'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'ModerationLog', 'createdAt'),
          adminUsername: adminUsername,
          adminDisplayName: adminDisplayName,
          details: details,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
