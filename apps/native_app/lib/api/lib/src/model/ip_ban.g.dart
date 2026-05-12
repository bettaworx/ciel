// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ip_ban.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$IPBan extends IPBan {
  @override
  final String id;
  @override
  final String ipAddress;
  @override
  final String bannedBy;
  @override
  final DateTime createdAt;
  @override
  final String? reason;
  @override
  final DateTime? expiresAt;

  factory _$IPBan([void Function(IPBanBuilder)? updates]) =>
      (IPBanBuilder()..update(updates))._build();

  _$IPBan._(
      {required this.id,
      required this.ipAddress,
      required this.bannedBy,
      required this.createdAt,
      this.reason,
      this.expiresAt})
      : super._();
  @override
  IPBan rebuild(void Function(IPBanBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  IPBanBuilder toBuilder() => IPBanBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is IPBan &&
        id == other.id &&
        ipAddress == other.ipAddress &&
        bannedBy == other.bannedBy &&
        createdAt == other.createdAt &&
        reason == other.reason &&
        expiresAt == other.expiresAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, ipAddress.hashCode);
    _$hash = $jc(_$hash, bannedBy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'IPBan')
          ..add('id', id)
          ..add('ipAddress', ipAddress)
          ..add('bannedBy', bannedBy)
          ..add('createdAt', createdAt)
          ..add('reason', reason)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class IPBanBuilder implements Builder<IPBan, IPBanBuilder> {
  _$IPBan? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _ipAddress;
  String? get ipAddress => _$this._ipAddress;
  set ipAddress(String? ipAddress) => _$this._ipAddress = ipAddress;

  String? _bannedBy;
  String? get bannedBy => _$this._bannedBy;
  set bannedBy(String? bannedBy) => _$this._bannedBy = bannedBy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  IPBanBuilder() {
    IPBan._defaults(this);
  }

  IPBanBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _ipAddress = $v.ipAddress;
      _bannedBy = $v.bannedBy;
      _createdAt = $v.createdAt;
      _reason = $v.reason;
      _expiresAt = $v.expiresAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(IPBan other) {
    _$v = other as _$IPBan;
  }

  @override
  void update(void Function(IPBanBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  IPBan build() => _build();

  _$IPBan _build() {
    final _$result = _$v ??
        _$IPBan._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'IPBan', 'id'),
          ipAddress: BuiltValueNullFieldError.checkNotNull(
              ipAddress, r'IPBan', 'ipAddress'),
          bannedBy: BuiltValueNullFieldError.checkNotNull(
              bannedBy, r'IPBan', 'bannedBy'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'IPBan', 'createdAt'),
          reason: reason,
          expiresAt: expiresAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
