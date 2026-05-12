// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_post_visibility_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdatePostVisibilityRequest extends UpdatePostVisibilityRequest {
  @override
  final PostVisibility visibility;

  factory _$UpdatePostVisibilityRequest(
          [void Function(UpdatePostVisibilityRequestBuilder)? updates]) =>
      (UpdatePostVisibilityRequestBuilder()..update(updates))._build();

  _$UpdatePostVisibilityRequest._({required this.visibility}) : super._();
  @override
  UpdatePostVisibilityRequest rebuild(
          void Function(UpdatePostVisibilityRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdatePostVisibilityRequestBuilder toBuilder() =>
      UpdatePostVisibilityRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdatePostVisibilityRequest &&
        visibility == other.visibility;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, visibility.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdatePostVisibilityRequest')
          ..add('visibility', visibility))
        .toString();
  }
}

class UpdatePostVisibilityRequestBuilder
    implements
        Builder<UpdatePostVisibilityRequest,
            UpdatePostVisibilityRequestBuilder> {
  _$UpdatePostVisibilityRequest? _$v;

  PostVisibility? _visibility;
  PostVisibility? get visibility => _$this._visibility;
  set visibility(PostVisibility? visibility) => _$this._visibility = visibility;

  UpdatePostVisibilityRequestBuilder() {
    UpdatePostVisibilityRequest._defaults(this);
  }

  UpdatePostVisibilityRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _visibility = $v.visibility;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdatePostVisibilityRequest other) {
    _$v = other as _$UpdatePostVisibilityRequest;
  }

  @override
  void update(void Function(UpdatePostVisibilityRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdatePostVisibilityRequest build() => _build();

  _$UpdatePostVisibilityRequest _build() {
    final _$result = _$v ??
        _$UpdatePostVisibilityRequest._(
          visibility: BuiltValueNullFieldError.checkNotNull(
              visibility, r'UpdatePostVisibilityRequest', 'visibility'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
