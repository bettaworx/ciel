// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'delete_post_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeletePostRequest extends DeletePostRequest {
  @override
  final String? reason;

  factory _$DeletePostRequest(
          [void Function(DeletePostRequestBuilder)? updates]) =>
      (DeletePostRequestBuilder()..update(updates))._build();

  _$DeletePostRequest._({this.reason}) : super._();
  @override
  DeletePostRequest rebuild(void Function(DeletePostRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeletePostRequestBuilder toBuilder() =>
      DeletePostRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeletePostRequest && reason == other.reason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DeletePostRequest')
          ..add('reason', reason))
        .toString();
  }
}

class DeletePostRequestBuilder
    implements Builder<DeletePostRequest, DeletePostRequestBuilder> {
  _$DeletePostRequest? _$v;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  DeletePostRequestBuilder() {
    DeletePostRequest._defaults(this);
  }

  DeletePostRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeletePostRequest other) {
    _$v = other as _$DeletePostRequest;
  }

  @override
  void update(void Function(DeletePostRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeletePostRequest build() => _build();

  _$DeletePostRequest _build() {
    final _$result = _$v ??
        _$DeletePostRequest._(
          reason: reason,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
