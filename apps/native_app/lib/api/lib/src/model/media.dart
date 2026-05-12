//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media.g.dart';

/// Media
///
/// Properties:
/// * [id]
/// * [type]
/// * [url]
/// * [width]
/// * [height]
/// * [createdAt]
/// * [duration] - Duration in seconds (video only, null for images)
/// * [thumbnailUrl] - Thumbnail URL (video only, null for images)
@BuiltValue(instantiable: false)
abstract class Media {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'type')
  MediaType get type;
  // enum typeEnum {  image,  video,  };

  @BuiltValueField(wireName: r'url')
  String get url;

  @BuiltValueField(wireName: r'width')
  int get width;

  @BuiltValueField(wireName: r'height')
  int get height;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// Duration in seconds (video only, null for images)
  @BuiltValueField(wireName: r'duration')
  double? get duration;

  /// Thumbnail URL (video only, null for images)
  @BuiltValueField(wireName: r'thumbnailUrl')
  String? get thumbnailUrl;

  @BuiltValueSerializer(custom: true)
  static Serializer<Media> get serializer => _$MediaSerializer();
}

class _$MediaSerializer implements PrimitiveSerializer<Media> {
  @override
  final Iterable<Type> types = const [Media];

  @override
  final String wireName = r'Media';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Media object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(MediaType),
    );
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
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
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.duration != null) {
      yield r'duration';
      yield serializers.serialize(
        object.duration,
        specifiedType: const FullType.nullable(double),
      );
    }
    if (object.thumbnailUrl != null) {
      yield r'thumbnailUrl';
      yield serializers.serialize(
        object.thumbnailUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    Media object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  @override
  Media deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.deserialize(serialized, specifiedType: FullType($Media))
        as $Media;
  }
}

/// a concrete implementation of [Media], since [Media] is not instantiable
@BuiltValue(instantiable: true)
abstract class $Media implements Media, Built<$Media, $MediaBuilder> {
  $Media._();

  factory $Media([void Function($MediaBuilder)? updates]) = _$$Media;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults($MediaBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<$Media> get serializer => _$$MediaSerializer();
}

class _$$MediaSerializer implements PrimitiveSerializer<$Media> {
  @override
  final Iterable<Type> types = const [$Media, _$$Media];

  @override
  final String wireName = r'$Media';

  @override
  Object serialize(
    Serializers serializers,
    $Media object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.serialize(object, specifiedType: FullType(Media))!;
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MediaBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaType),
          ) as MediaType;
          result.type = valueDes;
          break;
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
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
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'duration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(double),
          ) as double?;
          if (valueDes == null) continue;
          result.duration = valueDes;
          break;
        case r'thumbnailUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.thumbnailUrl = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  $Media deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = $MediaBuilder();
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
