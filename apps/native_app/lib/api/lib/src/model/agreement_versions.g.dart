// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreement_versions.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AgreementVersions extends AgreementVersions {
  @override
  final int termsVersion;
  @override
  final int privacyVersion;

  factory _$AgreementVersions(
          [void Function(AgreementVersionsBuilder)? updates]) =>
      (AgreementVersionsBuilder()..update(updates))._build();

  _$AgreementVersions._(
      {required this.termsVersion, required this.privacyVersion})
      : super._();
  @override
  AgreementVersions rebuild(void Function(AgreementVersionsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AgreementVersionsBuilder toBuilder() =>
      AgreementVersionsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AgreementVersions &&
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
    return (newBuiltValueToStringHelper(r'AgreementVersions')
          ..add('termsVersion', termsVersion)
          ..add('privacyVersion', privacyVersion))
        .toString();
  }
}

class AgreementVersionsBuilder
    implements Builder<AgreementVersions, AgreementVersionsBuilder> {
  _$AgreementVersions? _$v;

  int? _termsVersion;
  int? get termsVersion => _$this._termsVersion;
  set termsVersion(int? termsVersion) => _$this._termsVersion = termsVersion;

  int? _privacyVersion;
  int? get privacyVersion => _$this._privacyVersion;
  set privacyVersion(int? privacyVersion) =>
      _$this._privacyVersion = privacyVersion;

  AgreementVersionsBuilder() {
    AgreementVersions._defaults(this);
  }

  AgreementVersionsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _termsVersion = $v.termsVersion;
      _privacyVersion = $v.privacyVersion;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AgreementVersions other) {
    _$v = other as _$AgreementVersions;
  }

  @override
  void update(void Function(AgreementVersionsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AgreementVersions build() => _build();

  _$AgreementVersions _build() {
    final _$result = _$v ??
        _$AgreementVersions._(
          termsVersion: BuiltValueNullFieldError.checkNotNull(
              termsVersion, r'AgreementVersions', 'termsVersion'),
          privacyVersion: BuiltValueNullFieldError.checkNotNull(
              privacyVersion, r'AgreementVersions', 'privacyVersion'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
