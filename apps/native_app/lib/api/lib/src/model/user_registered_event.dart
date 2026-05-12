//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_registered_event.g.dart';

/// UserRegisteredEvent
///
/// Properties:
/// * [type]
@BuiltValue()
abstract class UserRegisteredEvent
    implements Built<UserRegisteredEvent, UserRegisteredEventBuilder> {
  @BuiltValueField(wireName: r'type')
  UserRegisteredEventTypeEnum get type;
  // enum typeEnum {  user_registered,  };

  UserRegisteredEvent._();

  factory UserRegisteredEvent([void updates(UserRegisteredEventBuilder b)]) =
      _$UserRegisteredEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserRegisteredEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserRegisteredEvent> get serializer =>
      _$UserRegisteredEventSerializer();
}

class _$UserRegisteredEventSerializer
    implements PrimitiveSerializer<UserRegisteredEvent> {
  @override
  final Iterable<Type> types = const [
    UserRegisteredEvent,
    _$UserRegisteredEvent
  ];

  @override
  final String wireName = r'UserRegisteredEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserRegisteredEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(UserRegisteredEventTypeEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserRegisteredEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserRegisteredEventBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserRegisteredEventTypeEnum),
          ) as UserRegisteredEventTypeEnum;
          result.type = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserRegisteredEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserRegisteredEventBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class UserRegisteredEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'user_registered')
  static const UserRegisteredEventTypeEnum userRegistered =
      _$userRegisteredEventTypeEnum_userRegistered;

  static Serializer<UserRegisteredEventTypeEnum> get serializer =>
      _$userRegisteredEventTypeEnumSerializer;

  const UserRegisteredEventTypeEnum._(String name) : super(name);

  static BuiltSet<UserRegisteredEventTypeEnum> get values =>
      _$userRegisteredEventTypeEnumValues;
  static UserRegisteredEventTypeEnum valueOf(String name) =>
      _$userRegisteredEventTypeEnumValueOf(name);
}
