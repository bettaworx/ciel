//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_setup_request.g.dart';

/// ServerSetupRequest
///
/// Properties:
/// * [serverName]
/// * [serverDescription]
/// * [serverIconMediaId]
/// * [inviteOnly]
/// * [inviteCode]
@BuiltValue()
abstract class ServerSetupRequest
    implements Built<ServerSetupRequest, ServerSetupRequestBuilder> {
  @BuiltValueField(wireName: r'serverName')
  String? get serverName;

  @BuiltValueField(wireName: r'serverDescription')
  String? get serverDescription;

  @BuiltValueField(wireName: r'serverIconMediaId')
  String? get serverIconMediaId;

  @BuiltValueField(wireName: r'inviteOnly')
  bool? get inviteOnly;

  @BuiltValueField(wireName: r'inviteCode')
  String? get inviteCode;

  ServerSetupRequest._();

  factory ServerSetupRequest([void updates(ServerSetupRequestBuilder b)]) =
      _$ServerSetupRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerSetupRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerSetupRequest> get serializer =>
      _$ServerSetupRequestSerializer();
}

class _$ServerSetupRequestSerializer
    implements PrimitiveSerializer<ServerSetupRequest> {
  @override
  final Iterable<Type> types = const [ServerSetupRequest, _$ServerSetupRequest];

  @override
  final String wireName = r'ServerSetupRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerSetupRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.serverName != null) {
      yield r'serverName';
      yield serializers.serialize(
        object.serverName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.serverDescription != null) {
      yield r'serverDescription';
      yield serializers.serialize(
        object.serverDescription,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.serverIconMediaId != null) {
      yield r'serverIconMediaId';
      yield serializers.serialize(
        object.serverIconMediaId,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.inviteOnly != null) {
      yield r'inviteOnly';
      yield serializers.serialize(
        object.inviteOnly,
        specifiedType: const FullType(bool),
      );
    }
    if (object.inviteCode != null) {
      yield r'inviteCode';
      yield serializers.serialize(
        object.inviteCode,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerSetupRequest object, {
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
    required ServerSetupRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'serverName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.serverName = valueDes;
          break;
        case r'serverDescription':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.serverDescription = valueDes;
          break;
        case r'serverIconMediaId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.serverIconMediaId = valueDes;
          break;
        case r'inviteOnly':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.inviteOnly = valueDes;
          break;
        case r'inviteCode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.inviteCode = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerSetupRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerSetupRequestBuilder();
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
