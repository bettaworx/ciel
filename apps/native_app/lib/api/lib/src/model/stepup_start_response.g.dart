// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stepup_start_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StepupStartResponse extends StepupStartResponse {
  @override
  final String stepupSessionId;
  @override
  final String salt;
  @override
  final int iterations;
  @override
  final String serverNonce;
  @override
  final int expiresInSeconds;

  factory _$StepupStartResponse(
          [void Function(StepupStartResponseBuilder)? updates]) =>
      (StepupStartResponseBuilder()..update(updates))._build();

  _$StepupStartResponse._(
      {required this.stepupSessionId,
      required this.salt,
      required this.iterations,
      required this.serverNonce,
      required this.expiresInSeconds})
      : super._();
  @override
  StepupStartResponse rebuild(
          void Function(StepupStartResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StepupStartResponseBuilder toBuilder() =>
      StepupStartResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StepupStartResponse &&
        stepupSessionId == other.stepupSessionId &&
        salt == other.salt &&
        iterations == other.iterations &&
        serverNonce == other.serverNonce &&
        expiresInSeconds == other.expiresInSeconds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, stepupSessionId.hashCode);
    _$hash = $jc(_$hash, salt.hashCode);
    _$hash = $jc(_$hash, iterations.hashCode);
    _$hash = $jc(_$hash, serverNonce.hashCode);
    _$hash = $jc(_$hash, expiresInSeconds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StepupStartResponse')
          ..add('stepupSessionId', stepupSessionId)
          ..add('salt', salt)
          ..add('iterations', iterations)
          ..add('serverNonce', serverNonce)
          ..add('expiresInSeconds', expiresInSeconds))
        .toString();
  }
}

class StepupStartResponseBuilder
    implements Builder<StepupStartResponse, StepupStartResponseBuilder> {
  _$StepupStartResponse? _$v;

  String? _stepupSessionId;
  String? get stepupSessionId => _$this._stepupSessionId;
  set stepupSessionId(String? stepupSessionId) =>
      _$this._stepupSessionId = stepupSessionId;

  String? _salt;
  String? get salt => _$this._salt;
  set salt(String? salt) => _$this._salt = salt;

  int? _iterations;
  int? get iterations => _$this._iterations;
  set iterations(int? iterations) => _$this._iterations = iterations;

  String? _serverNonce;
  String? get serverNonce => _$this._serverNonce;
  set serverNonce(String? serverNonce) => _$this._serverNonce = serverNonce;

  int? _expiresInSeconds;
  int? get expiresInSeconds => _$this._expiresInSeconds;
  set expiresInSeconds(int? expiresInSeconds) =>
      _$this._expiresInSeconds = expiresInSeconds;

  StepupStartResponseBuilder() {
    StepupStartResponse._defaults(this);
  }

  StepupStartResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _stepupSessionId = $v.stepupSessionId;
      _salt = $v.salt;
      _iterations = $v.iterations;
      _serverNonce = $v.serverNonce;
      _expiresInSeconds = $v.expiresInSeconds;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StepupStartResponse other) {
    _$v = other as _$StepupStartResponse;
  }

  @override
  void update(void Function(StepupStartResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StepupStartResponse build() => _build();

  _$StepupStartResponse _build() {
    final _$result = _$v ??
        _$StepupStartResponse._(
          stepupSessionId: BuiltValueNullFieldError.checkNotNull(
              stepupSessionId, r'StepupStartResponse', 'stepupSessionId'),
          salt: BuiltValueNullFieldError.checkNotNull(
              salt, r'StepupStartResponse', 'salt'),
          iterations: BuiltValueNullFieldError.checkNotNull(
              iterations, r'StepupStartResponse', 'iterations'),
          serverNonce: BuiltValueNullFieldError.checkNotNull(
              serverNonce, r'StepupStartResponse', 'serverNonce'),
          expiresInSeconds: BuiltValueNullFieldError.checkNotNull(
              expiresInSeconds, r'StepupStartResponse', 'expiresInSeconds'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
