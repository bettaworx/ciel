// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_admin_user_note_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateAdminUserNoteRequest extends CreateAdminUserNoteRequest {
  @override
  final String content;

  factory _$CreateAdminUserNoteRequest(
          [void Function(CreateAdminUserNoteRequestBuilder)? updates]) =>
      (CreateAdminUserNoteRequestBuilder()..update(updates))._build();

  _$CreateAdminUserNoteRequest._({required this.content}) : super._();
  @override
  CreateAdminUserNoteRequest rebuild(
          void Function(CreateAdminUserNoteRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateAdminUserNoteRequestBuilder toBuilder() =>
      CreateAdminUserNoteRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateAdminUserNoteRequest && content == other.content;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateAdminUserNoteRequest')
          ..add('content', content))
        .toString();
  }
}

class CreateAdminUserNoteRequestBuilder
    implements
        Builder<CreateAdminUserNoteRequest, CreateAdminUserNoteRequestBuilder> {
  _$CreateAdminUserNoteRequest? _$v;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  CreateAdminUserNoteRequestBuilder() {
    CreateAdminUserNoteRequest._defaults(this);
  }

  CreateAdminUserNoteRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _content = $v.content;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateAdminUserNoteRequest other) {
    _$v = other as _$CreateAdminUserNoteRequest;
  }

  @override
  void update(void Function(CreateAdminUserNoteRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateAdminUserNoteRequest build() => _build();

  _$CreateAdminUserNoteRequest _build() {
    final _$result = _$v ??
        _$CreateAdminUserNoteRequest._(
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'CreateAdminUserNoteRequest', 'content'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
