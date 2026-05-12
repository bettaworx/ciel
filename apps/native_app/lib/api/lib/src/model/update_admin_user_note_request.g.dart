// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_admin_user_note_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateAdminUserNoteRequest extends UpdateAdminUserNoteRequest {
  @override
  final String content;

  factory _$UpdateAdminUserNoteRequest(
          [void Function(UpdateAdminUserNoteRequestBuilder)? updates]) =>
      (UpdateAdminUserNoteRequestBuilder()..update(updates))._build();

  _$UpdateAdminUserNoteRequest._({required this.content}) : super._();
  @override
  UpdateAdminUserNoteRequest rebuild(
          void Function(UpdateAdminUserNoteRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateAdminUserNoteRequestBuilder toBuilder() =>
      UpdateAdminUserNoteRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateAdminUserNoteRequest && content == other.content;
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
    return (newBuiltValueToStringHelper(r'UpdateAdminUserNoteRequest')
          ..add('content', content))
        .toString();
  }
}

class UpdateAdminUserNoteRequestBuilder
    implements
        Builder<UpdateAdminUserNoteRequest, UpdateAdminUserNoteRequestBuilder> {
  _$UpdateAdminUserNoteRequest? _$v;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  UpdateAdminUserNoteRequestBuilder() {
    UpdateAdminUserNoteRequest._defaults(this);
  }

  UpdateAdminUserNoteRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _content = $v.content;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateAdminUserNoteRequest other) {
    _$v = other as _$UpdateAdminUserNoteRequest;
  }

  @override
  void update(void Function(UpdateAdminUserNoteRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateAdminUserNoteRequest build() => _build();

  _$UpdateAdminUserNoteRequest _build() {
    final _$result = _$v ??
        _$UpdateAdminUserNoteRequest._(
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'UpdateAdminUserNoteRequest', 'content'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
