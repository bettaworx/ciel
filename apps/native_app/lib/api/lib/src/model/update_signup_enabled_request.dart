//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_signup_enabled_request.g.dart';

/// UpdateSignupEnabledRequest
///
/// Properties:
/// * [signupEnabled]
@BuiltValue()
abstract class UpdateSignupEnabledRequest
    implements
        Built<UpdateSignupEnabledRequest, UpdateSignupEnabledRequestBuilder> {
  @BuiltValueField(wireName: r'signupEnabled')
  bool get signupEnabled;

  UpdateSignupEnabledRequest._();

  factory UpdateSignupEnabledRequest(
          [void updates(UpdateSignupEnabledRequestBuilder b)]) =
      _$UpdateSignupEnabledRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateSignupEnabledRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateSignupEnabledRequest> get serializer =>
      _$UpdateSignupEnabledRequestSerializer();
}

class _$UpdateSignupEnabledRequestSerializer
    implements PrimitiveSerializer<UpdateSignupEnabledRequest> {
  @override
  final Iterable<Type> types = const [
    UpdateSignupEnabledRequest,
    _$UpdateSignupEnabledRequest
  ];

  @override
  final String wireName = r'UpdateSignupEnabledRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateSignupEnabledRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'signupEnabled';
    yield serializers.serialize(
      object.signupEnabled,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateSignupEnabledRequest object, {
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
    required UpdateSignupEnabledRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'signupEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.signupEnabled = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateSignupEnabledRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateSignupEnabledRequestBuilder();
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
