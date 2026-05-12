//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/invite_code.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invite_code_with_creator.g.dart';

/// InviteCodeWithCreator
///
/// Properties:
/// * [id]
/// * [code] - Invite code (auto-generated 8-char or custom up to 32 chars)
/// * [createdBy] - User ID of creator
/// * [createdAt]
/// * [useCount] - Number of times this code has been used
/// * [disabled] - Whether this code has been disabled
/// * [creatorUsername] - Username of the creator
/// * [lastUsedAt]
/// * [maxUses] - Maximum allowed uses. null = unlimited
/// * [expiresAt] - Expiration date. null = never expires
/// * [note] - Optional note about this invite code
/// * [creatorDisplayName] - Display name of the creator
@BuiltValue()
abstract class InviteCodeWithCreator
    implements
        InviteCode,
        Built<InviteCodeWithCreator, InviteCodeWithCreatorBuilder> {
  /// Username of the creator
  @BuiltValueField(wireName: r'creatorUsername')
  String get creatorUsername;

  /// Display name of the creator
  @BuiltValueField(wireName: r'creatorDisplayName')
  String? get creatorDisplayName;

  InviteCodeWithCreator._();

  factory InviteCodeWithCreator(
      [void updates(InviteCodeWithCreatorBuilder b)]) = _$InviteCodeWithCreator;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InviteCodeWithCreatorBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InviteCodeWithCreator> get serializer =>
      _$InviteCodeWithCreatorSerializer();
}

class _$InviteCodeWithCreatorSerializer
    implements PrimitiveSerializer<InviteCodeWithCreator> {
  @override
  final Iterable<Type> types = const [
    InviteCodeWithCreator,
    _$InviteCodeWithCreator
  ];

  @override
  final String wireName = r'InviteCodeWithCreator';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InviteCodeWithCreator object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.maxUses != null) {
      yield r'maxUses';
      yield serializers.serialize(
        object.maxUses,
        specifiedType: const FullType.nullable(int),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.note != null) {
      yield r'note';
      yield serializers.serialize(
        object.note,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'code';
    yield serializers.serialize(
      object.code,
      specifiedType: const FullType(String),
    );
    yield r'createdBy';
    yield serializers.serialize(
      object.createdBy,
      specifiedType: const FullType(String),
    );
    if (object.lastUsedAt != null) {
      yield r'lastUsedAt';
      yield serializers.serialize(
        object.lastUsedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    yield r'creatorUsername';
    yield serializers.serialize(
      object.creatorUsername,
      specifiedType: const FullType(String),
    );
    yield r'disabled';
    yield serializers.serialize(
      object.disabled,
      specifiedType: const FullType(bool),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'useCount';
    yield serializers.serialize(
      object.useCount,
      specifiedType: const FullType(int),
    );
    if (object.creatorDisplayName != null) {
      yield r'creatorDisplayName';
      yield serializers.serialize(
        object.creatorDisplayName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.expiresAt != null) {
      yield r'expiresAt';
      yield serializers.serialize(
        object.expiresAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    InviteCodeWithCreator object, {
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
    required InviteCodeWithCreatorBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'maxUses':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.maxUses = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'note':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.note = valueDes;
          break;
        case r'code':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.code = valueDes;
          break;
        case r'createdBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdBy = valueDes;
          break;
        case r'lastUsedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.lastUsedAt = valueDes;
          break;
        case r'creatorUsername':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.creatorUsername = valueDes;
          break;
        case r'disabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.disabled = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'useCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.useCount = valueDes;
          break;
        case r'creatorDisplayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.creatorDisplayName = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.expiresAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  InviteCodeWithCreator deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InviteCodeWithCreatorBuilder();
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
