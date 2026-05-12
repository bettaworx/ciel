// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accept_agreements_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptAgreementsRequest extends AcceptAgreementsRequest {
  @override
  final int? termsVersion;
  @override
  final int? privacyVersion;

  factory _$AcceptAgreementsRequest(
          [void Function(AcceptAgreementsRequestBuilder)? updates]) =>
      (AcceptAgreementsRequestBuilder()..update(updates))._build();

  _$AcceptAgreementsRequest._({this.termsVersion, this.privacyVersion})
      : super._();
  @override
  AcceptAgreementsRequest rebuild(
          void Function(AcceptAgreementsRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptAgreementsRequestBuilder toBuilder() =>
      AcceptAgreementsRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptAgreementsRequest &&
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
    return (newBuiltValueToStringHelper(r'AcceptAgreementsRequest')
          ..add('termsVersion', termsVersion)
          ..add('privacyVersion', privacyVersion))
        .toString();
  }
}

class AcceptAgreementsRequestBuilder
    implements
        Builder<AcceptAgreementsRequest, AcceptAgreementsRequestBuilder> {
  _$AcceptAgreementsRequest? _$v;

  int? _termsVersion;
  int? get termsVersion => _$this._termsVersion;
  set termsVersion(int? termsVersion) => _$this._termsVersion = termsVersion;

  int? _privacyVersion;
  int? get privacyVersion => _$this._privacyVersion;
  set privacyVersion(int? privacyVersion) =>
      _$this._privacyVersion = privacyVersion;

  AcceptAgreementsRequestBuilder() {
    AcceptAgreementsRequest._defaults(this);
  }

  AcceptAgreementsRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _termsVersion = $v.termsVersion;
      _privacyVersion = $v.privacyVersion;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptAgreementsRequest other) {
    _$v = other as _$AcceptAgreementsRequest;
  }

  @override
  void update(void Function(AcceptAgreementsRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptAgreementsRequest build() => _build();

  _$AcceptAgreementsRequest _build() {
    final _$result = _$v ??
        _$AcceptAgreementsRequest._(
          termsVersion: termsVersion,
          privacyVersion: privacyVersion,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
