//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/mute_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_mute.g.dart';

/// UserMute
///
/// Properties:
/// * [id]
/// * [userId] - ID of the muted user
/// * [muteType]
/// * [mutedBy] - Admin user ID who created this mute
/// * [createdAt]
/// * [reason] - Reason for the mute
/// * [expiresAt] - When the mute expires (null = permanent)
@BuiltValue()
abstract class UserMute implements Built<UserMute, UserMuteBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// ID of the muted user
  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'muteType')
  MuteType get muteType;
  // enum muteTypeEnum {  posts_create,  media_upload,  reactions_add,  all,  };

  /// Admin user ID who created this mute
  @BuiltValueField(wireName: r'mutedBy')
  String get mutedBy;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// Reason for the mute
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  /// When the mute expires (null = permanent)
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  UserMute._();

  factory UserMute([void updates(UserMuteBuilder b)]) = _$UserMute;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserMuteBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserMute> get serializer => _$UserMuteSerializer();
}

class _$UserMuteSerializer implements PrimitiveSerializer<UserMute> {
  @override
  final Iterable<Type> types = const [UserMute, _$UserMute];

  @override
  final String wireName = r'UserMute';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserMute object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'muteType';
    yield serializers.serialize(
      object.muteType,
      specifiedType: const FullType(MuteType),
    );
    yield r'mutedBy';
    yield serializers.serialize(
      object.mutedBy,
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
    UserMute object, {
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
    required UserMuteBuilder result,
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
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'muteType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MuteType),
          ) as MuteType;
          result.muteType = valueDes;
          break;
        case r'mutedBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mutedBy = valueDes;
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
  UserMute deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserMuteBuilder();
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
