//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_agreements_request.g.dart';

/// AcceptAgreementsRequest
///
/// Properties:
/// * [termsVersion] - Version of Terms of Service being accepted
/// * [privacyVersion] - Version of Privacy Policy being accepted
@BuiltValue()
abstract class AcceptAgreementsRequest
    implements Built<AcceptAgreementsRequest, AcceptAgreementsRequestBuilder> {
  /// Version of Terms of Service being accepted
  @BuiltValueField(wireName: r'termsVersion')
  int? get termsVersion;

  /// Version of Privacy Policy being accepted
  @BuiltValueField(wireName: r'privacyVersion')
  int? get privacyVersion;

  AcceptAgreementsRequest._();

  factory AcceptAgreementsRequest(
          [void updates(AcceptAgreementsRequestBuilder b)]) =
      _$AcceptAgreementsRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptAgreementsRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptAgreementsRequest> get serializer =>
      _$AcceptAgreementsRequestSerializer();
}

class _$AcceptAgreementsRequestSerializer
    implements PrimitiveSerializer<AcceptAgreementsRequest> {
  @override
  final Iterable<Type> types = const [
    AcceptAgreementsRequest,
    _$AcceptAgreementsRequest
  ];

  @override
  final String wireName = r'AcceptAgreementsRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptAgreementsRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.termsVersion != null) {
      yield r'termsVersion';
      yield serializers.serialize(
        object.termsVersion,
        specifiedType: const FullType(int),
      );
    }
    if (object.privacyVersion != null) {
      yield r'privacyVersion';
      yield serializers.serialize(
        object.privacyVersion,
        specifiedType: const FullType(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AcceptAgreementsRequest object, {
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
    required AcceptAgreementsRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'termsVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.termsVersion = valueDes;
          break;
        case r'privacyVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.privacyVersion = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AcceptAgreementsRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptAgreementsRequestBuilder();
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
