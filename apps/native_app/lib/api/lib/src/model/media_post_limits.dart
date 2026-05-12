//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media_post_limits_gif.dart';
import 'package:ciel_api/src/model/media_post_limits_static.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_post_limits.g.dart';

/// MediaPostLimits
///
/// Properties:
/// * [static_]
/// * [gif]
@BuiltValue()
abstract class MediaPostLimits
    implements Built<MediaPostLimits, MediaPostLimitsBuilder> {
  @BuiltValueField(wireName: r'static')
  MediaPostLimitsStatic get static_;

  @BuiltValueField(wireName: r'gif')
  MediaPostLimitsGif get gif;

  MediaPostLimits._();

  factory MediaPostLimits([void updates(MediaPostLimitsBuilder b)]) =
      _$MediaPostLimits;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaPostLimitsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaPostLimits> get serializer =>
      _$MediaPostLimitsSerializer();
}

class _$MediaPostLimitsSerializer
    implements PrimitiveSerializer<MediaPostLimits> {
  @override
  final Iterable<Type> types = const [MediaPostLimits, _$MediaPostLimits];

  @override
  final String wireName = r'MediaPostLimits';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaPostLimits object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'static';
    yield serializers.serialize(
      object.static_,
      specifiedType: const FullType(MediaPostLimitsStatic),
    );
    yield r'gif';
    yield serializers.serialize(
      object.gif,
      specifiedType: const FullType(MediaPostLimitsGif),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaPostLimits object, {
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
    required MediaPostLimitsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'static':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaPostLimitsStatic),
          ) as MediaPostLimitsStatic;
          result.static_.replace(valueDes);
          break;
        case r'gif':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaPostLimitsGif),
          ) as MediaPostLimitsGif;
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
  MediaPostLimits deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaPostLimitsBuilder();
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
