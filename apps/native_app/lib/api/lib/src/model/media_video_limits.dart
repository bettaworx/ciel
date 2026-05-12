//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_video_limits.g.dart';

/// MediaVideoLimits
///
/// Properties:
/// * [maxUploadSizeMB] - Maximum video file upload size in megabytes
/// * [maxDurationSeconds] - Maximum video duration in seconds
/// * [maxSize] - Maximum longest edge size in pixels for video output (aspect ratio preserved)
@BuiltValue()
abstract class MediaVideoLimits
    implements Built<MediaVideoLimits, MediaVideoLimitsBuilder> {
  /// Maximum video file upload size in megabytes
  @BuiltValueField(wireName: r'maxUploadSizeMB')
  int get maxUploadSizeMB;

  /// Maximum video duration in seconds
  @BuiltValueField(wireName: r'maxDurationSeconds')
  int get maxDurationSeconds;

  /// Maximum longest edge size in pixels for video output (aspect ratio preserved)
  @BuiltValueField(wireName: r'maxSize')
  int get maxSize;

  MediaVideoLimits._();

  factory MediaVideoLimits([void updates(MediaVideoLimitsBuilder b)]) =
      _$MediaVideoLimits;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaVideoLimitsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaVideoLimits> get serializer =>
      _$MediaVideoLimitsSerializer();
}

class _$MediaVideoLimitsSerializer
    implements PrimitiveSerializer<MediaVideoLimits> {
  @override
  final Iterable<Type> types = const [MediaVideoLimits, _$MediaVideoLimits];

  @override
  final String wireName = r'MediaVideoLimits';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaVideoLimits object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'maxUploadSizeMB';
    yield serializers.serialize(
      object.maxUploadSizeMB,
      specifiedType: const FullType(int),
    );
    yield r'maxDurationSeconds';
    yield serializers.serialize(
      object.maxDurationSeconds,
      specifiedType: const FullType(int),
    );
    yield r'maxSize';
    yield serializers.serialize(
      object.maxSize,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaVideoLimits object, {
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
    required MediaVideoLimitsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'maxUploadSizeMB':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.maxUploadSizeMB = valueDes;
          break;
        case r'maxDurationSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.maxDurationSeconds = valueDes;
          break;
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
  MediaVideoLimits deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaVideoLimitsBuilder();
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
