// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_signup_enabled_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateSignupEnabledRequest extends UpdateSignupEnabledRequest {
  @override
  final bool signupEnabled;

  factory _$UpdateSignupEnabledRequest(
          [void Function(UpdateSignupEnabledRequestBuilder)? updates]) =>
      (UpdateSignupEnabledRequestBuilder()..update(updates))._build();

  _$UpdateSignupEnabledRequest._({required this.signupEnabled}) : super._();
  @override
  UpdateSignupEnabledRequest rebuild(
          void Function(UpdateSignupEnabledRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateSignupEnabledRequestBuilder toBuilder() =>
      UpdateSignupEnabledRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateSignupEnabledRequest &&
        signupEnabled == other.signupEnabled;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, signupEnabled.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateSignupEnabledRequest')
          ..add('signupEnabled', signupEnabled))
        .toString();
  }
}

class UpdateSignupEnabledRequestBuilder
    implements
        Builder<UpdateSignupEnabledRequest, UpdateSignupEnabledRequestBuilder> {
  _$UpdateSignupEnabledRequest? _$v;

  bool? _signupEnabled;
  bool? get signupEnabled => _$this._signupEnabled;
  set signupEnabled(bool? signupEnabled) =>
      _$this._signupEnabled = signupEnabled;

  UpdateSignupEnabledRequestBuilder() {
    UpdateSignupEnabledRequest._defaults(this);
  }

  UpdateSignupEnabledRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _signupEnabled = $v.signupEnabled;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateSignupEnabledRequest other) {
    _$v = other as _$UpdateSignupEnabledRequest;
  }

  @override
  void update(void Function(UpdateSignupEnabledRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateSignupEnabledRequest build() => _build();

  _$UpdateSignupEnabledRequest _build() {
    final _$result = _$v ??
        _$UpdateSignupEnabledRequest._(
          signupEnabled: BuiltValueNullFieldError.checkNotNull(
              signupEnabled, r'UpdateSignupEnabledRequest', 'signupEnabled'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
