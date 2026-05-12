//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media_server_icon_limits_static.dart';
import 'package:ciel_api/src/model/media_server_icon_limits_gif.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_server_icon_limits.g.dart';

/// MediaServerIconLimits
///
/// Properties:
/// * [static_]
/// * [gif]
@BuiltValue()
abstract class MediaServerIconLimits
    implements Built<MediaServerIconLimits, MediaServerIconLimitsBuilder> {
  @BuiltValueField(wireName: r'static')
  MediaServerIconLimitsStatic get static_;

  @BuiltValueField(wireName: r'gif')
  MediaServerIconLimitsGif get gif;

  MediaServerIconLimits._();

  factory MediaServerIconLimits(
      [void updates(MediaServerIconLimitsBuilder b)]) = _$MediaServerIconLimits;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaServerIconLimitsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaServerIconLimits> get serializer =>
      _$MediaServerIconLimitsSerializer();
}

class _$MediaServerIconLimitsSerializer
    implements PrimitiveSerializer<MediaServerIconLimits> {
  @override
  final Iterable<Type> types = const [
    MediaServerIconLimits,
    _$MediaServerIconLimits
  ];

  @override
  final String wireName = r'MediaServerIconLimits';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaServerIconLimits object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'static';
    yield serializers.serialize(
      object.static_,
      specifiedType: const FullType(MediaServerIconLimitsStatic),
    );
    yield r'gif';
    yield serializers.serialize(
      object.gif,
      specifiedType: const FullType(MediaServerIconLimitsGif),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaServerIconLimits object, {
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
    required MediaServerIconLimitsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'static':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaServerIconLimitsStatic),
          ) as MediaServerIconLimitsStatic;
          result.static_.replace(valueDes);
          break;
        case r'gif':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaServerIconLimitsGif),
          ) as MediaServerIconLimitsGif;
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
  MediaServerIconLimits deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaServerIconLimitsBuilder();
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
