// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_agreement_versions_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateAgreementVersionsRequest extends UpdateAgreementVersionsRequest {
  @override
  final int? termsVersion;
  @override
  final int? privacyVersion;

  factory _$UpdateAgreementVersionsRequest(
          [void Function(UpdateAgreementVersionsRequestBuilder)? updates]) =>
      (UpdateAgreementVersionsRequestBuilder()..update(updates))._build();

  _$UpdateAgreementVersionsRequest._({this.termsVersion, this.privacyVersion})
      : super._();
  @override
  UpdateAgreementVersionsRequest rebuild(
          void Function(UpdateAgreementVersionsRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateAgreementVersionsRequestBuilder toBuilder() =>
      UpdateAgreementVersionsRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateAgreementVersionsRequest &&
        termsVersion == other.termsVersion &&
        privacyVersion == other.privacyVersion;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, termsVersion.hashCode);
    _$hash = $jc(_$hash, privacyVersion.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateAgreementVersionsRequest')
          ..add('termsVersion', termsVersion)
          ..add('privacyVersion', privacyVersion))
        .toString();
  }
}

class UpdateAgreementVersionsRequestBuilder
    implements
        Builder<UpdateAgreementVersionsRequest,
            UpdateAgreementVersionsRequestBuilder> {
  _$UpdateAgreementVersionsRequest? _$v;

  int? _termsVersion;
  int? get termsVersion => _$this._termsVersion;
  set termsVersion(int? termsVersion) => _$this._termsVersion = termsVersion;

  int? _privacyVersion;
  int? get privacyVersion => _$this._privacyVersion;
  set privacyVersion(int? privacyVersion) =>
      _$this._privacyVersion = privacyVersion;

  UpdateAgreementVersionsRequestBuilder() {
    UpdateAgreementVersionsRequest._defaults(this);
  }

  UpdateAgreementVersionsRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _termsVersion = $v.termsVersion;
      _privacyVersion = $v.privacyVersion;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateAgreementVersionsRequest other) {
    _$v = other as _$UpdateAgreementVersionsRequest;
  }

  @override
  void update(void Function(UpdateAgreementVersionsRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateAgreementVersionsRequest build() => _build();

  _$UpdateAgreementVersionsRequest _build() {
    final _$result = _$v ??
        _$UpdateAgreementVersionsRequest._(
          termsVersion: termsVersion,
          privacyVersion: privacyVersion,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
