// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_finish_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LoginFinishResponseTokenTypeEnum
    _$loginFinishResponseTokenTypeEnum_bearer =
    const LoginFinishResponseTokenTypeEnum._('bearer');

LoginFinishResponseTokenTypeEnum _$loginFinishResponseTokenTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'bearer':
      return _$loginFinishResponseTokenTypeEnum_bearer;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<LoginFinishResponseTokenTypeEnum>
    _$loginFinishResponseTokenTypeEnumValues = BuiltSet<
        LoginFinishResponseTokenTypeEnum>(const <LoginFinishResponseTokenTypeEnum>[
  _$loginFinishResponseTokenTypeEnum_bearer,
]);

Serializer<LoginFinishResponseTokenTypeEnum>
    _$loginFinishResponseTokenTypeEnumSerializer =
    _$LoginFinishResponseTokenTypeEnumSerializer();

class _$LoginFinishResponseTokenTypeEnumSerializer
    implements PrimitiveSerializer<LoginFinishResponseTokenTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'bearer': 'Bearer',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'Bearer': 'bearer',
  };

  @override
  final Iterable<Type> types = const <Type>[LoginFinishResponseTokenTypeEnum];
  @override
  final String wireName = 'LoginFinishResponseTokenTypeEnum';

  @override
  Object serialize(
          Serializers serializers, LoginFinishResponseTokenTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LoginFinishResponseTokenTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LoginFinishResponseTokenTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LoginFinishResponse extends LoginFinishResponse {
  @override
  final String accessToken;
  @override
  final LoginFinishResponseTokenTypeEnum tokenType;
  @override
  final int expiresInSeconds;
  @override
  final User user;

  factory _$LoginFinishResponse(
          [void Function(LoginFinishResponseBuilder)? updates]) =>
      (LoginFinishResponseBuilder()..update(updates))._build();

  _$LoginFinishResponse._(
      {required this.accessToken,
      required this.tokenType,
      required this.expiresInSeconds,
      required this.user})
      : super._();
  @override
  LoginFinishResponse rebuild(
          void Function(LoginFinishResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LoginFinishResponseBuilder toBuilder() =>
      LoginFinishResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LoginFinishResponse &&
        accessToken == other.accessToken &&
        tokenType == other.tokenType &&
        expiresInSeconds == other.expiresInSeconds &&
        user == other.user;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, accessToken.hashCode);
    _$hash = $jc(_$hash, tokenType.hashCode);
    _$hash = $jc(_$hash, expiresInSeconds.hashCode);
    _$hash = $jc(_$hash, user.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LoginFinishResponse')
          ..add('accessToken', accessToken)
          ..add('tokenType', tokenType)
          ..add('expiresInSeconds', expiresInSeconds)
          ..add('user', user))
        .toString();
  }
}

class LoginFinishResponseBuilder
    implements Builder<LoginFinishResponse, LoginFinishResponseBuilder> {
  _$LoginFinishResponse? _$v;

  String? _accessToken;
  String? get accessToken => _$this._accessToken;
  set accessToken(String? accessToken) => _$this._accessToken = accessToken;

  LoginFinishResponseTokenTypeEnum? _tokenType;
  LoginFinishResponseTokenTypeEnum? get tokenType => _$this._tokenType;
  set tokenType(LoginFinishResponseTokenTypeEnum? tokenType) =>
      _$this._tokenType = tokenType;

  int? _expiresInSeconds;
  int? get expiresInSeconds => _$this._expiresInSeconds;
  set expiresInSeconds(int? expiresInSeconds) =>
      _$this._expiresInSeconds = expiresInSeconds;

  User? _user;
  User? get user => _$this._user;
  set user(User? user) => _$this._user = user;

  LoginFinishResponseBuilder() {
    LoginFinishResponse._defaults(this);
  }

  LoginFinishResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _accessToken = $v.accessToken;
      _tokenType = $v.tokenType;
      _expiresInSeconds = $v.expiresInSeconds;
      _user = $v.user;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LoginFinishResponse other) {
    _$v = other as _$LoginFinishResponse;
  }

  @override
  void update(void Function(LoginFinishResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LoginFinishResponse build() => _build();

  _$LoginFinishResponse _build() {
    final _$result = _$v ??
        _$LoginFinishResponse._(
          accessToken: BuiltValueNullFieldError.checkNotNull(
              accessToken, r'LoginFinishResponse', 'accessToken'),
          tokenType: BuiltValueNullFieldError.checkNotNull(
              tokenType, r'LoginFinishResponse', 'tokenType'),
          expiresInSeconds: BuiltValueNullFieldError.checkNotNull(
              expiresInSeconds, r'LoginFinishResponse', 'expiresInSeconds'),
          user: BuiltValueNullFieldError.checkNotNull(
              user, r'LoginFinishResponse', 'user'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
