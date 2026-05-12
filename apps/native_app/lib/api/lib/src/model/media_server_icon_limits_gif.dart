//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_server_icon_limits_gif.g.dart';

/// MediaServerIconLimitsGif
///
/// Properties:
/// * [maxSize] - Maximum longest edge size in pixels for animated GIF server icons (aspect ratio preserved). Both animated and static (first frame) versions are created.
@BuiltValue()
abstract class MediaServerIconLimitsGif
    implements
        Built<MediaServerIconLimitsGif, MediaServerIconLimitsGifBuilder> {
  /// Maximum longest edge size in pixels for animated GIF server icons (aspect ratio preserved). Both animated and static (first frame) versions are created.
  @BuiltValueField(wireName: r'maxSize')
  int get maxSize;

  MediaServerIconLimitsGif._();

  factory MediaServerIconLimitsGif(
          [void updates(MediaServerIconLimitsGifBuilder b)]) =
      _$MediaServerIconLimitsGif;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaServerIconLimitsGifBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaServerIconLimitsGif> get serializer =>
      _$MediaServerIconLimitsGifSerializer();
}

class _$MediaServerIconLimitsGifSerializer
    implements PrimitiveSerializer<MediaServerIconLimitsGif> {
  @override
  final Iterable<Type> types = const [
    MediaServerIconLimitsGif,
    _$MediaServerIconLimitsGif
  ];

  @override
  final String wireName = r'MediaServerIconLimitsGif';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaServerIconLimitsGif object, {
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
    MediaServerIconLimitsGif object, {
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
    required MediaServerIconLimitsGifBuilder result,
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
  MediaServerIconLimitsGif deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaServerIconLimitsGifBuilder();
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
