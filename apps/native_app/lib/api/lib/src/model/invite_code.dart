//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invite_code.g.dart';

/// InviteCode
///
/// Properties:
/// * [id]
/// * [code] - Invite code (auto-generated 8-char or custom up to 32 chars)
/// * [createdBy] - User ID of creator
/// * [createdAt]
/// * [useCount] - Number of times this code has been used
/// * [disabled] - Whether this code has been disabled
/// * [lastUsedAt]
/// * [maxUses] - Maximum allowed uses. null = unlimited
/// * [expiresAt] - Expiration date. null = never expires
/// * [note] - Optional note about this invite code
@BuiltValue(instantiable: false)
abstract class InviteCode {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Invite code (auto-generated 8-char or custom up to 32 chars)
  @BuiltValueField(wireName: r'code')
  String get code;

  /// User ID of creator
  @BuiltValueField(wireName: r'createdBy')
  String get createdBy;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// Number of times this code has been used
  @BuiltValueField(wireName: r'useCount')
  int get useCount;

  /// Whether this code has been disabled
  @BuiltValueField(wireName: r'disabled')
  bool get disabled;

  @BuiltValueField(wireName: r'lastUsedAt')
  DateTime? get lastUsedAt;

  /// Maximum allowed uses. null = unlimited
  @BuiltValueField(wireName: r'maxUses')
  int? get maxUses;

  /// Expiration date. null = never expires
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  /// Optional note about this invite code
  @BuiltValueField(wireName: r'note')
  String? get note;

  @BuiltValueSerializer(custom: true)
  static Serializer<InviteCode> get serializer => _$InviteCodeSerializer();
}

class _$InviteCodeSerializer implements PrimitiveSerializer<InviteCode> {
  @override
  final Iterable<Type> types = const [InviteCode];

  @override
  final String wireName = r'InviteCode';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InviteCode object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
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
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'useCount';
    yield serializers.serialize(
      object.useCount,
      specifiedType: const FullType(int),
    );
    yield r'disabled';
    yield serializers.serialize(
      object.disabled,
      specifiedType: const FullType(bool),
    );
    if (object.lastUsedAt != null) {
      yield r'lastUsedAt';
      yield serializers.serialize(
        object.lastUsedAt,
        specifiedType: const FullType.nullable(DateTime),
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
    InviteCode object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  @override
  InviteCode deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.deserialize(serialized,
        specifiedType: FullType($InviteCode)) as $InviteCode;
  }
}

/// a concrete implementation of [InviteCode], since [InviteCode] is not instantiable
@BuiltValue(instantiable: true)
abstract class $InviteCode
    implements InviteCode, Built<$InviteCode, $InviteCodeBuilder> {
  $InviteCode._();

  factory $InviteCode([void Function($InviteCodeBuilder)? updates]) =
      _$$InviteCode;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults($InviteCodeBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<$InviteCode> get serializer => _$$InviteCodeSerializer();
}

class _$$InviteCodeSerializer implements PrimitiveSerializer<$InviteCode> {
  @override
  final Iterable<Type> types = const [$InviteCode, _$$InviteCode];

  @override
  final String wireName = r'$InviteCode';

  @override
  Object serialize(
    Serializers serializers,
    $InviteCode object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.serialize(object, specifiedType: FullType(InviteCode))!;
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InviteCodeBuilder result,
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
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'useCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.useCount = valueDes;
          break;
        case r'disabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.disabled = valueDes;
          break;
        case r'lastUsedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.lastUsedAt = valueDes;
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
  $InviteCode deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = $InviteCodeBuilder();
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
