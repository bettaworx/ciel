// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stepup_start_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StepupStartRequest extends StepupStartRequest {
  @override
  final String clientNonce;

  factory _$StepupStartRequest(
          [void Function(StepupStartRequestBuilder)? updates]) =>
      (StepupStartRequestBuilder()..update(updates))._build();

  _$StepupStartRequest._({required this.clientNonce}) : super._();
  @override
  StepupStartRequest rebuild(
          void Function(StepupStartRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StepupStartRequestBuilder toBuilder() =>
      StepupStartRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StepupStartRequest && clientNonce == other.clientNonce;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, clientNonce.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StepupStartRequest')
          ..add('clientNonce', clientNonce))
        .toString();
  }
}

class StepupStartRequestBuilder
    implements Builder<StepupStartRequest, StepupStartRequestBuilder> {
  _$StepupStartRequest? _$v;

  String? _clientNonce;
  String? get clientNonce => _$this._clientNonce;
  set clientNonce(String? clientNonce) => _$this._clientNonce = clientNonce;

  StepupStartRequestBuilder() {
    StepupStartRequest._defaults(this);
  }

  StepupStartRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _clientNonce = $v.clientNonce;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StepupStartRequest other) {
    _$v = other as _$StepupStartRequest;
  }

  @override
  void update(void Function(StepupStartRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StepupStartRequest build() => _build();

  _$StepupStartRequest _build() {
    final _$result = _$v ??
        _$StepupStartRequest._(
          clientNonce: BuiltValueNullFieldError.checkNotNull(
              clientNonce, r'StepupStartRequest', 'clientNonce'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
