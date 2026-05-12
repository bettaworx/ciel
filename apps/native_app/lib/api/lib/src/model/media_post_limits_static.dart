//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_post_limits_static.g.dart';

/// MediaPostLimitsStatic
///
/// Properties:
/// * [maxSize] - Maximum longest edge size in pixels for static images (aspect ratio preserved)
@BuiltValue()
abstract class MediaPostLimitsStatic
    implements Built<MediaPostLimitsStatic, MediaPostLimitsStaticBuilder> {
  /// Maximum longest edge size in pixels for static images (aspect ratio preserved)
  @BuiltValueField(wireName: r'maxSize')
  int get maxSize;

  MediaPostLimitsStatic._();

  factory MediaPostLimitsStatic(
      [void updates(MediaPostLimitsStaticBuilder b)]) = _$MediaPostLimitsStatic;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaPostLimitsStaticBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaPostLimitsStatic> get serializer =>
      _$MediaPostLimitsStaticSerializer();
}

class _$MediaPostLimitsStaticSerializer
    implements PrimitiveSerializer<MediaPostLimitsStatic> {
  @override
  final Iterable<Type> types = const [
    MediaPostLimitsStatic,
    _$MediaPostLimitsStatic
  ];

  @override
  final String wireName = r'MediaPostLimitsStatic';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaPostLimitsStatic object, {
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
    MediaPostLimitsStatic object, {
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
    required MediaPostLimitsStaticBuilder result,
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
  MediaPostLimitsStatic deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaPostLimitsStaticBuilder();
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
