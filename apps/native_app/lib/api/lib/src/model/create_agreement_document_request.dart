//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/agreement_type.dart';
import 'package:ciel_api/src/model/agreement_language.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_agreement_document_request.g.dart';

/// CreateAgreementDocumentRequest
///
/// Properties:
/// * [type]
/// * [language]
/// * [version] - Version number
/// * [title] - Document title
/// * [content] - Document content (markdown format)
@BuiltValue()
abstract class CreateAgreementDocumentRequest
    implements
        Built<CreateAgreementDocumentRequest,
            CreateAgreementDocumentRequestBuilder> {
  @BuiltValueField(wireName: r'type')
  AgreementType get type;
  // enum typeEnum {  terms,  privacy,  };

  @BuiltValueField(wireName: r'language')
  AgreementLanguage get language;
  // enum languageEnum {  en,  ja,  };

  /// Version number
  @BuiltValueField(wireName: r'version')
  int get version;

  /// Document title
  @BuiltValueField(wireName: r'title')
  String get title;

  /// Document content (markdown format)
  @BuiltValueField(wireName: r'content')
  String get content;

  CreateAgreementDocumentRequest._();

  factory CreateAgreementDocumentRequest(
          [void updates(CreateAgreementDocumentRequestBuilder b)]) =
      _$CreateAgreementDocumentRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateAgreementDocumentRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateAgreementDocumentRequest> get serializer =>
      _$CreateAgreementDocumentRequestSerializer();
}

class _$CreateAgreementDocumentRequestSerializer
    implements PrimitiveSerializer<CreateAgreementDocumentRequest> {
  @override
  final Iterable<Type> types = const [
    CreateAgreementDocumentRequest,
    _$CreateAgreementDocumentRequest
  ];

  @override
  final String wireName = r'CreateAgreementDocumentRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateAgreementDocumentRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(AgreementType),
    );
    yield r'language';
    yield serializers.serialize(
      object.language,
      specifiedType: const FullType(AgreementLanguage),
    );
    yield r'version';
    yield serializers.serialize(
      object.version,
      specifiedType: const FullType(int),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'content';
    yield serializers.serialize(
      object.content,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateAgreementDocumentRequest object, {
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
    required CreateAgreementDocumentRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AgreementType),
          ) as AgreementType;
          result.type = valueDes;
          break;
        case r'language':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AgreementLanguage),
          ) as AgreementLanguage;
          result.language = valueDes;
          break;
        case r'version':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.version = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'content':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
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
  CreateAgreementDocumentRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateAgreementDocumentRequestBuilder();
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
