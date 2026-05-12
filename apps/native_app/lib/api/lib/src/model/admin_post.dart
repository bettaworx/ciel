//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media.dart';
import 'package:ciel_api/src/model/user.dart';
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/post_visibility.dart';
import 'package:ciel_api/src/model/post.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_post.g.dart';

/// AdminPost
///
/// Properties:
/// * [id]
/// * [author]
/// * [content]
/// * [media]
/// * [createdAt]
/// * [visibility]
/// * [deletedAt]
/// * [deletedBy] - Admin user ID who deleted this post
/// * [deletionReason] - Reason for deletion
@BuiltValue()
abstract class AdminPost implements Post, Built<AdminPost, AdminPostBuilder> {
  /// Reason for deletion
  @BuiltValueField(wireName: r'deletionReason')
  String? get deletionReason;

  @BuiltValueField(wireName: r'visibility')
  PostVisibility get visibility;
  // enum visibilityEnum {  public,  hidden,  deleted,  };

  /// Admin user ID who deleted this post
  @BuiltValueField(wireName: r'deletedBy')
  String? get deletedBy;

  AdminPost._();

  factory AdminPost([void updates(AdminPostBuilder b)]) = _$AdminPost;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminPostBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminPost> get serializer => _$AdminPostSerializer();
}

class _$AdminPostSerializer implements PrimitiveSerializer<AdminPost> {
  @override
  final Iterable<Type> types = const [AdminPost, _$AdminPost];

  @override
  final String wireName = r'AdminPost';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminPost object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.deletionReason != null) {
      yield r'deletionReason';
      yield serializers.serialize(
        object.deletionReason,
        specifiedType: const FullType.nullable(String),
      );
    }
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
    yield r'visibility';
    yield serializers.serialize(
      object.visibility,
      specifiedType: const FullType(PostVisibility),
    );
    yield r'author';
    yield serializers.serialize(
      object.author,
      specifiedType: const FullType(User),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'media';
    yield serializers.serialize(
      object.media,
      specifiedType: const FullType(BuiltList, [FullType(Media)]),
    );
    if (object.deletedBy != null) {
      yield r'deletedBy';
      yield serializers.serialize(
        object.deletedBy,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'content';
    yield serializers.serialize(
      object.content,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminPost object, {
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
    required AdminPostBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'deletionReason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.deletionReason = valueDes;
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
        case r'visibility':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PostVisibility),
          ) as PostVisibility;
          result.visibility = valueDes;
          break;
        case r'author':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(User),
          ) as User;
          result.author = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'media':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(Media)]),
          ) as BuiltList<Media>;
          result.media.replace(valueDes);
          break;
        case r'deletedBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.deletedBy = valueDes;
          break;
        case r'content':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.content = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminPost deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminPostBuilder();
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
