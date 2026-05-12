// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_role_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateRoleRequest extends CreateRoleRequest {
  @override
  final String id;
  @override
  final String name;
  @override
  final String description;

  factory _$CreateRoleRequest(
          [void Function(CreateRoleRequestBuilder)? updates]) =>
      (CreateRoleRequestBuilder()..update(updates))._build();

  _$CreateRoleRequest._(
      {required this.id, required this.name, required this.description})
      : super._();
  @override
  CreateRoleRequest rebuild(void Function(CreateRoleRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateRoleRequestBuilder toBuilder() =>
      CreateRoleRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateRoleRequest &&
        id == other.id &&
        name == other.name &&
        description == other.description;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateRoleRequest')
          ..add('id', id)
          ..add('name', name)
          ..add('description', description))
        .toString();
  }
}

class CreateRoleRequestBuilder
    implements Builder<CreateRoleRequest, CreateRoleRequestBuilder> {
  _$CreateRoleRequest? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  CreateRoleRequestBuilder() {
    CreateRoleRequest._defaults(this);
  }

  CreateRoleRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _description = $v.description;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateRoleRequest other) {
    _$v = other as _$CreateRoleRequest;
  }

  @override
  void update(void Function(CreateRoleRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateRoleRequest build() => _build();

  _$CreateRoleRequest _build() {
    final _$result = _$v ??
        _$CreateRoleRequest._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'CreateRoleRequest', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'CreateRoleRequest', 'name'),
          description: BuiltValueNullFieldError.checkNotNull(
              description, r'CreateRoleRequest', 'description'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
