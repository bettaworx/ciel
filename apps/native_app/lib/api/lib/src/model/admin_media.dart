//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media.dart';
import 'package:ciel_api/src/model/media_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_media.g.dart';

/// AdminMedia
///
/// Properties:
/// * [id]
/// * [type]
/// * [url]
/// * [width]
/// * [height]
/// * [createdAt]
/// * [duration] - Duration in seconds (video only, null for images)
/// * [thumbnailUrl] - Thumbnail URL (video only, null for images)
/// * [userId] - User who uploaded this media
/// * [uploaderUsername] - Username of uploader
/// * [deletedAt] - When the media was deleted
/// * [deletedBy] - Admin user ID who deleted this media
/// * [deletionReason] - Reason for deletion
/// * [phash] - Perceptual hash of the image
/// * [usedInPostsCount] - Number of posts using this media
@BuiltValue()
abstract class AdminMedia
    implements Media, Built<AdminMedia, AdminMediaBuilder> {
  /// Reason for deletion
  @BuiltValueField(wireName: r'deletionReason')
  String? get deletionReason;

  /// Username of uploader
  @BuiltValueField(wireName: r'uploaderUsername')
  String? get uploaderUsername;

  /// When the media was deleted
  @BuiltValueField(wireName: r'deletedAt')
  DateTime? get deletedAt;

  /// Perceptual hash of the image
  @BuiltValueField(wireName: r'phash')
  String? get phash;

  /// Number of posts using this media
  @BuiltValueField(wireName: r'usedInPostsCount')
  int? get usedInPostsCount;

  /// User who uploaded this media
  @BuiltValueField(wireName: r'userId')
  String? get userId;

  /// Admin user ID who deleted this media
  @BuiltValueField(wireName: r'deletedBy')
  String? get deletedBy;

  AdminMedia._();

  factory AdminMedia([void updates(AdminMediaBuilder b)]) = _$AdminMedia;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminMediaBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminMedia> get serializer => _$AdminMediaSerializer();
}

class _$AdminMediaSerializer implements PrimitiveSerializer<AdminMedia> {
  @override
  final Iterable<Type> types = const [AdminMedia, _$AdminMedia];

  @override
  final String wireName = r'AdminMedia';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminMedia object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.deletionReason != null) {
      yield r'deletionReason';
      yield serializers.serialize(
        object.deletionReason,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.uploaderUsername != null) {
      yield r'uploaderUsername';
      yield serializers.serialize(
        object.uploaderUsername,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.phash != null) {
      yield r'phash';
      yield serializers.serialize(
        object.phash,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.usedInPostsCount != null) {
      yield r'usedInPostsCount';
      yield serializers.serialize(
        object.usedInPostsCount,
        specifiedType: const FullType(int),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(MediaType),
    );
    if (object.userId != null) {
      yield r'userId';
      yield serializers.serialize(
        object.userId,
        specifiedType: const FullType(String),
      );
    }
    if (object.deletedBy != null) {
      yield r'deletedBy';
      yield serializers.serialize(
        object.deletedBy,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
    if (object.duration != null) {
      yield r'duration';
      yield serializers.serialize(
        object.duration,
        specifiedType: const FullType.nullable(double),
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
    yield r'width';
    yield serializers.serialize(
      object.width,
      specifiedType: const FullType(int),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'height';
    yield serializers.serialize(
      object.height,
      specifiedType: const FullType(int),
    );
    if (object.thumbnailUrl != null) {
      yield r'thumbnailUrl';
      yield serializers.serialize(
        object.thumbnailUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminMedia object, {
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
    required AdminMediaBuilder result,
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
        case r'uploaderUsername':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.uploaderUsername = valueDes;
          break;
        case r'phash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.phash = valueDes;
          break;
        case r'usedInPostsCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.usedInPostsCount = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaType),
          ) as MediaType;
          result.type = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'deletedBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.deletedBy = valueDes;
          break;
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        case r'duration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(double),
          ) as double?;
          if (valueDes == null) continue;
          result.duration = valueDes;
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
        case r'width':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.width = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'height':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.height = valueDes;
          break;
        case r'thumbnailUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.thumbnailUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminMedia deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminMediaBuilder();
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
