//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/agreement_type.dart';
import 'package:ciel_api/src/model/agreement_document_status.dart';
import 'package:ciel_api/src/model/agreement_language.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'agreement_document.g.dart';

/// AgreementDocument
///
/// Properties:
/// * [id] - Agreement document ID
/// * [type]
/// * [language]
/// * [version] - Version number
/// * [status]
/// * [title] - Document title
/// * [content] - Document content (markdown format)
/// * [createdBy] - Admin user ID who created this document
/// * [createdAt]
/// * [updatedAt]
/// * [publishedBy] - Admin user ID who published this document
/// * [publishedAt] - When the document was published
@BuiltValue()
abstract class AgreementDocument
    implements Built<AgreementDocument, AgreementDocumentBuilder> {
  /// Agreement document ID
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'type')
  AgreementType get type;
  // enum typeEnum {  terms,  privacy,  };

  @BuiltValueField(wireName: r'language')
  AgreementLanguage get language;
  // enum languageEnum {  en,  ja,  };

  /// Version number
  @BuiltValueField(wireName: r'version')
  int get version;

  @BuiltValueField(wireName: r'status')
  AgreementDocumentStatus get status;
  // enum statusEnum {  draft,  published,  };

  /// Document title
  @BuiltValueField(wireName: r'title')
  String get title;

  /// Document content (markdown format)
  @BuiltValueField(wireName: r'content')
  String get content;

  /// Admin user ID who created this document
  @BuiltValueField(wireName: r'createdBy')
  String get createdBy;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  /// Admin user ID who published this document
  @BuiltValueField(wireName: r'publishedBy')
  String? get publishedBy;

  /// When the document was published
  @BuiltValueField(wireName: r'publishedAt')
  DateTime? get publishedAt;

  AgreementDocument._();

  factory AgreementDocument([void updates(AgreementDocumentBuilder b)]) =
      _$AgreementDocument;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AgreementDocumentBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AgreementDocument> get serializer =>
      _$AgreementDocumentSerializer();
}

class _$AgreementDocumentSerializer
    implements PrimitiveSerializer<AgreementDocument> {
  @override
  final Iterable<Type> types = const [AgreementDocument, _$AgreementDocument];

  @override
  final String wireName = r'AgreementDocument';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AgreementDocument object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
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
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(AgreementDocumentStatus),
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
    yield r'createdBy';
    yield serializers.serialize(
      object.createdBy,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.publishedBy != null) {
      yield r'publishedBy';
      yield serializers.serialize(
        object.publishedBy,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.publishedAt != null) {
      yield r'publishedAt';
      yield serializers.serialize(
        object.publishedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AgreementDocument object, {
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
    required AgreementDocumentBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
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
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AgreementDocumentStatus),
          ) as AgreementDocumentStatus;
          result.status = valueDes;
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
        case r'createdBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdBy = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        case r'publishedBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.publishedBy = valueDes;
          break;
        case r'publishedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.publishedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AgreementDocument deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AgreementDocumentBuilder();
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
