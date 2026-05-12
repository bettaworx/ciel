//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_emoji_limits_static.g.dart';

/// MediaEmojiLimitsStatic
///
/// Properties:
/// * [height] - Output height in pixels for static custom emoji images (aspect ratio preserved)
@BuiltValue()
abstract class MediaEmojiLimitsStatic
    implements Built<MediaEmojiLimitsStatic, MediaEmojiLimitsStaticBuilder> {
  /// Output height in pixels for static custom emoji images (aspect ratio preserved)
  @BuiltValueField(wireName: r'height')
  int get height;

  MediaEmojiLimitsStatic._();

  factory MediaEmojiLimitsStatic(
          [void updates(MediaEmojiLimitsStaticBuilder b)]) =
      _$MediaEmojiLimitsStatic;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaEmojiLimitsStaticBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaEmojiLimitsStatic> get serializer =>
      _$MediaEmojiLimitsStaticSerializer();
}

class _$MediaEmojiLimitsStaticSerializer
    implements PrimitiveSerializer<MediaEmojiLimitsStatic> {
  @override
  final Iterable<Type> types = const [
    MediaEmojiLimitsStatic,
    _$MediaEmojiLimitsStatic
  ];

  @override
  final String wireName = r'MediaEmojiLimitsStatic';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaEmojiLimitsStatic object, {
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
    MediaEmojiLimitsStatic object, {
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
    required MediaEmojiLimitsStaticBuilder result,
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
  MediaEmojiLimitsStatic deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaEmojiLimitsStaticBuilder();
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
