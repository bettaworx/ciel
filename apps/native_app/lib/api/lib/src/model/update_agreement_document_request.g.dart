// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_agreement_document_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateAgreementDocumentRequest extends UpdateAgreementDocumentRequest {
  @override
  final String? title;
  @override
  final String? content;

  factory _$UpdateAgreementDocumentRequest(
          [void Function(UpdateAgreementDocumentRequestBuilder)? updates]) =>
      (UpdateAgreementDocumentRequestBuilder()..update(updates))._build();

  _$UpdateAgreementDocumentRequest._({this.title, this.content}) : super._();
  @override
  UpdateAgreementDocumentRequest rebuild(
          void Function(UpdateAgreementDocumentRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateAgreementDocumentRequestBuilder toBuilder() =>
      UpdateAgreementDocumentRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateAgreementDocumentRequest &&
        title == other.title &&
        content == other.content;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateAgreementDocumentRequest')
          ..add('title', title)
          ..add('content', content))
        .toString();
  }
}

class UpdateAgreementDocumentRequestBuilder
    implements
        Builder<UpdateAgreementDocumentRequest,
            UpdateAgreementDocumentRequestBuilder> {
  _$UpdateAgreementDocumentRequest? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  UpdateAgreementDocumentRequestBuilder() {
    UpdateAgreementDocumentRequest._defaults(this);
  }

  UpdateAgreementDocumentRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _content = $v.content;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateAgreementDocumentRequest other) {
    _$v = other as _$UpdateAgreementDocumentRequest;
  }

  @override
  void update(void Function(UpdateAgreementDocumentRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateAgreementDocumentRequest build() => _build();

  _$UpdateAgreementDocumentRequest _build() {
    final _$result = _$v ??
        _$UpdateAgreementDocumentRequest._(
          title: title,
          content: content,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
