//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_server_icon_limits_static.g.dart';

/// MediaServerIconLimitsStatic
///
/// Properties:
/// * [size] - Server icon output size in pixels (square, center-cropped)
@BuiltValue()
abstract class MediaServerIconLimitsStatic
    implements
        Built<MediaServerIconLimitsStatic, MediaServerIconLimitsStaticBuilder> {
  /// Server icon output size in pixels (square, center-cropped)
  @BuiltValueField(wireName: r'size')
  int get size;

  MediaServerIconLimitsStatic._();

  factory MediaServerIconLimitsStatic(
          [void updates(MediaServerIconLimitsStaticBuilder b)]) =
      _$MediaServerIconLimitsStatic;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaServerIconLimitsStaticBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaServerIconLimitsStatic> get serializer =>
      _$MediaServerIconLimitsStaticSerializer();
}

class _$MediaServerIconLimitsStaticSerializer
    implements PrimitiveSerializer<MediaServerIconLimitsStatic> {
  @override
  final Iterable<Type> types = const [
    MediaServerIconLimitsStatic,
    _$MediaServerIconLimitsStatic
  ];

  @override
  final String wireName = r'MediaServerIconLimitsStatic';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaServerIconLimitsStatic object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'size';
    yield serializers.serialize(
      object.size,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaServerIconLimitsStatic object, {
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
    required MediaServerIconLimitsStaticBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'size':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.size = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MediaServerIconLimitsStatic deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaServerIconLimitsStaticBuilder();
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
