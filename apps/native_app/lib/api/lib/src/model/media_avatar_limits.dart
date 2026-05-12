//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_avatar_limits.g.dart';

/// MediaAvatarLimits
///
/// Properties:
/// * [size] - Avatar output size in pixels (square, center-cropped)
@BuiltValue()
abstract class MediaAvatarLimits
    implements Built<MediaAvatarLimits, MediaAvatarLimitsBuilder> {
  /// Avatar output size in pixels (square, center-cropped)
  @BuiltValueField(wireName: r'size')
  int get size;

  MediaAvatarLimits._();

  factory MediaAvatarLimits([void updates(MediaAvatarLimitsBuilder b)]) =
      _$MediaAvatarLimits;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaAvatarLimitsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaAvatarLimits> get serializer =>
      _$MediaAvatarLimitsSerializer();
}

class _$MediaAvatarLimitsSerializer
    implements PrimitiveSerializer<MediaAvatarLimits> {
  @override
  final Iterable<Type> types = const [MediaAvatarLimits, _$MediaAvatarLimits];

  @override
  final String wireName = r'MediaAvatarLimits';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaAvatarLimits object, {
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
    MediaAvatarLimits object, {
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
    required MediaAvatarLimitsBuilder result,
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
  MediaAvatarLimits deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaAvatarLimitsBuilder();
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
