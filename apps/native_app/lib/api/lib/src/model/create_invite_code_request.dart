//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_invite_code_request.g.dart';

/// CreateInviteCodeRequest
///
/// Properties:
/// * [code] - Optional custom invite code (1-32 characters, alphanumeric with underscore/hyphen). If not provided or null, an 8-character code will be auto-generated.
/// * [maxUses] - Maximum number of times this code can be used. null = unlimited
/// * [expiresAt] - Expiration date/time in ISO 8601 format. null = never expires
/// * [note] - Optional note about this invite code (e.g., \"For beta testers\")
@BuiltValue()
abstract class CreateInviteCodeRequest
    implements Built<CreateInviteCodeRequest, CreateInviteCodeRequestBuilder> {
  /// Optional custom invite code (1-32 characters, alphanumeric with underscore/hyphen). If not provided or null, an 8-character code will be auto-generated.
  @BuiltValueField(wireName: r'code')
  String? get code;

  /// Maximum number of times this code can be used. null = unlimited
  @BuiltValueField(wireName: r'maxUses')
  int? get maxUses;

  /// Expiration date/time in ISO 8601 format. null = never expires
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  /// Optional note about this invite code (e.g., \"For beta testers\")
  @BuiltValueField(wireName: r'note')
  String? get note;

  CreateInviteCodeRequest._();

  factory CreateInviteCodeRequest(
          [void updates(CreateInviteCodeRequestBuilder b)]) =
      _$CreateInviteCodeRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateInviteCodeRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateInviteCodeRequest> get serializer =>
      _$CreateInviteCodeRequestSerializer();
}

class _$CreateInviteCodeRequestSerializer
    implements PrimitiveSerializer<CreateInviteCodeRequest> {
  @override
  final Iterable<Type> types = const [
    CreateInviteCodeRequest,
    _$CreateInviteCodeRequest
  ];

  @override
  final String wireName = r'CreateInviteCodeRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateInviteCodeRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.code != null) {
      yield r'code';
      yield serializers.serialize(
        object.code,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.maxUses != null) {
      yield r'maxUses';
      yield serializers.serialize(
        object.maxUses,
        specifiedType: const FullType.nullable(int),
      );
    }
    if (object.expiresAt != null) {
      yield r'expiresAt';
      yield serializers.serialize(
        object.expiresAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    if (object.note != null) {
      yield r'note';
      yield serializers.serialize(
        object.note,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateInviteCodeRequest object, {
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
    required CreateInviteCodeRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'code':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.code = valueDes;
          break;
        case r'maxUses':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.maxUses = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.expiresAt = valueDes;
          break;
        case r'note':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.note = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateInviteCodeRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateInviteCodeRequestBuilder();
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
