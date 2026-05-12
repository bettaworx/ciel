//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/server_config.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_config_updated_event.g.dart';

/// ServerConfigUpdatedEvent
///
/// Properties:
/// * [type]
/// * [serverConfig]
@BuiltValue()
abstract class ServerConfigUpdatedEvent
    implements
        Built<ServerConfigUpdatedEvent, ServerConfigUpdatedEventBuilder> {
  @BuiltValueField(wireName: r'type')
  ServerConfigUpdatedEventTypeEnum get type;
  // enum typeEnum {  server_config_updated,  };

  @BuiltValueField(wireName: r'serverConfig')
  ServerConfig get serverConfig;

  ServerConfigUpdatedEvent._();

  factory ServerConfigUpdatedEvent(
          [void updates(ServerConfigUpdatedEventBuilder b)]) =
      _$ServerConfigUpdatedEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerConfigUpdatedEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerConfigUpdatedEvent> get serializer =>
      _$ServerConfigUpdatedEventSerializer();
}

class _$ServerConfigUpdatedEventSerializer
    implements PrimitiveSerializer<ServerConfigUpdatedEvent> {
  @override
  final Iterable<Type> types = const [
    ServerConfigUpdatedEvent,
    _$ServerConfigUpdatedEvent
  ];

  @override
  final String wireName = r'ServerConfigUpdatedEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerConfigUpdatedEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(ServerConfigUpdatedEventTypeEnum),
    );
    yield r'serverConfig';
    yield serializers.serialize(
      object.serverConfig,
      specifiedType: const FullType(ServerConfig),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerConfigUpdatedEvent object, {
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
    required ServerConfigUpdatedEventBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ServerConfigUpdatedEventTypeEnum),
          ) as ServerConfigUpdatedEventTypeEnum;
          result.type = valueDes;
          break;
        case r'serverConfig':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ServerConfig),
          ) as ServerConfig;
          result.serverConfig.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerConfigUpdatedEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerConfigUpdatedEventBuilder();
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

class ServerConfigUpdatedEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'server_config_updated')
  static const ServerConfigUpdatedEventTypeEnum serverConfigUpdated =
      _$serverConfigUpdatedEventTypeEnum_serverConfigUpdated;

  static Serializer<ServerConfigUpdatedEventTypeEnum> get serializer =>
      _$serverConfigUpdatedEventTypeEnumSerializer;

  const ServerConfigUpdatedEventTypeEnum._(String name) : super(name);

  static BuiltSet<ServerConfigUpdatedEventTypeEnum> get values =>
      _$serverConfigUpdatedEventTypeEnumValues;
  static ServerConfigUpdatedEventTypeEnum valueOf(String name) =>
      _$serverConfigUpdatedEventTypeEnumValueOf(name);
}
