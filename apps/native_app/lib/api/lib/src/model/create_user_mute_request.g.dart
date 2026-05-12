// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_user_mute_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateUserMuteRequest extends CreateUserMuteRequest {
  @override
  final MuteType muteType;
  @override
  final String? reason;
  @override
  final DateTime? expiresAt;

  factory _$CreateUserMuteRequest(
          [void Function(CreateUserMuteRequestBuilder)? updates]) =>
      (CreateUserMuteRequestBuilder()..update(updates))._build();

  _$CreateUserMuteRequest._(
      {required this.muteType, this.reason, this.expiresAt})
      : super._();
  @override
  CreateUserMuteRequest rebuild(
          void Function(CreateUserMuteRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateUserMuteRequestBuilder toBuilder() =>
      CreateUserMuteRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateUserMuteRequest &&
        muteType == other.muteType &&
        reason == other.reason &&
        expiresAt == other.expiresAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, muteType.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateUserMuteRequest')
          ..add('muteType', muteType)
          ..add('reason', reason)
          ..add('expiresAt', expiresAt))
        .toString();
  }
}

class CreateUserMuteRequestBuilder
    implements Builder<CreateUserMuteRequest, CreateUserMuteRequestBuilder> {
  _$CreateUserMuteRequest? _$v;

  MuteType? _muteType;
  MuteType? get muteType => _$this._muteType;
  set muteType(MuteType? muteType) => _$this._muteType = muteType;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  CreateUserMuteRequestBuilder() {
    CreateUserMuteRequest._defaults(this);
  }

  CreateUserMuteRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _muteType = $v.muteType;
      _reason = $v.reason;
      _expiresAt = $v.expiresAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateUserMuteRequest other) {
    _$v = other as _$CreateUserMuteRequest;
  }

  @override
  void update(void Function(CreateUserMuteRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateUserMuteRequest build() => _build();

  _$CreateUserMuteRequest _build() {
    final _$result = _$v ??
        _$CreateUserMuteRequest._(
          muteType: BuiltValueNullFieldError.checkNotNull(
              muteType, r'CreateUserMuteRequest', 'muteType'),
          reason: reason,
          expiresAt: expiresAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
