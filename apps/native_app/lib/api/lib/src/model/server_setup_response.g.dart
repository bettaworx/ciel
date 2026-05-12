// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_setup_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ServerSetupResponse extends ServerSetupResponse {
  @override
  final bool success;

  factory _$ServerSetupResponse(
          [void Function(ServerSetupResponseBuilder)? updates]) =>
      (ServerSetupResponseBuilder()..update(updates))._build();

  _$ServerSetupResponse._({required this.success}) : super._();
  @override
  ServerSetupResponse rebuild(
          void Function(ServerSetupResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ServerSetupResponseBuilder toBuilder() =>
      ServerSetupResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ServerSetupResponse && success == other.success;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, success.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ServerSetupResponse')
          ..add('success', success))
        .toString();
  }
}

class ServerSetupResponseBuilder
    implements Builder<ServerSetupResponse, ServerSetupResponseBuilder> {
  _$ServerSetupResponse? _$v;

  bool? _success;
  bool? get success => _$this._success;
  set success(bool? success) => _$this._success = success;

  ServerSetupResponseBuilder() {
    ServerSetupResponse._defaults(this);
  }

  ServerSetupResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _success = $v.success;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ServerSetupResponse other) {
    _$v = other as _$ServerSetupResponse;
  }

  @override
  void update(void Function(ServerSetupResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ServerSetupResponse build() => _build();

  _$ServerSetupResponse _build() {
    final _$result = _$v ??
        _$ServerSetupResponse._(
          success: BuiltValueNullFieldError.checkNotNull(
              success, r'ServerSetupResponse', 'success'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
