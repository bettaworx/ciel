//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/post.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'post_created_event.g.dart';

/// PostCreatedEvent
///
/// Properties:
/// * [type]
/// * [post]
@BuiltValue()
abstract class PostCreatedEvent
    implements Built<PostCreatedEvent, PostCreatedEventBuilder> {
  @BuiltValueField(wireName: r'type')
  PostCreatedEventTypeEnum get type;
  // enum typeEnum {  post_created,  };

  @BuiltValueField(wireName: r'post')
  Post get post;

  PostCreatedEvent._();

  factory PostCreatedEvent([void updates(PostCreatedEventBuilder b)]) =
      _$PostCreatedEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PostCreatedEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PostCreatedEvent> get serializer =>
      _$PostCreatedEventSerializer();
}

class _$PostCreatedEventSerializer
    implements PrimitiveSerializer<PostCreatedEvent> {
  @override
  final Iterable<Type> types = const [PostCreatedEvent, _$PostCreatedEvent];

  @override
  final String wireName = r'PostCreatedEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PostCreatedEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(PostCreatedEventTypeEnum),
    );
    yield r'post';
    yield serializers.serialize(
      object.post,
      specifiedType: const FullType(Post),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PostCreatedEvent object, {
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
    required PostCreatedEventBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PostCreatedEventTypeEnum),
          ) as PostCreatedEventTypeEnum;
          result.type = valueDes;
          break;
        case r'post':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Post),
          ) as Post;
          result.post = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  PostCreatedEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PostCreatedEventBuilder();
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

class PostCreatedEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'post_created')
  static const PostCreatedEventTypeEnum postCreated =
      _$postCreatedEventTypeEnum_postCreated;

  static Serializer<PostCreatedEventTypeEnum> get serializer =>
      _$postCreatedEventTypeEnumSerializer;

  const PostCreatedEventTypeEnum._(String name) : super(name);

  static BuiltSet<PostCreatedEventTypeEnum> get values =>
      _$postCreatedEventTypeEnumValues;
  static PostCreatedEventTypeEnum valueOf(String name) =>
      _$postCreatedEventTypeEnumValueOf(name);
}
