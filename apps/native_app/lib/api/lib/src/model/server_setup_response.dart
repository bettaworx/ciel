//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_setup_response.g.dart';

/// ServerSetupResponse
///
/// Properties:
/// * [success]
@BuiltValue()
abstract class ServerSetupResponse
    implements Built<ServerSetupResponse, ServerSetupResponseBuilder> {
  @BuiltValueField(wireName: r'success')
  bool get success;

  ServerSetupResponse._();

  factory ServerSetupResponse([void updates(ServerSetupResponseBuilder b)]) =
      _$ServerSetupResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerSetupResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerSetupResponse> get serializer =>
      _$ServerSetupResponseSerializer();
}

class _$ServerSetupResponseSerializer
    implements PrimitiveSerializer<ServerSetupResponse> {
  @override
  final Iterable<Type> types = const [
    ServerSetupResponse,
    _$ServerSetupResponse
  ];

  @override
  final String wireName = r'ServerSetupResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerSetupResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'success';
    yield serializers.serialize(
      object.success,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerSetupResponse object, {
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
    required ServerSetupResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'success':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.success = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerSetupResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerSetupResponseBuilder();
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
