// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stepup_finish_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StepupFinishRequest extends StepupFinishRequest {
  @override
  final String stepupSessionId;
  @override
  final String clientFinalNonce;
  @override
  final String clientProof;

  factory _$StepupFinishRequest(
          [void Function(StepupFinishRequestBuilder)? updates]) =>
      (StepupFinishRequestBuilder()..update(updates))._build();

  _$StepupFinishRequest._(
      {required this.stepupSessionId,
      required this.clientFinalNonce,
      required this.clientProof})
      : super._();
  @override
  StepupFinishRequest rebuild(
          void Function(StepupFinishRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StepupFinishRequestBuilder toBuilder() =>
      StepupFinishRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StepupFinishRequest &&
        stepupSessionId == other.stepupSessionId &&
        clientFinalNonce == other.clientFinalNonce &&
        clientProof == other.clientProof;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, stepupSessionId.hashCode);
    _$hash = $jc(_$hash, clientFinalNonce.hashCode);
    _$hash = $jc(_$hash, clientProof.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StepupFinishRequest')
          ..add('stepupSessionId', stepupSessionId)
          ..add('clientFinalNonce', clientFinalNonce)
          ..add('clientProof', clientProof))
        .toString();
  }
}

class StepupFinishRequestBuilder
    implements Builder<StepupFinishRequest, StepupFinishRequestBuilder> {
  _$StepupFinishRequest? _$v;

  String? _stepupSessionId;
  String? get stepupSessionId => _$this._stepupSessionId;
  set stepupSessionId(String? stepupSessionId) =>
      _$this._stepupSessionId = stepupSessionId;

  String? _clientFinalNonce;
  String? get clientFinalNonce => _$this._clientFinalNonce;
  set clientFinalNonce(String? clientFinalNonce) =>
      _$this._clientFinalNonce = clientFinalNonce;

  String? _clientProof;
  String? get clientProof => _$this._clientProof;
  set clientProof(String? clientProof) => _$this._clientProof = clientProof;

  StepupFinishRequestBuilder() {
    StepupFinishRequest._defaults(this);
  }

  StepupFinishRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _stepupSessionId = $v.stepupSessionId;
      _clientFinalNonce = $v.clientFinalNonce;
      _clientProof = $v.clientProof;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StepupFinishRequest other) {
    _$v = other as _$StepupFinishRequest;
  }

  @override
  void update(void Function(StepupFinishRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StepupFinishRequest build() => _build();

  _$StepupFinishRequest _build() {
    final _$result = _$v ??
        _$StepupFinishRequest._(
          stepupSessionId: BuiltValueNullFieldError.checkNotNull(
              stepupSessionId, r'StepupFinishRequest', 'stepupSessionId'),
          clientFinalNonce: BuiltValueNullFieldError.checkNotNull(
              clientFinalNonce, r'StepupFinishRequest', 'clientFinalNonce'),
          clientProof: BuiltValueNullFieldError.checkNotNull(
              clientProof, r'StepupFinishRequest', 'clientProof'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
