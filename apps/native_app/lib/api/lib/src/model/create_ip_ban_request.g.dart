// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_ip_ban_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateIPBanRequest extends CreateIPBanRequest {
  @override
  final String ipAddress;
  @override
  final String? reason;
  @override
  final DateTime? expiresAt;

  factory _$CreateIPBanRequest(
          [void Function(CreateIPBanRequestBuilder)? updates]) =>
      (CreateIPBanRequestBuilder()..update(updates))._build();

  _$CreateIPBanRequest._({required this.ipAddress, this.reason, this.expiresAt})
      : super._();
  @override
  CreateIPBanRequest rebuild(
          void Function(CreateIPBanRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateIPBanRequestBuilder toBuilder() =>
      CreateIPBanRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateIPBanRequest &&
        ipAddress == other.ipAddress &&
        reason == other.reason &&
        expiresAt == other.expiresAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ipAddress.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateIPBanRequest')
          ..add('ipAddress', ipAddress)
          ..add('reason', reason)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class CreateIPBanRequestBuilder
    implements Builder<CreateIPBanRequest, CreateIPBanRequestBuilder> {
  _$CreateIPBanRequest? _$v;

  String? _ipAddress;
  String? get ipAddress => _$this._ipAddress;
  set ipAddress(String? ipAddress) => _$this._ipAddress = ipAddress;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  CreateIPBanRequestBuilder() {
    CreateIPBanRequest._defaults(this);
  }

  CreateIPBanRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ipAddress = $v.ipAddress;
      _reason = $v.reason;
      _expiresAt = $v.expiresAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateIPBanRequest other) {
    _$v = other as _$CreateIPBanRequest;
  }

  @override
  void update(void Function(CreateIPBanRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateIPBanRequest build() => _build();

  _$CreateIPBanRequest _build() {
    final _$result = _$v ??
        _$CreateIPBanRequest._(
          ipAddress: BuiltValueNullFieldError.checkNotNull(
              ipAddress, r'CreateIPBanRequest', 'ipAddress'),
          reason: reason,
          expiresAt: expiresAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
