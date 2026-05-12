// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreement_document.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AgreementDocument extends AgreementDocument {
  @override
  final String id;
  @override
  final AgreementType type;
  @override
  final AgreementLanguage language;
  @override
  final int version;
  @override
  final AgreementDocumentStatus status;
  @override
  final String title;
  @override
  final String content;
  @override
  final String createdBy;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final String? publishedBy;
  @override
  final DateTime? publishedAt;

  factory _$AgreementDocument(
          [void Function(AgreementDocumentBuilder)? updates]) =>
      (AgreementDocumentBuilder()..update(updates))._build();

  _$AgreementDocument._(
      {required this.id,
      required this.type,
      required this.language,
      required this.version,
      required this.status,
      required this.title,
      required this.content,
      required this.createdBy,
      required this.createdAt,
      required this.updatedAt,
      this.publishedBy,
      this.publishedAt})
      : super._();
  @override
  AgreementDocument rebuild(void Function(AgreementDocumentBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AgreementDocumentBuilder toBuilder() =>
      AgreementDocumentBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AgreementDocument &&
        id == other.id &&
        type == other.type &&
        language == other.language &&
        version == other.version &&
        status == other.status &&
        title == other.title &&
        content == other.content &&
        createdBy == other.createdBy &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        publishedBy == other.publishedBy &&
        publishedAt == other.publishedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, language.hashCode);
    _$hash = $jc(_$hash, version.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jc(_$hash, createdBy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, publishedBy.hashCode);
    _$hash = $jc(_$hash, publishedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AgreementDocument')
          ..add('id', id)
          ..add('type', type)
          ..add('language', language)
          ..add('version', version)
          ..add('status', status)
          ..add('title', title)
          ..add('content', content)
          ..add('createdBy', createdBy)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('publishedBy', publishedBy)
          ..add('publishedAt', publishedAt))
        .toString();
  }
}

class AgreementDocumentBuilder
    implements Builder<AgreementDocument, AgreementDocumentBuilder> {
  _$AgreementDocument? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  AgreementType? _type;
  AgreementType? get type => _$this._type;
  set type(AgreementType? type) => _$this._type = type;

  AgreementLanguage? _language;
  AgreementLanguage? get language => _$this._language;
  set language(AgreementLanguage? language) => _$this._language = language;

  int? _version;
  int? get version => _$this._version;
  set version(int? version) => _$this._version = version;

  AgreementDocumentStatus? _status;
  AgreementDocumentStatus? get status => _$this._status;
  set status(AgreementDocumentStatus? status) => _$this._status = status;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  String? _createdBy;
  String? get createdBy => _$this._createdBy;
  set createdBy(String? createdBy) => _$this._createdBy = createdBy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  String? _publishedBy;
  String? get publishedBy => _$this._publishedBy;
  set publishedBy(String? publishedBy) => _$this._publishedBy = publishedBy;

  DateTime? _publishedAt;
  DateTime? get publishedAt => _$this._publishedAt;
  set publishedAt(DateTime? publishedAt) => _$this._publishedAt = publishedAt;

  AgreementDocumentBuilder() {
    AgreementDocument._defaults(this);
  }

  AgreementDocumentBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _type = $v.type;
      _language = $v.language;
      _version = $v.version;
      _status = $v.status;
      _title = $v.title;
      _content = $v.content;
      _createdBy = $v.createdBy;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _publishedBy = $v.publishedBy;
      _publishedAt = $v.publishedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AgreementDocument other) {
    _$v = other as _$AgreementDocument;
  }

  @override
  void update(void Function(AgreementDocumentBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AgreementDocument build() => _build();

  _$AgreementDocument _build() {
    final _$result = _$v ??
        _$AgreementDocument._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'AgreementDocument', 'id'),
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'AgreementDocument', 'type'),
          language: BuiltValueNullFieldError.checkNotNull(
              language, r'AgreementDocument', 'language'),
          version: BuiltValueNullFieldError.checkNotNull(
              version, r'AgreementDocument', 'version'),
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'AgreementDocument', 'status'),
          title: BuiltValueNullFieldError.checkNotNull(
              title, r'AgreementDocument', 'title'),
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'AgreementDocument', 'content'),
          createdBy: BuiltValueNullFieldError.checkNotNull(
              createdBy, r'AgreementDocument', 'createdBy'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'AgreementDocument', 'createdAt'),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt, r'AgreementDocument', 'updatedAt'),
          publishedBy: publishedBy,
          publishedAt: publishedAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
