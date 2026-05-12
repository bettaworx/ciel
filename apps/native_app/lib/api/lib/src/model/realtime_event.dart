//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/server_info_updated_event.dart';
import 'package:ciel_api/src/model/reaction_updated_event.dart';
import 'package:ciel_api/src/model/reaction_counts.dart';
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/server_config_updated_event.dart';
import 'package:ciel_api/src/model/post_created_event.dart';
import 'package:ciel_api/src/model/server_config.dart';
import 'package:ciel_api/src/model/post_deleted_event.dart';
import 'package:ciel_api/src/model/user_registered_event.dart';
import 'package:ciel_api/src/model/post.dart';
import 'package:ciel_api/src/model/server_info.dart';
import 'package:ciel_api/src/model/user_deleted_event.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';
import 'package:one_of/one_of.dart';

part 'realtime_event.g.dart';

/// RealtimeEvent
///
/// Properties:
/// * [type]
/// * [post]
/// * [postId]
/// * [reactionCounts]
/// * [serverInfo]
/// * [serverConfig]
@BuiltValue()
abstract class RealtimeEvent
    implements Built<RealtimeEvent, RealtimeEventBuilder> {
  /// One Of [PostCreatedEvent], [PostDeletedEvent], [ReactionUpdatedEvent], [ServerConfigUpdatedEvent], [ServerInfoUpdatedEvent], [UserDeletedEvent], [UserRegisteredEvent]
  OneOf get oneOf;

  static const String discriminatorFieldName = r'type';

  static const Map<String, Type> discriminatorMapping = {
    r'post_created': PostCreatedEvent,
    r'post_deleted': PostDeletedEvent,
    r'reaction_updated': ReactionUpdatedEvent,
    r'server_config_updated': ServerConfigUpdatedEvent,
    r'server_info_updated': ServerInfoUpdatedEvent,
    r'user_deleted': UserDeletedEvent,
    r'user_registered': UserRegisteredEvent,
  };

  RealtimeEvent._();

  factory RealtimeEvent([void updates(RealtimeEventBuilder b)]) =
      _$RealtimeEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RealtimeEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RealtimeEvent> get serializer =>
      _$RealtimeEventSerializer();
}

extension RealtimeEventDiscriminatorExt on RealtimeEvent {
  String? get discriminatorValue {
    if (this is PostCreatedEvent) {
      return r'post_created';
    }
    if (this is PostDeletedEvent) {
      return r'post_deleted';
    }
    if (this is ReactionUpdatedEvent) {
      return r'reaction_updated';
    }
    if (this is ServerConfigUpdatedEvent) {
      return r'server_config_updated';
    }
    if (this is ServerInfoUpdatedEvent) {
      return r'server_info_updated';
    }
    if (this is UserDeletedEvent) {
      return r'user_deleted';
    }
    if (this is UserRegisteredEvent) {
      return r'user_registered';
    }
    return null;
  }
}

extension RealtimeEventBuilderDiscriminatorExt on RealtimeEventBuilder {
  String? get discriminatorValue {
    if (this is PostCreatedEventBuilder) {
      return r'post_created';
    }
    if (this is PostDeletedEventBuilder) {
      return r'post_deleted';
    }
    if (this is ReactionUpdatedEventBuilder) {
      return r'reaction_updated';
    }
    if (this is ServerConfigUpdatedEventBuilder) {
      return r'server_config_updated';
    }
    if (this is ServerInfoUpdatedEventBuilder) {
      return r'server_info_updated';
    }
    if (this is UserDeletedEventBuilder) {
      return r'user_deleted';
    }
    if (this is UserRegisteredEventBuilder) {
      return r'user_registered';
    }
    return null;
  }
}

class _$RealtimeEventSerializer implements PrimitiveSerializer<RealtimeEvent> {
  @override
  final Iterable<Type> types = const [RealtimeEvent, _$RealtimeEvent];

  @override
  final String wireName = r'RealtimeEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RealtimeEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {}

  @override
  Object serialize(
    Serializers serializers,
    RealtimeEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final oneOf = object.oneOf;
    return serializers.serialize(oneOf.value,
        specifiedType: FullType(oneOf.valueType))!;
  }

  @override
  RealtimeEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RealtimeEventBuilder();
    Object? oneOfDataSrc;
    final serializedList = (serialized as Iterable<Object?>).toList();
    final discIndex =
        serializedList.indexOf(RealtimeEvent.discriminatorFieldName) + 1;
    final discValue = serializers.deserialize(serializedList[discIndex],
        specifiedType: FullType(String)) as String;
    oneOfDataSrc = serialized;
    final oneOfTypes = [
      PostCreatedEvent,
      PostDeletedEvent,
      ReactionUpdatedEvent,
      ServerConfigUpdatedEvent,
      ServerInfoUpdatedEvent,
      UserDeletedEvent,
      UserRegisteredEvent,
    ];
    Object oneOfResult;
    Type oneOfType;
    switch (discValue) {
      case r'post_created':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(PostCreatedEvent),
        ) as PostCreatedEvent;
        oneOfType = PostCreatedEvent;
        break;
      case r'post_deleted':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(PostDeletedEvent),
        ) as PostDeletedEvent;
        oneOfType = PostDeletedEvent;
        break;
      case r'reaction_updated':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(ReactionUpdatedEvent),
        ) as ReactionUpdatedEvent;
        oneOfType = ReactionUpdatedEvent;
        break;
      case r'server_config_updated':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(ServerConfigUpdatedEvent),
        ) as ServerConfigUpdatedEvent;
        oneOfType = ServerConfigUpdatedEvent;
        break;
      case r'server_info_updated':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(ServerInfoUpdatedEvent),
        ) as ServerInfoUpdatedEvent;
        oneOfType = ServerInfoUpdatedEvent;
        break;
      case r'user_deleted':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(UserDeletedEvent),
        ) as UserDeletedEvent;
        oneOfType = UserDeletedEvent;
        break;
      case r'user_registered':
        oneOfResult = serializers.deserialize(
          oneOfDataSrc,
          specifiedType: FullType(UserRegisteredEvent),
        ) as UserRegisteredEvent;
        oneOfType = UserRegisteredEvent;
        break;
      default:
        throw UnsupportedError(
            "Couldn't deserialize oneOf for the discriminator value: ${discValue}");
    }
    result.oneOf = OneOfDynamic(
        typeIndex: oneOfTypes.indexOf(oneOfType),
        types: oneOfTypes,
        value: oneOfResult);
    return result.build();
  }
}

class RealtimeEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'post_created')
  static const RealtimeEventTypeEnum postCreated =
      _$realtimeEventTypeEnum_postCreated;
  @BuiltValueEnumConst(wireName: r'post_deleted')
  static const RealtimeEventTypeEnum postDeleted =
      _$realtimeEventTypeEnum_postDeleted;
  @BuiltValueEnumConst(wireName: r'reaction_updated')
  static const RealtimeEventTypeEnum reactionUpdated =
      _$realtimeEventTypeEnum_reactionUpdated;
  @BuiltValueEnumConst(wireName: r'user_registered')
  static const RealtimeEventTypeEnum userRegistered =
      _$realtimeEventTypeEnum_userRegistered;
  @BuiltValueEnumConst(wireName: r'user_deleted')
  static const RealtimeEventTypeEnum userDeleted =
      _$realtimeEventTypeEnum_userDeleted;
  @BuiltValueEnumConst(wireName: r'server_info_updated')
  static const RealtimeEventTypeEnum serverInfoUpdated =
      _$realtimeEventTypeEnum_serverInfoUpdated;
  @BuiltValueEnumConst(wireName: r'server_config_updated')
  static const RealtimeEventTypeEnum serverConfigUpdated =
      _$realtimeEventTypeEnum_serverConfigUpdated;

  static Serializer<RealtimeEventTypeEnum> get serializer =>
      _$realtimeEventTypeEnumSerializer;

  const RealtimeEventTypeEnum._(String name) : super(name);

  static BuiltSet<RealtimeEventTypeEnum> get values =>
      _$realtimeEventTypeEnumValues;
  static RealtimeEventTypeEnum valueOf(String name) =>
      _$realtimeEventTypeEnumValueOf(name);
}
