//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_emoji.g.dart';

/// AdminEmoji
///
/// Properties:
/// * [id]
/// * [shortcode] - Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible).
/// * [imageUrl] - URL of the emoji WebP image.
/// * [width] - Output image width in pixels.
/// * [height] - Output image height in pixels.
/// * [createdAt]
/// * [updatedAt]
/// * [name] - Optional display name for the emoji.
/// * [category] - Optional category for grouping emojis.
/// * [license] - Optional license information for the emoji image.
@BuiltValue()
abstract class AdminEmoji implements Built<AdminEmoji, AdminEmojiBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible).
  @BuiltValueField(wireName: r'shortcode')
  String get shortcode;

  /// URL of the emoji WebP image.
  @BuiltValueField(wireName: r'imageUrl')
  String get imageUrl;

  /// Output image width in pixels.
  @BuiltValueField(wireName: r'width')
  int get width;

  /// Output image height in pixels.
  @BuiltValueField(wireName: r'height')
  int get height;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  /// Optional display name for the emoji.
  @BuiltValueField(wireName: r'name')
  String? get name;

  /// Optional category for grouping emojis.
  @BuiltValueField(wireName: r'category')
  String? get category;

  /// Optional license information for the emoji image.
  @BuiltValueField(wireName: r'license')
  String? get license;

  AdminEmoji._();

  factory AdminEmoji([void updates(AdminEmojiBuilder b)]) = _$AdminEmoji;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminEmojiBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminEmoji> get serializer => _$AdminEmojiSerializer();
}

class _$AdminEmojiSerializer implements PrimitiveSerializer<AdminEmoji> {
  @override
  final Iterable<Type> types = const [AdminEmoji, _$AdminEmoji];

  @override
  final String wireName = r'AdminEmoji';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminEmoji object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'shortcode';
    yield serializers.serialize(
      object.shortcode,
      specifiedType: const FullType(String),
    );
    yield r'imageUrl';
    yield serializers.serialize(
      object.imageUrl,
      specifiedType: const FullType(String),
    );
    yield r'width';
    yield serializers.serialize(
      object.width,
      specifiedType: const FullType(int),
    );
    yield r'height';
    yield serializers.serialize(
      object.height,
      specifiedType: const FullType(int),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.category != null) {
      yield r'category';
      yield serializers.serialize(
        object.category,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.license != null) {
      yield r'license';
      yield serializers.serialize(
        object.license,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminEmoji object, {
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
    required AdminEmojiBuilder result,
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
        case r'shortcode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.shortcode = valueDes;
          break;
        case r'imageUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.imageUrl = valueDes;
          break;
        case r'width':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.width = valueDes;
          break;
        case r'height':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.height = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.name = valueDes;
          break;
        case r'category':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.category = valueDes;
          break;
        case r'license':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.license = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminEmoji deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminEmojiBuilder();
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
