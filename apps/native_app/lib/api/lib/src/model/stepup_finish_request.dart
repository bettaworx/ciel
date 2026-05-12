//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stepup_finish_request.g.dart';

/// StepupFinishRequest
///
/// Properties:
/// * [stepupSessionId]
/// * [clientFinalNonce] - Typically clientNonce + serverNonce.
/// * [clientProof] - Base64-encoded proof computed by the client.
@BuiltValue()
abstract class StepupFinishRequest
    implements Built<StepupFinishRequest, StepupFinishRequestBuilder> {
  @BuiltValueField(wireName: r'stepupSessionId')
  String get stepupSessionId;

  /// Typically clientNonce + serverNonce.
  @BuiltValueField(wireName: r'clientFinalNonce')
  String get clientFinalNonce;

  /// Base64-encoded proof computed by the client.
  @BuiltValueField(wireName: r'clientProof')
  String get clientProof;

  StepupFinishRequest._();

  factory StepupFinishRequest([void updates(StepupFinishRequestBuilder b)]) =
      _$StepupFinishRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StepupFinishRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StepupFinishRequest> get serializer =>
      _$StepupFinishRequestSerializer();
}

class _$StepupFinishRequestSerializer
    implements PrimitiveSerializer<StepupFinishRequest> {
  @override
  final Iterable<Type> types = const [
    StepupFinishRequest,
    _$StepupFinishRequest
  ];

  @override
  final String wireName = r'StepupFinishRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StepupFinishRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'stepupSessionId';
    yield serializers.serialize(
      object.stepupSessionId,
      specifiedType: const FullType(String),
    );
    yield r'clientFinalNonce';
    yield serializers.serialize(
      object.clientFinalNonce,
      specifiedType: const FullType(String),
    );
    yield r'clientProof';
    yield serializers.serialize(
      object.clientProof,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    StepupFinishRequest object, {
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
    required StepupFinishRequestBuilder result,
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
        case r'clientFinalNonce':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientFinalNonce = valueDes;
          break;
        case r'clientProof':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientProof = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  StepupFinishRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StepupFinishRequestBuilder();
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
