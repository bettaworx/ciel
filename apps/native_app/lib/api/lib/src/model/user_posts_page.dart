//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/post.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_posts_page.g.dart';

/// UserPostsPage
///
/// Properties:
/// * [items]
/// * [nextCursor]
@BuiltValue()
abstract class UserPostsPage
    implements Built<UserPostsPage, UserPostsPageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<Post> get items;

  @BuiltValueField(wireName: r'nextCursor')
  String? get nextCursor;

  UserPostsPage._();

  factory UserPostsPage([void updates(UserPostsPageBuilder b)]) =
      _$UserPostsPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserPostsPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserPostsPage> get serializer =>
      _$UserPostsPageSerializer();
}

class _$UserPostsPageSerializer implements PrimitiveSerializer<UserPostsPage> {
  @override
  final Iterable<Type> types = const [UserPostsPage, _$UserPostsPage];

  @override
  final String wireName = r'UserPostsPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserPostsPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(Post)]),
    );
    if (object.nextCursor != null) {
      yield r'nextCursor';
      yield serializers.serialize(
        object.nextCursor,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UserPostsPage object, {
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
    required UserPostsPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(Post)]),
          ) as BuiltList<Post>;
          result.items.replace(valueDes);
          break;
        case r'nextCursor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.nextCursor = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserPostsPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserPostsPageBuilder();
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
