//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'public_emoji.g.dart';

/// PublicEmoji
///
/// Properties:
/// * [shortcode] - Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible).
/// * [imageUrl] - URL of the emoji WebP image.
/// * [name] - Optional display name for the emoji.
/// * [category] - Optional category for grouping emojis.
/// * [license] - Optional license information for the emoji image.
@BuiltValue()
abstract class PublicEmoji implements Built<PublicEmoji, PublicEmojiBuilder> {
  /// Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible).
  @BuiltValueField(wireName: r'shortcode')
  String get shortcode;

  /// URL of the emoji WebP image.
  @BuiltValueField(wireName: r'imageUrl')
  String get imageUrl;

  /// Optional display name for the emoji.
  @BuiltValueField(wireName: r'name')
  String? get name;

  /// Optional category for grouping emojis.
  @BuiltValueField(wireName: r'category')
  String? get category;

  /// Optional license information for the emoji image.
  @BuiltValueField(wireName: r'license')
  String? get license;

  PublicEmoji._();

  factory PublicEmoji([void updates(PublicEmojiBuilder b)]) = _$PublicEmoji;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PublicEmojiBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PublicEmoji> get serializer => _$PublicEmojiSerializer();
}

class _$PublicEmojiSerializer implements PrimitiveSerializer<PublicEmoji> {
  @override
  final Iterable<Type> types = const [PublicEmoji, _$PublicEmoji];

  @override
  final String wireName = r'PublicEmoji';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PublicEmoji object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    PublicEmoji object, {
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
    required PublicEmojiBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
  PublicEmoji deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PublicEmojiBuilder();
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
