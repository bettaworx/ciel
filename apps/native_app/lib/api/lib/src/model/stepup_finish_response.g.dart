// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stepup_finish_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const StepupFinishResponseTokenTypeEnum
    _$stepupFinishResponseTokenTypeEnum_stepup =
    const StepupFinishResponseTokenTypeEnum._('stepup');

StepupFinishResponseTokenTypeEnum _$stepupFinishResponseTokenTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'stepup':
      return _$stepupFinishResponseTokenTypeEnum_stepup;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<StepupFinishResponseTokenTypeEnum>
    _$stepupFinishResponseTokenTypeEnumValues = BuiltSet<
        StepupFinishResponseTokenTypeEnum>(const <StepupFinishResponseTokenTypeEnum>[
  _$stepupFinishResponseTokenTypeEnum_stepup,
]);

Serializer<StepupFinishResponseTokenTypeEnum>
    _$stepupFinishResponseTokenTypeEnumSerializer =
    _$StepupFinishResponseTokenTypeEnumSerializer();

class _$StepupFinishResponseTokenTypeEnumSerializer
    implements PrimitiveSerializer<StepupFinishResponseTokenTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'stepup': 'Stepup',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'Stepup': 'stepup',
  };

  @override
  final Iterable<Type> types = const <Type>[StepupFinishResponseTokenTypeEnum];
  @override
  final String wireName = 'StepupFinishResponseTokenTypeEnum';

  @override
  Object serialize(
          Serializers serializers, StepupFinishResponseTokenTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  StepupFinishResponseTokenTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      StepupFinishResponseTokenTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$StepupFinishResponse extends StepupFinishResponse {
  @override
  final String stepupToken;
  @override
  final StepupFinishResponseTokenTypeEnum tokenType;
  @override
  final int expiresInSeconds;

  factory _$StepupFinishResponse(
          [void Function(StepupFinishResponseBuilder)? updates]) =>
      (StepupFinishResponseBuilder()..update(updates))._build();

  _$StepupFinishResponse._(
      {required this.stepupToken,
      required this.tokenType,
      required this.expiresInSeconds})
      : super._();
  @override
  StepupFinishResponse rebuild(
          void Function(StepupFinishResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StepupFinishResponseBuilder toBuilder() =>
      StepupFinishResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StepupFinishResponse &&
        stepupToken == other.stepupToken &&
        tokenType == other.tokenType &&
        expiresInSeconds == other.expiresInSeconds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, stepupToken.hashCode);
    _$hash = $jc(_$hash, tokenType.hashCode);
    _$hash = $jc(_$hash, expiresInSeconds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StepupFinishResponse')
          ..add('stepupToken', stepupToken)
          ..add('tokenType', tokenType)
          ..add('expiresInSeconds', expiresInSeconds))
        .toString();
  }
}

class StepupFinishResponseBuilder
    implements Builder<StepupFinishResponse, StepupFinishResponseBuilder> {
  _$StepupFinishResponse? _$v;

  String? _stepupToken;
  String? get stepupToken => _$this._stepupToken;
  set stepupToken(String? stepupToken) => _$this._stepupToken = stepupToken;

  StepupFinishResponseTokenTypeEnum? _tokenType;
  StepupFinishResponseTokenTypeEnum? get tokenType => _$this._tokenType;
  set tokenType(StepupFinishResponseTokenTypeEnum? tokenType) =>
      _$this._tokenType = tokenType;

  int? _expiresInSeconds;
  int? get expiresInSeconds => _$this._expiresInSeconds;
  set expiresInSeconds(int? expiresInSeconds) =>
      _$this._expiresInSeconds = expiresInSeconds;

  StepupFinishResponseBuilder() {
    StepupFinishResponse._defaults(this);
  }

  StepupFinishResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _stepupToken = $v.stepupToken;
      _tokenType = $v.tokenType;
      _expiresInSeconds = $v.expiresInSeconds;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StepupFinishResponse other) {
    _$v = other as _$StepupFinishResponse;
  }

  @override
  void update(void Function(StepupFinishResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StepupFinishResponse build() => _build();

  _$StepupFinishResponse _build() {
    final _$result = _$v ??
        _$StepupFinishResponse._(
          stepupToken: BuiltValueNullFieldError.checkNotNull(
              stepupToken, r'StepupFinishResponse', 'stepupToken'),
          tokenType: BuiltValueNullFieldError.checkNotNull(
              tokenType, r'StepupFinishResponse', 'tokenType'),
          expiresInSeconds: BuiltValueNullFieldError.checkNotNull(
              expiresInSeconds, r'StepupFinishResponse', 'expiresInSeconds'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
