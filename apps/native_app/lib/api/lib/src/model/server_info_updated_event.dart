//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/server_info.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_info_updated_event.g.dart';

/// ServerInfoUpdatedEvent
///
/// Properties:
/// * [type]
/// * [serverInfo]
@BuiltValue()
abstract class ServerInfoUpdatedEvent
    implements Built<ServerInfoUpdatedEvent, ServerInfoUpdatedEventBuilder> {
  @BuiltValueField(wireName: r'type')
  ServerInfoUpdatedEventTypeEnum get type;
  // enum typeEnum {  server_info_updated,  };

  @BuiltValueField(wireName: r'serverInfo')
  ServerInfo get serverInfo;

  ServerInfoUpdatedEvent._();

  factory ServerInfoUpdatedEvent(
          [void updates(ServerInfoUpdatedEventBuilder b)]) =
      _$ServerInfoUpdatedEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerInfoUpdatedEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerInfoUpdatedEvent> get serializer =>
      _$ServerInfoUpdatedEventSerializer();
}

class _$ServerInfoUpdatedEventSerializer
    implements PrimitiveSerializer<ServerInfoUpdatedEvent> {
  @override
  final Iterable<Type> types = const [
    ServerInfoUpdatedEvent,
    _$ServerInfoUpdatedEvent
  ];

  @override
  final String wireName = r'ServerInfoUpdatedEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerInfoUpdatedEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(ServerInfoUpdatedEventTypeEnum),
    );
    yield r'serverInfo';
    yield serializers.serialize(
      object.serverInfo,
      specifiedType: const FullType(ServerInfo),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerInfoUpdatedEvent object, {
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
    required ServerInfoUpdatedEventBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ServerInfoUpdatedEventTypeEnum),
          ) as ServerInfoUpdatedEventTypeEnum;
          result.type = valueDes;
          break;
        case r'serverInfo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ServerInfo),
          ) as ServerInfo;
          result.serverInfo.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerInfoUpdatedEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerInfoUpdatedEventBuilder();
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

class ServerInfoUpdatedEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'server_info_updated')
  static const ServerInfoUpdatedEventTypeEnum serverInfoUpdated =
      _$serverInfoUpdatedEventTypeEnum_serverInfoUpdated;

  static Serializer<ServerInfoUpdatedEventTypeEnum> get serializer =>
      _$serverInfoUpdatedEventTypeEnumSerializer;

  const ServerInfoUpdatedEventTypeEnum._(String name) : super(name);

  static BuiltSet<ServerInfoUpdatedEventTypeEnum> get values =>
      _$serverInfoUpdatedEventTypeEnumValues;
  static ServerInfoUpdatedEventTypeEnum valueOf(String name) =>
      _$serverInfoUpdatedEventTypeEnumValueOf(name);
}
