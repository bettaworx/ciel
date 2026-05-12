//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invite_code_use.g.dart';

/// InviteCodeUse
///
/// Properties:
/// * [id]
/// * [inviteCodeId]
/// * [userId]
/// * [usedAt]
/// * [username] - Username of user who used the code
/// * [displayName] - Display name of user who used the code
/// * [avatarMediaId] - Avatar media ID of user who used the code
@BuiltValue()
abstract class InviteCodeUse
    implements Built<InviteCodeUse, InviteCodeUseBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'inviteCodeId')
  String get inviteCodeId;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'usedAt')
  DateTime get usedAt;

  /// Username of user who used the code
  @BuiltValueField(wireName: r'username')
  String get username;

  /// Display name of user who used the code
  @BuiltValueField(wireName: r'displayName')
  String? get displayName;

  /// Avatar media ID of user who used the code
  @BuiltValueField(wireName: r'avatarMediaId')
  String? get avatarMediaId;

  InviteCodeUse._();

  factory InviteCodeUse([void updates(InviteCodeUseBuilder b)]) =
      _$InviteCodeUse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InviteCodeUseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InviteCodeUse> get serializer =>
      _$InviteCodeUseSerializer();
}

class _$InviteCodeUseSerializer implements PrimitiveSerializer<InviteCodeUse> {
  @override
  final Iterable<Type> types = const [InviteCodeUse, _$InviteCodeUse];

  @override
  final String wireName = r'InviteCodeUse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InviteCodeUse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'inviteCodeId';
    yield serializers.serialize(
      object.inviteCodeId,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'usedAt';
    yield serializers.serialize(
      object.usedAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'username';
    yield serializers.serialize(
      object.username,
      specifiedType: const FullType(String),
    );
    if (object.displayName != null) {
      yield r'displayName';
      yield serializers.serialize(
        object.displayName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.avatarMediaId != null) {
      yield r'avatarMediaId';
      yield serializers.serialize(
        object.avatarMediaId,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    InviteCodeUse object, {
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
    required InviteCodeUseBuilder result,
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
        case r'inviteCodeId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.inviteCodeId = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'usedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.usedAt = valueDes;
          break;
        case r'username':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.username = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.displayName = valueDes;
          break;
        case r'avatarMediaId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.avatarMediaId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  InviteCodeUse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InviteCodeUseBuilder();
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
