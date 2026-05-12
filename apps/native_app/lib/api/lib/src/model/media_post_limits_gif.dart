//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_post_limits_gif.g.dart';

/// MediaPostLimitsGif
///
/// Properties:
/// * [maxSize] - Maximum longest edge size in pixels for animated GIFs (aspect ratio preserved)
@BuiltValue()
abstract class MediaPostLimitsGif
    implements Built<MediaPostLimitsGif, MediaPostLimitsGifBuilder> {
  /// Maximum longest edge size in pixels for animated GIFs (aspect ratio preserved)
  @BuiltValueField(wireName: r'maxSize')
  int get maxSize;

  MediaPostLimitsGif._();

  factory MediaPostLimitsGif([void updates(MediaPostLimitsGifBuilder b)]) =
      _$MediaPostLimitsGif;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaPostLimitsGifBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaPostLimitsGif> get serializer =>
      _$MediaPostLimitsGifSerializer();
}

class _$MediaPostLimitsGifSerializer
    implements PrimitiveSerializer<MediaPostLimitsGif> {
  @override
  final Iterable<Type> types = const [MediaPostLimitsGif, _$MediaPostLimitsGif];

  @override
  final String wireName = r'MediaPostLimitsGif';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaPostLimitsGif object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'maxSize';
    yield serializers.serialize(
      object.maxSize,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaPostLimitsGif object, {
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
    required MediaPostLimitsGifBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'maxSize':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.maxSize = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MediaPostLimitsGif deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaPostLimitsGifBuilder();
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
