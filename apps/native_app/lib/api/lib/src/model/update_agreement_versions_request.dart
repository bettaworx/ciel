//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_agreement_versions_request.g.dart';

/// UpdateAgreementVersionsRequest
///
/// Properties:
/// * [termsVersion] - New version of Terms of Service (must be >= 1)
/// * [privacyVersion] - New version of Privacy Policy (must be >= 1)
@BuiltValue()
abstract class UpdateAgreementVersionsRequest
    implements
        Built<UpdateAgreementVersionsRequest,
            UpdateAgreementVersionsRequestBuilder> {
  /// New version of Terms of Service (must be >= 1)
  @BuiltValueField(wireName: r'termsVersion')
  int? get termsVersion;

  /// New version of Privacy Policy (must be >= 1)
  @BuiltValueField(wireName: r'privacyVersion')
  int? get privacyVersion;

  UpdateAgreementVersionsRequest._();

  factory UpdateAgreementVersionsRequest(
          [void updates(UpdateAgreementVersionsRequestBuilder b)]) =
      _$UpdateAgreementVersionsRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateAgreementVersionsRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateAgreementVersionsRequest> get serializer =>
      _$UpdateAgreementVersionsRequestSerializer();
}

class _$UpdateAgreementVersionsRequestSerializer
    implements PrimitiveSerializer<UpdateAgreementVersionsRequest> {
  @override
  final Iterable<Type> types = const [
    UpdateAgreementVersionsRequest,
    _$UpdateAgreementVersionsRequest
  ];

  @override
  final String wireName = r'UpdateAgreementVersionsRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateAgreementVersionsRequest object, {
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
    UpdateAgreementVersionsRequest object, {
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
    required UpdateAgreementVersionsRequestBuilder result,
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
  UpdateAgreementVersionsRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateAgreementVersionsRequestBuilder();
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
