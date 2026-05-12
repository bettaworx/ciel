//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/image_hash_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'banned_image_hash.g.dart';

/// BannedImageHash
///
/// Properties:
/// * [id] - Banned image hash ID
/// * [hash] - Image hash value (hex or base64)
/// * [hashType]
/// * [createdBy] - Admin user ID who created this rule
/// * [createdAt]
/// * [reason] - Reason why this image is banned
@BuiltValue()
abstract class BannedImageHash
    implements Built<BannedImageHash, BannedImageHashBuilder> {
  /// Banned image hash ID
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Image hash value (hex or base64)
  @BuiltValueField(wireName: r'hash')
  String get hash;

  @BuiltValueField(wireName: r'hashType')
  ImageHashType get hashType;
  // enum hashTypeEnum {  phash,  md5,  };

  /// Admin user ID who created this rule
  @BuiltValueField(wireName: r'createdBy')
  String get createdBy;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// Reason why this image is banned
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  BannedImageHash._();

  factory BannedImageHash([void updates(BannedImageHashBuilder b)]) =
      _$BannedImageHash;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BannedImageHashBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BannedImageHash> get serializer =>
      _$BannedImageHashSerializer();
}

class _$BannedImageHashSerializer
    implements PrimitiveSerializer<BannedImageHash> {
  @override
  final Iterable<Type> types = const [BannedImageHash, _$BannedImageHash];

  @override
  final String wireName = r'BannedImageHash';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BannedImageHash object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
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
    yield r'createdBy';
    yield serializers.serialize(
      object.createdBy,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
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
    BannedImageHash object, {
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
    required BannedImageHashBuilder result,
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
        case r'createdBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdBy = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
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
  BannedImageHash deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BannedImageHashBuilder();
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
