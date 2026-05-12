//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stepup_start_response.g.dart';

/// StepupStartResponse
///
/// Properties:
/// * [stepupSessionId]
/// * [salt] - Base64-encoded salt.
/// * [iterations] - PBKDF2 iteration count.
/// * [serverNonce] - Server-provided nonce to append to clientNonce.
/// * [expiresInSeconds]
@BuiltValue()
abstract class StepupStartResponse
    implements Built<StepupStartResponse, StepupStartResponseBuilder> {
  @BuiltValueField(wireName: r'stepupSessionId')
  String get stepupSessionId;

  /// Base64-encoded salt.
  @BuiltValueField(wireName: r'salt')
  String get salt;

  /// PBKDF2 iteration count.
  @BuiltValueField(wireName: r'iterations')
  int get iterations;

  /// Server-provided nonce to append to clientNonce.
  @BuiltValueField(wireName: r'serverNonce')
  String get serverNonce;

  @BuiltValueField(wireName: r'expiresInSeconds')
  int get expiresInSeconds;

  StepupStartResponse._();

  factory StepupStartResponse([void updates(StepupStartResponseBuilder b)]) =
      _$StepupStartResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StepupStartResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StepupStartResponse> get serializer =>
      _$StepupStartResponseSerializer();
}

class _$StepupStartResponseSerializer
    implements PrimitiveSerializer<StepupStartResponse> {
  @override
  final Iterable<Type> types = const [
    StepupStartResponse,
    _$StepupStartResponse
  ];

  @override
  final String wireName = r'StepupStartResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StepupStartResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'stepupSessionId';
    yield serializers.serialize(
      object.stepupSessionId,
      specifiedType: const FullType(String),
    );
    yield r'salt';
    yield serializers.serialize(
      object.salt,
      specifiedType: const FullType(String),
    );
    yield r'iterations';
    yield serializers.serialize(
      object.iterations,
      specifiedType: const FullType(int),
    );
    yield r'serverNonce';
    yield serializers.serialize(
      object.serverNonce,
      specifiedType: const FullType(String),
    );
    yield r'expiresInSeconds';
    yield serializers.serialize(
      object.expiresInSeconds,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    StepupStartResponse object, {
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
    required StepupStartResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'stepupSessionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.stepupSessionId = valueDes;
          break;
        case r'salt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.salt = valueDes;
          break;
        case r'iterations':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.iterations = valueDes;
          break;
        case r'serverNonce':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.serverNonce = valueDes;
          break;
        case r'expiresInSeconds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.expiresInSeconds = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  StepupStartResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StepupStartResponseBuilder();
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
