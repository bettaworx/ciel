// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_agreement_content.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PublicAgreementContent extends PublicAgreementContent {
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
  @override
  final DateTime publishedAt;

  factory _$PublicAgreementContent(
          [void Function(PublicAgreementContentBuilder)? updates]) =>
      (PublicAgreementContentBuilder()..update(updates))._build();

  _$PublicAgreementContent._(
      {required this.type,
      required this.language,
      required this.version,
      required this.title,
      required this.content,
      required this.publishedAt})
      : super._();
  @override
  PublicAgreementContent rebuild(
          void Function(PublicAgreementContentBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PublicAgreementContentBuilder toBuilder() =>
      PublicAgreementContentBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PublicAgreementContent &&
        type == other.type &&
        language == other.language &&
        version == other.version &&
        title == other.title &&
        content == other.content &&
        publishedAt == other.publishedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, version.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jc(_$hash, publishedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PublicAgreementContent')
          ..add('type', type)
          ..add('language', language)
          ..add('version', version)
          ..add('title', title)
          ..add('content', content)
          ..add('publishedAt', publishedAt))
        .toString();
  }
}

class PublicAgreementContentBuilder
    implements Builder<PublicAgreementContent, PublicAgreementContentBuilder> {
  _$PublicAgreementContent? _$v;

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

  DateTime? _publishedAt;
  DateTime? get publishedAt => _$this._publishedAt;
  set publishedAt(DateTime? publishedAt) => _$this._publishedAt = publishedAt;

  PublicAgreementContentBuilder() {
    PublicAgreementContent._defaults(this);
  }

  PublicAgreementContentBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _language = $v.language;
      _version = $v.version;
      _title = $v.title;
      _content = $v.content;
      _publishedAt = $v.publishedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PublicAgreementContent other) {
    _$v = other as _$PublicAgreementContent;
  }

  @override
  void update(void Function(PublicAgreementContentBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PublicAgreementContent build() => _build();

  _$PublicAgreementContent _build() {
    final _$result = _$v ??
        _$PublicAgreementContent._(
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'PublicAgreementContent', 'type'),
          language: BuiltValueNullFieldError.checkNotNull(
              language, r'PublicAgreementContent', 'language'),
          version: BuiltValueNullFieldError.checkNotNull(
              version, r'PublicAgreementContent', 'version'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'PublicAgreementContent', 'title'),
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'PublicAgreementContent', 'content'),
          publishedAt: BuiltValueNullFieldError.checkNotNull(
              publishedAt, r'PublicAgreementContent', 'publishedAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
