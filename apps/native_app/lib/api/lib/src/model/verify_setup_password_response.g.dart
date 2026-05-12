// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'verify_setup_password_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$VerifySetupPasswordResponse extends VerifySetupPasswordResponse {
  @override
  final bool valid;
  @override
  final String? setupToken;

  factory _$VerifySetupPasswordResponse(
          [void Function(VerifySetupPasswordResponseBuilder)? updates]) =>
      (VerifySetupPasswordResponseBuilder()..update(updates))._build();

  _$VerifySetupPasswordResponse._({required this.valid, this.setupToken})
      : super._();
  @override
  VerifySetupPasswordResponse rebuild(
          void Function(VerifySetupPasswordResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  VerifySetupPasswordResponseBuilder toBuilder() =>
      VerifySetupPasswordResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is VerifySetupPasswordResponse &&
        valid == other.valid &&
        setupToken == other.setupToken;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, valid.hashCode);
    _$hash = $jc(_$hash, setupToken.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'VerifySetupPasswordResponse')
          ..add('valid', valid)
          ..add('setupToken', setupToken))
        .toString();
  }
}

class VerifySetupPasswordResponseBuilder
    implements
        Builder<VerifySetupPasswordResponse,
            VerifySetupPasswordResponseBuilder> {
  _$VerifySetupPasswordResponse? _$v;

  bool? _valid;
  bool? get valid => _$this._valid;
  set valid(bool? valid) => _$this._valid = valid;

  String? _setupToken;
  String? get setupToken => _$this._setupToken;
  set setupToken(String? setupToken) => _$this._setupToken = setupToken;

  VerifySetupPasswordResponseBuilder() {
    VerifySetupPasswordResponse._defaults(this);
  }

  VerifySetupPasswordResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _valid = $v.valid;
      _setupToken = $v.setupToken;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(VerifySetupPasswordResponse other) {
    _$v = other as _$VerifySetupPasswordResponse;
  }

  @override
  void update(void Function(VerifySetupPasswordResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  VerifySetupPasswordResponse build() => _build();

  _$VerifySetupPasswordResponse _build() {
    final _$result = _$v ??
        _$VerifySetupPasswordResponse._(
          valid: BuiltValueNullFieldError.checkNotNull(
              valid, r'VerifySetupPasswordResponse', 'valid'),
          setupToken: setupToken,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
