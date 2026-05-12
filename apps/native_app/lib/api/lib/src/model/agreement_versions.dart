//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'agreement_versions.g.dart';

/// AgreementVersions
///
/// Properties:
/// * [termsVersion] - Current version of Terms of Service
/// * [privacyVersion] - Current version of Privacy Policy
@BuiltValue()
abstract class AgreementVersions
    implements Built<AgreementVersions, AgreementVersionsBuilder> {
  /// Current version of Terms of Service
  @BuiltValueField(wireName: r'termsVersion')
  int get termsVersion;

  /// Current version of Privacy Policy
  @BuiltValueField(wireName: r'privacyVersion')
  int get privacyVersion;

  AgreementVersions._();

  factory AgreementVersions([void updates(AgreementVersionsBuilder b)]) =
      _$AgreementVersions;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AgreementVersionsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AgreementVersions> get serializer =>
      _$AgreementVersionsSerializer();
}

class _$AgreementVersionsSerializer
    implements PrimitiveSerializer<AgreementVersions> {
  @override
  final Iterable<Type> types = const [AgreementVersions, _$AgreementVersions];

  @override
  final String wireName = r'AgreementVersions';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AgreementVersions object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'termsVersion';
    yield serializers.serialize(
      object.termsVersion,
      specifiedType: const FullType(int),
    );
    yield r'privacyVersion';
    yield serializers.serialize(
      object.privacyVersion,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AgreementVersions object, {
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
    required AgreementVersionsBuilder result,
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
  AgreementVersions deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AgreementVersionsBuilder();
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
