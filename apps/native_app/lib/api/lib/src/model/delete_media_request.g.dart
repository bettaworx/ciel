// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'delete_media_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DeleteMediaRequest extends DeleteMediaRequest {
  @override
  final String? reason;

  factory _$DeleteMediaRequest(
          [void Function(DeleteMediaRequestBuilder)? updates]) =>
      (DeleteMediaRequestBuilder()..update(updates))._build();

  _$DeleteMediaRequest._({this.reason}) : super._();
  @override
  DeleteMediaRequest rebuild(
          void Function(DeleteMediaRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DeleteMediaRequestBuilder toBuilder() =>
      DeleteMediaRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DeleteMediaRequest && reason == other.reason;
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
    return (newBuiltValueToStringHelper(r'DeleteMediaRequest')
          ..add('reason', reason))
        .toString();
  }
}

class DeleteMediaRequestBuilder
    implements Builder<DeleteMediaRequest, DeleteMediaRequestBuilder> {
  _$DeleteMediaRequest? _$v;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  DeleteMediaRequestBuilder() {
    DeleteMediaRequest._defaults(this);
  }

  DeleteMediaRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DeleteMediaRequest other) {
    _$v = other as _$DeleteMediaRequest;
  }

  @override
  void update(void Function(DeleteMediaRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DeleteMediaRequest build() => _build();

  _$DeleteMediaRequest _build() {
    final _$result = _$v ??
        _$DeleteMediaRequest._(
          reason: reason,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
