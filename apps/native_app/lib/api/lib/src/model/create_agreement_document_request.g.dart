// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_agreement_document_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateAgreementDocumentRequest extends CreateAgreementDocumentRequest {
  @override
  final AgreementType type;
  @override
  final AgreementLanguage language;
  @override
  final int version;
  @override
  final String title;
  @override
  final String content;

  factory _$CreateAgreementDocumentRequest(
          [void Function(CreateAgreementDocumentRequestBuilder)? updates]) =>
      (CreateAgreementDocumentRequestBuilder()..update(updates))._build();

  _$CreateAgreementDocumentRequest._(
      {required this.type,
      required this.language,
      required this.version,
      required this.title,
      required this.content})
      : super._();
  @override
  CreateAgreementDocumentRequest rebuild(
          void Function(CreateAgreementDocumentRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateAgreementDocumentRequestBuilder toBuilder() =>
      CreateAgreementDocumentRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateAgreementDocumentRequest &&
        type == other.type &&
        language == other.language &&
        version == other.version &&
        title == other.title &&
        content == other.content;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, version.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateAgreementDocumentRequest')
          ..add('type', type)
          ..add('language', language)
          ..add('version', version)
          ..add('title', title)
          ..add('content', content))
        .toString();
  }
}

class CreateAgreementDocumentRequestBuilder
    implements
        Builder<CreateAgreementDocumentRequest,
            CreateAgreementDocumentRequestBuilder> {
  _$CreateAgreementDocumentRequest? _$v;

  AgreementType? _type;
  AgreementType? get type => _$this._type;
  set type(AgreementType? type) => _$this._type = type;

  AgreementLanguage? _language;
  AgreementLanguage? get language => _$this._language;
  set language(AgreementLanguage? language) => _$this._language = language;

  int? _version;
  int? get version => _$this._version;
  set version(int? version) => _$this._version = version;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  CreateAgreementDocumentRequestBuilder() {
    CreateAgreementDocumentRequest._defaults(this);
  }

  CreateAgreementDocumentRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _language = $v.language;
      _version = $v.version;
      _title = $v.title;
      _content = $v.content;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateAgreementDocumentRequest other) {
    _$v = other as _$CreateAgreementDocumentRequest;
  }

  @override
  void update(void Function(CreateAgreementDocumentRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateAgreementDocumentRequest build() => _build();

  _$CreateAgreementDocumentRequest _build() {
    final _$result = _$v ??
        _$CreateAgreementDocumentRequest._(
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'CreateAgreementDocumentRequest', 'type'),
          language: BuiltValueNullFieldError.checkNotNull(
              language, r'CreateAgreementDocumentRequest', 'language'),
          version: BuiltValueNullFieldError.checkNotNull(
              version, r'CreateAgreementDocumentRequest', 'version'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'CreateAgreementDocumentRequest', 'title'),
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'CreateAgreementDocumentRequest', 'content'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
