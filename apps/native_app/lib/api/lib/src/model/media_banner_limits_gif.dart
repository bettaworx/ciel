//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_banner_limits_gif.g.dart';

/// MediaBannerLimitsGif
///
/// Properties:
/// * [width] - Animated banner output width in pixels (center-cropped)
/// * [height] - Animated banner output height in pixels (center-cropped)
@BuiltValue()
abstract class MediaBannerLimitsGif
    implements Built<MediaBannerLimitsGif, MediaBannerLimitsGifBuilder> {
  /// Animated banner output width in pixels (center-cropped)
  @BuiltValueField(wireName: r'width')
  int get width;

  /// Animated banner output height in pixels (center-cropped)
  @BuiltValueField(wireName: r'height')
  int get height;

  MediaBannerLimitsGif._();

  factory MediaBannerLimitsGif([void updates(MediaBannerLimitsGifBuilder b)]) =
      _$MediaBannerLimitsGif;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaBannerLimitsGifBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaBannerLimitsGif> get serializer =>
      _$MediaBannerLimitsGifSerializer();
}

class _$MediaBannerLimitsGifSerializer
    implements PrimitiveSerializer<MediaBannerLimitsGif> {
  @override
  final Iterable<Type> types = const [
    MediaBannerLimitsGif,
    _$MediaBannerLimitsGif
  ];

  @override
  final String wireName = r'MediaBannerLimitsGif';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaBannerLimitsGif object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaBannerLimitsGif object, {
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
    required MediaBannerLimitsGifBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MediaBannerLimitsGif deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaBannerLimitsGifBuilder();
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
