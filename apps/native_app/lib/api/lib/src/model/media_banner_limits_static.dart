//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_banner_limits_static.g.dart';

/// MediaBannerLimitsStatic
///
/// Properties:
/// * [width] - Banner output width in pixels (center-cropped)
/// * [height] - Banner output height in pixels (center-cropped)
@BuiltValue()
abstract class MediaBannerLimitsStatic
    implements Built<MediaBannerLimitsStatic, MediaBannerLimitsStaticBuilder> {
  /// Banner output width in pixels (center-cropped)
  @BuiltValueField(wireName: r'width')
  int get width;

  /// Banner output height in pixels (center-cropped)
  @BuiltValueField(wireName: r'height')
  int get height;

  MediaBannerLimitsStatic._();

  factory MediaBannerLimitsStatic(
          [void updates(MediaBannerLimitsStaticBuilder b)]) =
      _$MediaBannerLimitsStatic;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaBannerLimitsStaticBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaBannerLimitsStatic> get serializer =>
      _$MediaBannerLimitsStaticSerializer();
}

class _$MediaBannerLimitsStaticSerializer
    implements PrimitiveSerializer<MediaBannerLimitsStatic> {
  @override
  final Iterable<Type> types = const [
    MediaBannerLimitsStatic,
    _$MediaBannerLimitsStatic
  ];

  @override
  final String wireName = r'MediaBannerLimitsStatic';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaBannerLimitsStatic object, {
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
    MediaBannerLimitsStatic object, {
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
    required MediaBannerLimitsStaticBuilder result,
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
  MediaBannerLimitsStatic deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaBannerLimitsStaticBuilder();
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
