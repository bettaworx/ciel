//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_agreements_documents_document_id_duplicate_post_request.g.dart';

/// AdminAgreementsDocumentsDocumentIdDuplicatePostRequest
///
/// Properties:
/// * [newVersion] - Version number for the new document
@BuiltValue()
abstract class AdminAgreementsDocumentsDocumentIdDuplicatePostRequest
    implements
        Built<AdminAgreementsDocumentsDocumentIdDuplicatePostRequest,
            AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder> {
  /// Version number for the new document
  @BuiltValueField(wireName: r'newVersion')
  int get newVersion;

  AdminAgreementsDocumentsDocumentIdDuplicatePostRequest._();

  factory AdminAgreementsDocumentsDocumentIdDuplicatePostRequest(
      [void updates(
          AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder
              b)]) = _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(
          AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder b) =>
      b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminAgreementsDocumentsDocumentIdDuplicatePostRequest>
      get serializer =>
          _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequestSerializer();
}

class _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequestSerializer
    implements
        PrimitiveSerializer<
            AdminAgreementsDocumentsDocumentIdDuplicatePostRequest> {
  @override
  final Iterable<Type> types = const [
    AdminAgreementsDocumentsDocumentIdDuplicatePostRequest,
    _$AdminAgreementsDocumentsDocumentIdDuplicatePostRequest
  ];

  @override
  final String wireName =
      r'AdminAgreementsDocumentsDocumentIdDuplicatePostRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminAgreementsDocumentsDocumentIdDuplicatePostRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'newVersion';
    yield serializers.serialize(
      object.newVersion,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminAgreementsDocumentsDocumentIdDuplicatePostRequest object, {
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
    required AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder
        result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'newVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.newVersion = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminAgreementsDocumentsDocumentIdDuplicatePostRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result =
        AdminAgreementsDocumentsDocumentIdDuplicatePostRequestBuilder();
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
