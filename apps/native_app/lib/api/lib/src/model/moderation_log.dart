//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/moderation_target_type.dart';
import 'package:ciel_api/src/model/moderation_action.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'moderation_log.g.dart';

/// ModerationLog
///
/// Properties:
/// * [id]
/// * [adminUserId] - Admin user who performed the action (null for system actions)
/// * [action]
/// * [targetType]
/// * [targetId] - ID of the target (format depends on target type)
/// * [createdAt]
/// * [adminUsername] - Username of admin who performed the action
/// * [adminDisplayName] - Display name of admin who performed the action
/// * [details] - Additional details about the action (JSON object)
@BuiltValue()
abstract class ModerationLog
    implements Built<ModerationLog, ModerationLogBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Admin user who performed the action (null for system actions)
  @BuiltValueField(wireName: r'adminUserId')
  String? get adminUserId;

  @BuiltValueField(wireName: r'action')
  ModerationAction get action;
  // enum actionEnum {  ban_user,  unban_user,  mute_user,  unmute_user,  delete_post,  hide_post,  unhide_post,  delete_media,  delete_user_avatar,  delete_user_display_name,  delete_user_bio,  create_banned_word,  delete_banned_word,  create_banned_image,  delete_banned_image,  create_ip_ban,  delete_ip_ban,  resolve_report,  dismiss_report,  publish_agreement,  other,  };

  @BuiltValueField(wireName: r'targetType')
  ModerationTargetType get targetType;
  // enum targetTypeEnum {  user,  post,  media,  report,  ip,  word,  image,  agreement,  other,  };

  /// ID of the target (format depends on target type)
  @BuiltValueField(wireName: r'targetId')
  String get targetId;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// Username of admin who performed the action
  @BuiltValueField(wireName: r'adminUsername')
  String? get adminUsername;

  /// Display name of admin who performed the action
  @BuiltValueField(wireName: r'adminDisplayName')
  String? get adminDisplayName;

  /// Additional details about the action (JSON object)
  @BuiltValueField(wireName: r'details')
  JsonObject? get details;

  ModerationLog._();

  factory ModerationLog([void updates(ModerationLogBuilder b)]) =
      _$ModerationLog;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ModerationLogBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ModerationLog> get serializer =>
      _$ModerationLogSerializer();
}

class _$ModerationLogSerializer implements PrimitiveSerializer<ModerationLog> {
  @override
  final Iterable<Type> types = const [ModerationLog, _$ModerationLog];

  @override
  final String wireName = r'ModerationLog';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ModerationLog object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'adminUserId';
    yield object.adminUserId == null
        ? null
        : serializers.serialize(
            object.adminUserId,
            specifiedType: const FullType.nullable(String),
          );
    yield r'action';
    yield serializers.serialize(
      object.action,
      specifiedType: const FullType(ModerationAction),
    );
    yield r'targetType';
    yield serializers.serialize(
      object.targetType,
      specifiedType: const FullType(ModerationTargetType),
    );
    yield r'targetId';
    yield serializers.serialize(
      object.targetId,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.adminUsername != null) {
      yield r'adminUsername';
      yield serializers.serialize(
        object.adminUsername,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.adminDisplayName != null) {
      yield r'adminDisplayName';
      yield serializers.serialize(
        object.adminDisplayName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.details != null) {
      yield r'details';
      yield serializers.serialize(
        object.details,
        specifiedType: const FullType.nullable(JsonObject),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ModerationLog object, {
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
    required ModerationLogBuilder result,
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
        case r'adminUserId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.adminUserId = valueDes;
          break;
        case r'action':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ModerationAction),
          ) as ModerationAction;
          result.action = valueDes;
          break;
        case r'targetType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ModerationTargetType),
          ) as ModerationTargetType;
          result.targetType = valueDes;
          break;
        case r'targetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.targetId = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'adminUsername':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.adminUsername = valueDes;
          break;
        case r'adminDisplayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.adminDisplayName = valueDes;
          break;
        case r'details':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(JsonObject),
          ) as JsonObject?;
          if (valueDes == null) continue;
          result.details = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ModerationLog deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ModerationLogBuilder();
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
