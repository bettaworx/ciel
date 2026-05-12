// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_agreements_documents_document_id_duplicate_post_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest
    extends AdminAgreementsDocumentsDocumentIdDuplicatePostRequest {
  @override
  final int newVersion;

  factory _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest(
          [void Function(
                  AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder)?
              updates]) =>
      (AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder()
            ..update(updates))
          ._build();

  _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest._(
      {required this.newVersion})
      : super._();
  @override
  AdminAgreementsDocumentsDocumentIdDuplicatePostRequest rebuild(
          void Function(
                  AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder toBuilder() =>
      AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder()
        ..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminAgreementsDocumentsDocumentIdDuplicatePostRequest &&
        newVersion == other.newVersion;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, newVersion.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'AdminAgreementsDocumentsDocumentIdDuplicatePostRequest')
          ..add('newVersion', newVersion))
        .toString();
  }
}

class AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder
    implements
        Builder<AdminAgreementsDocumentsDocumentIdDuplicatePostRequest,
            AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder> {
  _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest? _$v;

  int? _newVersion;
  int? get newVersion => _$this._newVersion;
  set newVersion(int? newVersion) => _$this._newVersion = newVersion;

  AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder() {
    AdminAgreementsDocumentsDocumentIdDuplicatePostRequest._defaults(this);
  }

  AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _newVersion = $v.newVersion;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminAgreementsDocumentsDocumentIdDuplicatePostRequest other) {
    _$v = other as _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest;
  }

  @override
  void update(
      void Function(
              AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminAgreementsDocumentsDocumentIdDuplicatePostRequest build() => _build();

  _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest _build() {
    final _$result = _$v ??
        _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest._(
          newVersion: BuiltValueNullFieldError.checkNotNull(
              newVersion,
              r'AdminAgreementsDocumentsDocumentIdDuplicatePostRequest',
              'newVersion'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
