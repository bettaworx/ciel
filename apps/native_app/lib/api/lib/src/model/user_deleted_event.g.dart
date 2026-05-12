// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_deleted_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UserDeletedEventTypeEnum _$userDeletedEventTypeEnum_userDeleted =
    const UserDeletedEventTypeEnum._('userDeleted');

UserDeletedEventTypeEnum _$userDeletedEventTypeEnumValueOf(String name) {
  switch (name) {
    case 'userDeleted':
      return _$userDeletedEventTypeEnum_userDeleted;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserDeletedEventTypeEnum> _$userDeletedEventTypeEnumValues =
    BuiltSet<UserDeletedEventTypeEnum>(const <UserDeletedEventTypeEnum>[
  _$userDeletedEventTypeEnum_userDeleted,
]);

Serializer<UserDeletedEventTypeEnum> _$userDeletedEventTypeEnumSerializer =
    _$UserDeletedEventTypeEnumSerializer();

class _$UserDeletedEventTypeEnumSerializer
    implements PrimitiveSerializer<UserDeletedEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'userDeleted': 'user_deleted',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'user_deleted': 'userDeleted',
  };

  @override
  final Iterable<Type> types = const <Type>[UserDeletedEventTypeEnum];
  @override
  final String wireName = 'UserDeletedEventTypeEnum';

  @override
  Object serialize(Serializers serializers, UserDeletedEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UserDeletedEventTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UserDeletedEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UserDeletedEvent extends UserDeletedEvent {
  @override
  final UserDeletedEventTypeEnum type;

  factory _$UserDeletedEvent(
          [void Function(UserDeletedEventBuilder)? updates]) =>
      (UserDeletedEventBuilder()..update(updates))._build();

  _$UserDeletedEvent._({required this.type}) : super._();
  @override
  UserDeletedEvent rebuild(void Function(UserDeletedEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserDeletedEventBuilder toBuilder() =>
      UserDeletedEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserDeletedEvent && type == other.type;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserDeletedEvent')..add('type', type))
        .toString();
  }
}

class UserDeletedEventBuilder
    implements Builder<UserDeletedEvent, UserDeletedEventBuilder> {
  _$UserDeletedEvent? _$v;

  UserDeletedEventTypeEnum? _type;
  UserDeletedEventTypeEnum? get type => _$this._type;
  set type(UserDeletedEventTypeEnum? type) => _$this._type = type;

  UserDeletedEventBuilder() {
    UserDeletedEvent._defaults(this);
  }

  UserDeletedEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserDeletedEvent other) {
    _$v = other as _$UserDeletedEvent;
  }

  @override
  void update(void Function(UserDeletedEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserDeletedEvent build() => _build();

  _$UserDeletedEvent _build() {
    final _$result = _$v ??
        _$UserDeletedEvent._(
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'UserDeletedEvent', 'type'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
