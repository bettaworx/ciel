//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'post_deleted_event.g.dart';

/// PostDeletedEvent
///
/// Properties:
/// * [type]
/// * [postId]
@BuiltValue()
abstract class PostDeletedEvent
    implements Built<PostDeletedEvent, PostDeletedEventBuilder> {
  @BuiltValueField(wireName: r'type')
  PostDeletedEventTypeEnum get type;
  // enum typeEnum {  post_deleted,  };

  @BuiltValueField(wireName: r'postId')
  String get postId;

  PostDeletedEvent._();

  factory PostDeletedEvent([void updates(PostDeletedEventBuilder b)]) =
      _$PostDeletedEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PostDeletedEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PostDeletedEvent> get serializer =>
      _$PostDeletedEventSerializer();
}

class _$PostDeletedEventSerializer
    implements PrimitiveSerializer<PostDeletedEvent> {
  @override
  final Iterable<Type> types = const [PostDeletedEvent, _$PostDeletedEvent];

  @override
  final String wireName = r'PostDeletedEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PostDeletedEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(PostDeletedEventTypeEnum),
    );
    yield r'postId';
    yield serializers.serialize(
      object.postId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PostDeletedEvent object, {
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
    required PostDeletedEventBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PostDeletedEventTypeEnum),
          ) as PostDeletedEventTypeEnum;
          result.type = valueDes;
          break;
        case r'postId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.postId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PostDeletedEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PostDeletedEventBuilder();
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

class PostDeletedEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'post_deleted')
  static const PostDeletedEventTypeEnum postDeleted =
      _$postDeletedEventTypeEnum_postDeleted;

  static Serializer<PostDeletedEventTypeEnum> get serializer =>
      _$postDeletedEventTypeEnumSerializer;

  const PostDeletedEventTypeEnum._(String name) : super(name);

  static BuiltSet<PostDeletedEventTypeEnum> get values =>
      _$postDeletedEventTypeEnumValues;
  static PostDeletedEventTypeEnum valueOf(String name) =>
      _$postDeletedEventTypeEnumValueOf(name);
}
