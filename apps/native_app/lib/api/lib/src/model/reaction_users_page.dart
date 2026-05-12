//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reaction_users_page.g.dart';

/// ReactionUsersPage
///
/// Properties:
/// * [postId]
/// * [emoji] - Unicode emoji string or custom emoji shortcode in :shortcode: format.
/// * [users]
/// * [nextCursor]
@BuiltValue()
abstract class ReactionUsersPage
    implements Built<ReactionUsersPage, ReactionUsersPageBuilder> {
  @BuiltValueField(wireName: r'postId')
  String get postId;

  /// Unicode emoji string or custom emoji shortcode in :shortcode: format.
  @BuiltValueField(wireName: r'emoji')
  String get emoji;

  @BuiltValueField(wireName: r'users')
  BuiltList<User> get users;

  @BuiltValueField(wireName: r'nextCursor')
  String? get nextCursor;

  ReactionUsersPage._();

  factory ReactionUsersPage([void updates(ReactionUsersPageBuilder b)]) =
      _$ReactionUsersPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReactionUsersPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReactionUsersPage> get serializer =>
      _$ReactionUsersPageSerializer();
}

class _$ReactionUsersPageSerializer
    implements PrimitiveSerializer<ReactionUsersPage> {
  @override
  final Iterable<Type> types = const [ReactionUsersPage, _$ReactionUsersPage];

  @override
  final String wireName = r'ReactionUsersPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReactionUsersPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'postId';
    yield serializers.serialize(
      object.postId,
      specifiedType: const FullType(String),
    );
    yield r'emoji';
    yield serializers.serialize(
      object.emoji,
      specifiedType: const FullType(String),
    );
    yield r'users';
    yield serializers.serialize(
      object.users,
      specifiedType: const FullType(BuiltList, [FullType(User)]),
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
    ReactionUsersPage object, {
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
    required ReactionUsersPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'postId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.postId = valueDes;
          break;
        case r'emoji':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.emoji = valueDes;
          break;
        case r'users':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(User)]),
          ) as BuiltList<User>;
          result.users.replace(valueDes);
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
  ReactionUsersPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReactionUsersPageBuilder();
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
