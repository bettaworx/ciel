//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_emoji_limits_gif.g.dart';

/// MediaEmojiLimitsGif
///
/// Properties:
/// * [height] - Output height in pixels for animated GIF custom emoji images (aspect ratio preserved)
@BuiltValue()
abstract class MediaEmojiLimitsGif
    implements Built<MediaEmojiLimitsGif, MediaEmojiLimitsGifBuilder> {
  /// Output height in pixels for animated GIF custom emoji images (aspect ratio preserved)
  @BuiltValueField(wireName: r'height')
  int get height;

  MediaEmojiLimitsGif._();

  factory MediaEmojiLimitsGif([void updates(MediaEmojiLimitsGifBuilder b)]) =
      _$MediaEmojiLimitsGif;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaEmojiLimitsGifBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaEmojiLimitsGif> get serializer =>
      _$MediaEmojiLimitsGifSerializer();
}

class _$MediaEmojiLimitsGifSerializer
    implements PrimitiveSerializer<MediaEmojiLimitsGif> {
  @override
  final Iterable<Type> types = const [
    MediaEmojiLimitsGif,
    _$MediaEmojiLimitsGif
  ];

  @override
  final String wireName = r'MediaEmojiLimitsGif';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaEmojiLimitsGif object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'height';
    yield serializers.serialize(
      object.height,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaEmojiLimitsGif object, {
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
    required MediaEmojiLimitsGifBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'height':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.height = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MediaEmojiLimitsGif deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaEmojiLimitsGifBuilder();
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
