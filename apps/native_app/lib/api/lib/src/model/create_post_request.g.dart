// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_post_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreatePostRequest extends CreatePostRequest {
  @override
  final String? content;
  @override
  final BuiltList<String>? mediaIds;

  factory _$CreatePostRequest(
          [void Function(CreatePostRequestBuilder)? updates]) =>
      (CreatePostRequestBuilder()..update(updates))._build();

  _$CreatePostRequest._({this.content, this.mediaIds}) : super._();
  @override
  CreatePostRequest rebuild(void Function(CreatePostRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreatePostRequestBuilder toBuilder() =>
      CreatePostRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreatePostRequest &&
        content == other.content &&
        mediaIds == other.mediaIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jc(_$hash, mediaIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreatePostRequest')
          ..add('content', content)
          ..add('mediaIds', mediaIds))
        .toString();
  }
}

class CreatePostRequestBuilder
    implements Builder<CreatePostRequest, CreatePostRequestBuilder> {
  _$CreatePostRequest? _$v;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  ListBuilder<String>? _mediaIds;
  ListBuilder<String> get mediaIds =>
      _$this._mediaIds ??= ListBuilder<String>();
  set mediaIds(ListBuilder<String>? mediaIds) => _$this._mediaIds = mediaIds;

  CreatePostRequestBuilder() {
    CreatePostRequest._defaults(this);
  }

  CreatePostRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _content = $v.content;
      _mediaIds = $v.mediaIds?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreatePostRequest other) {
    _$v = other as _$CreatePostRequest;
  }

  @override
  void update(void Function(CreatePostRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreatePostRequest build() => _build();

  _$CreatePostRequest _build() {
    _$CreatePostRequest _$result;
    try {
      _$result = _$v ??
          _$CreatePostRequest._(
            content: content,
            mediaIds: _mediaIds?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'mediaIds';
        _mediaIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'CreatePostRequest', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
