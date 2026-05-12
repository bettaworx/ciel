// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_registered_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const UserRegisteredEventTypeEnum _$userRegisteredEventTypeEnum_userRegistered =
    const UserRegisteredEventTypeEnum._('userRegistered');

UserRegisteredEventTypeEnum _$userRegisteredEventTypeEnumValueOf(String name) {
  switch (name) {
    case 'userRegistered':
      return _$userRegisteredEventTypeEnum_userRegistered;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<UserRegisteredEventTypeEnum>
    _$userRegisteredEventTypeEnumValues =
    BuiltSet<UserRegisteredEventTypeEnum>(const <UserRegisteredEventTypeEnum>[
  _$userRegisteredEventTypeEnum_userRegistered,
]);

Serializer<UserRegisteredEventTypeEnum>
    _$userRegisteredEventTypeEnumSerializer =
    _$UserRegisteredEventTypeEnumSerializer();

class _$UserRegisteredEventTypeEnumSerializer
    implements PrimitiveSerializer<UserRegisteredEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'userRegistered': 'user_registered',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'user_registered': 'userRegistered',
  };

  @override
  final Iterable<Type> types = const <Type>[UserRegisteredEventTypeEnum];
  @override
  final String wireName = 'UserRegisteredEventTypeEnum';

  @override
  Object serialize(Serializers serializers, UserRegisteredEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  UserRegisteredEventTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      UserRegisteredEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$UserRegisteredEvent extends UserRegisteredEvent {
  @override
  final UserRegisteredEventTypeEnum type;

  factory _$UserRegisteredEvent(
          [void Function(UserRegisteredEventBuilder)? updates]) =>
      (UserRegisteredEventBuilder()..update(updates))._build();

  _$UserRegisteredEvent._({required this.type}) : super._();
  @override
  UserRegisteredEvent rebuild(
          void Function(UserRegisteredEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserRegisteredEventBuilder toBuilder() =>
      UserRegisteredEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserRegisteredEvent && type == other.type;
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
    return (newBuiltValueToStringHelper(r'UserRegisteredEvent')
          ..add('type', type))
        .toString();
  }
}

class UserRegisteredEventBuilder
    implements Builder<UserRegisteredEvent, UserRegisteredEventBuilder> {
  _$UserRegisteredEvent? _$v;

  UserRegisteredEventTypeEnum? _type;
  UserRegisteredEventTypeEnum? get type => _$this._type;
  set type(UserRegisteredEventTypeEnum? type) => _$this._type = type;

  UserRegisteredEventBuilder() {
    UserRegisteredEvent._defaults(this);
  }

  UserRegisteredEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserRegisteredEvent other) {
    _$v = other as _$UserRegisteredEvent;
  }

  @override
  void update(void Function(UserRegisteredEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserRegisteredEvent build() => _build();

  _$UserRegisteredEvent _build() {
    final _$result = _$v ??
        _$UserRegisteredEvent._(
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'UserRegisteredEvent', 'type'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
