//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stepup_finish_response.g.dart';

/// StepupFinishResponse
///
/// Properties:
/// * [stepupToken]
/// * [tokenType]
/// * [expiresInSeconds]
@BuiltValue()
abstract class StepupFinishResponse
    implements Built<StepupFinishResponse, StepupFinishResponseBuilder> {
  @BuiltValueField(wireName: r'stepupToken')
  String get stepupToken;

  @BuiltValueField(wireName: r'tokenType')
  StepupFinishResponseTokenTypeEnum get tokenType;
  // enum tokenTypeEnum {  Stepup,  };

  @BuiltValueField(wireName: r'expiresInSeconds')
  int get expiresInSeconds;

  StepupFinishResponse._();

  factory StepupFinishResponse([void updates(StepupFinishResponseBuilder b)]) =
      _$StepupFinishResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StepupFinishResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StepupFinishResponse> get serializer =>
      _$StepupFinishResponseSerializer();
}

class _$StepupFinishResponseSerializer
    implements PrimitiveSerializer<StepupFinishResponse> {
  @override
  final Iterable<Type> types = const [
    StepupFinishResponse,
    _$StepupFinishResponse
  ];

  @override
  final String wireName = r'StepupFinishResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StepupFinishResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'stepupToken';
    yield serializers.serialize(
      object.stepupToken,
      specifiedType: const FullType(String),
    );
    yield r'tokenType';
    yield serializers.serialize(
      object.tokenType,
      specifiedType: const FullType(StepupFinishResponseTokenTypeEnum),
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
    StepupFinishResponse object, {
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
    required StepupFinishResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'stepupToken':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.stepupToken = valueDes;
          break;
        case r'tokenType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(StepupFinishResponseTokenTypeEnum),
          ) as StepupFinishResponseTokenTypeEnum;
          result.tokenType = valueDes;
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
  StepupFinishResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StepupFinishResponseBuilder();
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

class StepupFinishResponseTokenTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'Stepup')
  static const StepupFinishResponseTokenTypeEnum stepup =
      _$stepupFinishResponseTokenTypeEnum_stepup;

  static Serializer<StepupFinishResponseTokenTypeEnum> get serializer =>
      _$stepupFinishResponseTokenTypeEnumSerializer;

  const StepupFinishResponseTokenTypeEnum._(String name) : super(name);

  static BuiltSet<StepupFinishResponseTokenTypeEnum> get values =>
      _$stepupFinishResponseTokenTypeEnumValues;
  static StepupFinishResponseTokenTypeEnum valueOf(String name) =>
      _$stepupFinishResponseTokenTypeEnumValueOf(name);
}
