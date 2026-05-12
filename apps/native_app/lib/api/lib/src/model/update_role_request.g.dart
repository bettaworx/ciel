// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_role_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateRoleRequest extends UpdateRoleRequest {
  @override
  final String? name;
  @override
  final String? description;

  factory _$UpdateRoleRequest(
          [void Function(UpdateRoleRequestBuilder)? updates]) =>
      (UpdateRoleRequestBuilder()..update(updates))._build();

  _$UpdateRoleRequest._({this.name, this.description}) : super._();
  @override
  UpdateRoleRequest rebuild(void Function(UpdateRoleRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateRoleRequestBuilder toBuilder() =>
      UpdateRoleRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateRoleRequest &&
        name == other.name &&
        description == other.description;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateRoleRequest')
          ..add('name', name)
          ..add('description', description))
        .toString();
  }
}

class UpdateRoleRequestBuilder
    implements Builder<UpdateRoleRequest, UpdateRoleRequestBuilder> {
  _$UpdateRoleRequest? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  UpdateRoleRequestBuilder() {
    UpdateRoleRequest._defaults(this);
  }

  UpdateRoleRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _description = $v.description;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateRoleRequest other) {
    _$v = other as _$UpdateRoleRequest;
  }

  @override
  void update(void Function(UpdateRoleRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateRoleRequest build() => _build();

  _$UpdateRoleRequest _build() {
    final _$result = _$v ??
        _$UpdateRoleRequest._(
          name: name,
          description: description,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
