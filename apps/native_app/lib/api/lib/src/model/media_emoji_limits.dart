//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media_emoji_limits_static.dart';
import 'package:ciel_api/src/model/media_emoji_limits_gif.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_emoji_limits.g.dart';

/// MediaEmojiLimits
///
/// Properties:
/// * [static_]
/// * [gif]
@BuiltValue()
abstract class MediaEmojiLimits
    implements Built<MediaEmojiLimits, MediaEmojiLimitsBuilder> {
  @BuiltValueField(wireName: r'static')
  MediaEmojiLimitsStatic get static_;

  @BuiltValueField(wireName: r'gif')
  MediaEmojiLimitsGif get gif;

  MediaEmojiLimits._();

  factory MediaEmojiLimits([void updates(MediaEmojiLimitsBuilder b)]) =
      _$MediaEmojiLimits;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaEmojiLimitsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaEmojiLimits> get serializer =>
      _$MediaEmojiLimitsSerializer();
}

class _$MediaEmojiLimitsSerializer
    implements PrimitiveSerializer<MediaEmojiLimits> {
  @override
  final Iterable<Type> types = const [MediaEmojiLimits, _$MediaEmojiLimits];

  @override
  final String wireName = r'MediaEmojiLimits';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaEmojiLimits object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'static';
    yield serializers.serialize(
      object.static_,
      specifiedType: const FullType(MediaEmojiLimitsStatic),
    );
    yield r'gif';
    yield serializers.serialize(
      object.gif,
      specifiedType: const FullType(MediaEmojiLimitsGif),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaEmojiLimits object, {
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
    required MediaEmojiLimitsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'static':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaEmojiLimitsStatic),
          ) as MediaEmojiLimitsStatic;
          result.static_.replace(valueDes);
          break;
        case r'gif':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaEmojiLimitsGif),
          ) as MediaEmojiLimitsGif;
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
  MediaEmojiLimits deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaEmojiLimitsBuilder();
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
