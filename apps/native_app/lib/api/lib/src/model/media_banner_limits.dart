//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media_banner_limits_static.dart';
import 'package:ciel_api/src/model/media_banner_limits_gif.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_banner_limits.g.dart';

/// MediaBannerLimits
///
/// Properties:
/// * [static_]
/// * [gif]
@BuiltValue()
abstract class MediaBannerLimits
    implements Built<MediaBannerLimits, MediaBannerLimitsBuilder> {
  @BuiltValueField(wireName: r'static')
  MediaBannerLimitsStatic get static_;

  @BuiltValueField(wireName: r'gif')
  MediaBannerLimitsGif get gif;

  MediaBannerLimits._();

  factory MediaBannerLimits([void updates(MediaBannerLimitsBuilder b)]) =
      _$MediaBannerLimits;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaBannerLimitsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaBannerLimits> get serializer =>
      _$MediaBannerLimitsSerializer();
}

class _$MediaBannerLimitsSerializer
    implements PrimitiveSerializer<MediaBannerLimits> {
  @override
  final Iterable<Type> types = const [MediaBannerLimits, _$MediaBannerLimits];

  @override
  final String wireName = r'MediaBannerLimits';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaBannerLimits object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'static';
    yield serializers.serialize(
      object.static_,
      specifiedType: const FullType(MediaBannerLimitsStatic),
    );
    yield r'gif';
    yield serializers.serialize(
      object.gif,
      specifiedType: const FullType(MediaBannerLimitsGif),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaBannerLimits object, {
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
    required MediaBannerLimitsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'static':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaBannerLimitsStatic),
          ) as MediaBannerLimitsStatic;
          result.static_.replace(valueDes);
          break;
        case r'gif':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaBannerLimitsGif),
          ) as MediaBannerLimitsGif;
          result.gif.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MediaBannerLimits deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaBannerLimitsBuilder();
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
