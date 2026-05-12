//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_deleted_event.g.dart';

/// UserDeletedEvent
///
/// Properties:
/// * [type]
@BuiltValue()
abstract class UserDeletedEvent
    implements Built<UserDeletedEvent, UserDeletedEventBuilder> {
  @BuiltValueField(wireName: r'type')
  UserDeletedEventTypeEnum get type;
  // enum typeEnum {  user_deleted,  };

  UserDeletedEvent._();

  factory UserDeletedEvent([void updates(UserDeletedEventBuilder b)]) =
      _$UserDeletedEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserDeletedEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserDeletedEvent> get serializer =>
      _$UserDeletedEventSerializer();
}

class _$UserDeletedEventSerializer
    implements PrimitiveSerializer<UserDeletedEvent> {
  @override
  final Iterable<Type> types = const [UserDeletedEvent, _$UserDeletedEvent];

  @override
  final String wireName = r'UserDeletedEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserDeletedEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(UserDeletedEventTypeEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserDeletedEvent object, {
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
    required UserDeletedEventBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserDeletedEventTypeEnum),
          ) as UserDeletedEventTypeEnum;
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
  UserDeletedEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserDeletedEventBuilder();
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

class UserDeletedEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'user_deleted')
  static const UserDeletedEventTypeEnum userDeleted =
      _$userDeletedEventTypeEnum_userDeleted;

  static Serializer<UserDeletedEventTypeEnum> get serializer =>
      _$userDeletedEventTypeEnumSerializer;

  const UserDeletedEventTypeEnum._(String name) : super(name);

  static BuiltSet<UserDeletedEventTypeEnum> get values =>
      _$userDeletedEventTypeEnumValues;
  static UserDeletedEventTypeEnum valueOf(String name) =>
      _$userDeletedEventTypeEnumValueOf(name);
}
