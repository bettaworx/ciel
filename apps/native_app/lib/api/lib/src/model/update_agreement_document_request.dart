//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_agreement_document_request.g.dart';

/// UpdateAgreementDocumentRequest
///
/// Properties:
/// * [title] - Updated document title
/// * [content] - Updated document content (markdown format)
@BuiltValue()
abstract class UpdateAgreementDocumentRequest
    implements
        Built<UpdateAgreementDocumentRequest,
            UpdateAgreementDocumentRequestBuilder> {
  /// Updated document title
  @BuiltValueField(wireName: r'title')
  String? get title;

  /// Updated document content (markdown format)
  @BuiltValueField(wireName: r'content')
  String? get content;

  UpdateAgreementDocumentRequest._();

  factory UpdateAgreementDocumentRequest(
          [void updates(UpdateAgreementDocumentRequestBuilder b)]) =
      _$UpdateAgreementDocumentRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateAgreementDocumentRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateAgreementDocumentRequest> get serializer =>
      _$UpdateAgreementDocumentRequestSerializer();
}

class _$UpdateAgreementDocumentRequestSerializer
    implements PrimitiveSerializer<UpdateAgreementDocumentRequest> {
  @override
  final Iterable<Type> types = const [
    UpdateAgreementDocumentRequest,
    _$UpdateAgreementDocumentRequest
  ];

  @override
  final String wireName = r'UpdateAgreementDocumentRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateAgreementDocumentRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.content != null) {
      yield r'content';
      yield serializers.serialize(
        object.content,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateAgreementDocumentRequest object, {
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
    required UpdateAgreementDocumentRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.title = valueDes;
          break;
        case r'content':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.content = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateAgreementDocumentRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateAgreementDocumentRequestBuilder();
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
