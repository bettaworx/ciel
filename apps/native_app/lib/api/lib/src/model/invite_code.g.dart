// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invite_code.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

abstract class InviteCodeBuilder {
  void replace(InviteCode other);
  void update(void Function(InviteCodeBuilder) updates);
  String? get id;
  set id(String? id);

  String? get code;
  set code(String? code);

  String? get createdBy;
  set createdBy(String? createdBy);

  DateTime? get createdAt;
  set createdAt(DateTime? createdAt);

  int? get useCount;
  set useCount(int? useCount);

  bool? get disabled;
  set disabled(bool? disabled);

  DateTime? get lastUsedAt;
  set lastUsedAt(DateTime? lastUsedAt);

  int? get maxUses;
  set maxUses(int? maxUses);

  DateTime? get expiresAt;
  set expiresAt(DateTime? expiresAt);

  String? get note;
  set note(String? note);
}

class _$$InviteCode extends $InviteCode {
  @override
  final String id;
  @override
  final String code;
  @override
  final String createdBy;
  @override
  final DateTime createdAt;
  @override
  final int useCount;
  @override
  final bool disabled;
  @override
  final DateTime? lastUsedAt;
  @override
  final int? maxUses;
  @override
  final DateTime? expiresAt;
  @override
  final String? note;

  factory _$$InviteCode([void Function($InviteCodeBuilder)? updates]) =>
      ($InviteCodeBuilder()..update(updates))._build();

  _$$InviteCode._(
      {required this.id,
      required this.code,
      required this.createdBy,
      required this.createdAt,
      required this.useCount,
      required this.disabled,
      this.lastUsedAt,
      this.maxUses,
      this.expiresAt,
      this.note})
      : super._();
  @override
  $InviteCode rebuild(void Function($InviteCodeBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  $InviteCodeBuilder toBuilder() => $InviteCodeBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is $InviteCode &&
        id == other.id &&
        code == other.code &&
        createdBy == other.createdBy &&
        createdAt == other.createdAt &&
        useCount == other.useCount &&
        disabled == other.disabled &&
        lastUsedAt == other.lastUsedAt &&
        maxUses == other.maxUses &&
        expiresAt == other.expiresAt &&
        note == other.note;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jc(_$hash, createdBy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, useCount.hashCode);
    _$hash = $jc(_$hash, disabled.hashCode);
    _$hash = $jc(_$hash, lastUsedAt.hashCode);
    _$hash = $jc(_$hash, maxUses.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, note.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'$InviteCode')
          ..add('id', id)
          ..add('code', code)
          ..add('createdBy', createdBy)
          ..add('createdAt', createdAt)
          ..add('useCount', useCount)
          ..add('disabled', disabled)
          ..add('lastUsedAt', lastUsedAt)
          ..add('maxUses', maxUses)
          ..add('expiresAt', expiresAt)
          ..add('note', note))
        .toString();
  }
}

class $InviteCodeBuilder
    implements Builder<$InviteCode, $InviteCodeBuilder>, InviteCodeBuilder {
  _$$InviteCode? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(covariant String? id) => _$this._id = id;

  String? _code;
  String? get code => _$this._code;
  set code(covariant String? code) => _$this._code = code;

  String? _createdBy;
  String? get createdBy => _$this._createdBy;
  set createdBy(covariant String? createdBy) => _$this._createdBy = createdBy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(covariant DateTime? createdAt) => _$this._createdAt = createdAt;

  int? _useCount;
  int? get useCount => _$this._useCount;
  set useCount(covariant int? useCount) => _$this._useCount = useCount;

  bool? _disabled;
  bool? get disabled => _$this._disabled;
  set disabled(covariant bool? disabled) => _$this._disabled = disabled;

  DateTime? _lastUsedAt;
  DateTime? get lastUsedAt => _$this._lastUsedAt;
  set lastUsedAt(covariant DateTime? lastUsedAt) =>
      _$this._lastUsedAt = lastUsedAt;

  int? _maxUses;
  int? get maxUses => _$this._maxUses;
  set maxUses(covariant int? maxUses) => _$this._maxUses = maxUses;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(covariant DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  String? _note;
  String? get note => _$this._note;
  set note(covariant String? note) => _$this._note = note;

  $InviteCodeBuilder() {
    $InviteCode._defaults(this);
  }

  $InviteCodeBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _code = $v.code;
      _createdBy = $v.createdBy;
      _createdAt = $v.createdAt;
      _useCount = $v.useCount;
      _disabled = $v.disabled;
      _lastUsedAt = $v.lastUsedAt;
      _maxUses = $v.maxUses;
      _expiresAt = $v.expiresAt;
      _note = $v.note;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(covariant $InviteCode other) {
    _$v = other as _$$InviteCode;
  }

  @override
  void update(void Function($InviteCodeBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  $InviteCode build() => _build();

  _$$InviteCode _build() {
    final _$result = _$v ??
        _$$InviteCode._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'$InviteCode', 'id'),
          code: BuiltValueNullFieldError.checkNotNull(
              code, r'$InviteCode', 'code'),
          createdBy: BuiltValueNullFieldError.checkNotNull(
              createdBy, r'$InviteCode', 'createdBy'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'$InviteCode', 'createdAt'),
          useCount: BuiltValueNullFieldError.checkNotNull(
              useCount, r'$InviteCode', 'useCount'),
          disabled: BuiltValueNullFieldError.checkNotNull(
              disabled, r'$InviteCode', 'disabled'),
          lastUsedAt: lastUsedAt,
          maxUses: maxUses,
          expiresAt: expiresAt,
          note: note,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
