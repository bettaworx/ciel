//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_invite_code_request.g.dart';

/// UpdateInviteCodeRequest
///
/// Properties:
/// * [code] - Updated invite code (1-32 characters, alphanumeric with underscore/hyphen). Must be unique. Omit this field to keep the existing code.
/// * [maxUses] - Maximum number of times this code can be used. null = unlimited. Omit this field to keep the existing value.
/// * [expiresAt] - Expiration date/time in ISO 8601 format. null = never expires. Omit this field to keep the existing value.
/// * [note] - Updated note about this invite code (e.g., \"For beta testers\"). null = clear the note. Omit this field to keep the existing value.
@BuiltValue()
abstract class UpdateInviteCodeRequest
    implements Built<UpdateInviteCodeRequest, UpdateInviteCodeRequestBuilder> {
  /// Updated invite code (1-32 characters, alphanumeric with underscore/hyphen). Must be unique. Omit this field to keep the existing code.
  @BuiltValueField(wireName: r'code')
  String? get code;

  /// Maximum number of times this code can be used. null = unlimited. Omit this field to keep the existing value.
  @BuiltValueField(wireName: r'maxUses')
  int? get maxUses;

  /// Expiration date/time in ISO 8601 format. null = never expires. Omit this field to keep the existing value.
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  /// Updated note about this invite code (e.g., \"For beta testers\"). null = clear the note. Omit this field to keep the existing value.
  @BuiltValueField(wireName: r'note')
  String? get note;

  UpdateInviteCodeRequest._();

  factory UpdateInviteCodeRequest(
          [void updates(UpdateInviteCodeRequestBuilder b)]) =
      _$UpdateInviteCodeRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateInviteCodeRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateInviteCodeRequest> get serializer =>
      _$UpdateInviteCodeRequestSerializer();
}

class _$UpdateInviteCodeRequestSerializer
    implements PrimitiveSerializer<UpdateInviteCodeRequest> {
  @override
  final Iterable<Type> types = const [
    UpdateInviteCodeRequest,
    _$UpdateInviteCodeRequest
  ];

  @override
  final String wireName = r'UpdateInviteCodeRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateInviteCodeRequest object, {
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
    UpdateInviteCodeRequest object, {
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
    required UpdateInviteCodeRequestBuilder result,
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
  UpdateInviteCodeRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateInviteCodeRequestBuilder();
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
