//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media.dart';
import 'package:ciel_api/src/model/user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'post.g.dart';

/// Post
///
/// Properties:
/// * [id]
/// * [author]
/// * [content]
/// * [media]
/// * [createdAt]
/// * [deletedAt]
@BuiltValue(instantiable: false)
abstract class Post {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'author')
  User get author;

  @BuiltValueField(wireName: r'content')
  String get content;

  @BuiltValueField(wireName: r'media')
  BuiltList<Media> get media;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'deletedAt')
  DateTime? get deletedAt;

  @BuiltValueSerializer(custom: true)
  static Serializer<Post> get serializer => _$PostSerializer();
}

class _$PostSerializer implements PrimitiveSerializer<Post> {
  @override
  final Iterable<Type> types = const [Post];

  @override
  final String wireName = r'Post';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Post object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'author';
    yield serializers.serialize(
      object.author,
      specifiedType: const FullType(User),
    );
    yield r'content';
    yield serializers.serialize(
      object.content,
      specifiedType: const FullType(String),
    );
    yield r'media';
    yield serializers.serialize(
      object.media,
      specifiedType: const FullType(BuiltList, [FullType(Media)]),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.deletedAt != null) {
      yield r'deletedAt';
      yield serializers.serialize(
        object.deletedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    Post object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  @override
  Post deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.deserialize(serialized, specifiedType: FullType($Post))
        as $Post;
  }
}

/// a concrete implementation of [Post], since [Post] is not instantiable
@BuiltValue(instantiable: true)
abstract class $Post implements Post, Built<$Post, $PostBuilder> {
  $Post._();

  factory $Post([void Function($PostBuilder)? updates]) = _$$Post;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults($PostBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<$Post> get serializer => _$$PostSerializer();
}

class _$$PostSerializer implements PrimitiveSerializer<$Post> {
  @override
  final Iterable<Type> types = const [$Post, _$$Post];

  @override
  final String wireName = r'$Post';

  @override
  Object serialize(
    Serializers serializers,
    $Post object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.serialize(object, specifiedType: FullType(Post))!;
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required PostBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'author':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(User),
          ) as User;
          result.author = valueDes;
          break;
        case r'content':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.content = valueDes;
          break;
        case r'media':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(Media)]),
          ) as BuiltList<Media>;
          result.media.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'deletedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.deletedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  $Post deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = $PostBuilder();
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
