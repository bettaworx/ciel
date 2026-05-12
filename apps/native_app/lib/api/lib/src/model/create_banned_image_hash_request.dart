//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/image_hash_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_banned_image_hash_request.g.dart';

/// CreateBannedImageHashRequest
///
/// Properties:
/// * [hash] - Image hash value (hex or base64)
/// * [hashType]
/// * [reason] - Reason why this image is banned
@BuiltValue()
abstract class CreateBannedImageHashRequest
    implements
        Built<CreateBannedImageHashRequest,
            CreateBannedImageHashRequestBuilder> {
  /// Image hash value (hex or base64)
  @BuiltValueField(wireName: r'hash')
  String get hash;

  @BuiltValueField(wireName: r'hashType')
  ImageHashType get hashType;
  // enum hashTypeEnum {  phash,  md5,  };

  /// Reason why this image is banned
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  CreateBannedImageHashRequest._();

  factory CreateBannedImageHashRequest(
          [void updates(CreateBannedImageHashRequestBuilder b)]) =
      _$CreateBannedImageHashRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateBannedImageHashRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateBannedImageHashRequest> get serializer =>
      _$CreateBannedImageHashRequestSerializer();
}

class _$CreateBannedImageHashRequestSerializer
    implements PrimitiveSerializer<CreateBannedImageHashRequest> {
  @override
  final Iterable<Type> types = const [
    CreateBannedImageHashRequest,
    _$CreateBannedImageHashRequest
  ];

  @override
  final String wireName = r'CreateBannedImageHashRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateBannedImageHashRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'hash';
    yield serializers.serialize(
      object.hash,
      specifiedType: const FullType(String),
    );
    yield r'hashType';
    yield serializers.serialize(
      object.hashType,
      specifiedType: const FullType(ImageHashType),
    );
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateBannedImageHashRequest object, {
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
    required CreateBannedImageHashRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'hash':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.hash = valueDes;
          break;
        case r'hashType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ImageHashType),
          ) as ImageHashType;
          result.hashType = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateBannedImageHashRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateBannedImageHashRequestBuilder();
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
