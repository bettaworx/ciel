//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/agreement_type.dart';
import 'package:ciel_api/src/model/agreement_language.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'public_agreement_content.g.dart';

/// PublicAgreementContent
///
/// Properties:
/// * [type]
/// * [language]
/// * [version] - Version number
/// * [title] - Document title
/// * [content] - Document content (markdown format)
/// * [publishedAt] - When the document was published
@BuiltValue()
abstract class PublicAgreementContent
    implements Built<PublicAgreementContent, PublicAgreementContentBuilder> {
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

  /// When the document was published
  @BuiltValueField(wireName: r'publishedAt')
  DateTime get publishedAt;

  PublicAgreementContent._();

  factory PublicAgreementContent(
          [void updates(PublicAgreementContentBuilder b)]) =
      _$PublicAgreementContent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(PublicAgreementContentBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<PublicAgreementContent> get serializer =>
      _$PublicAgreementContentSerializer();
}

class _$PublicAgreementContentSerializer
    implements PrimitiveSerializer<PublicAgreementContent> {
  @override
  final Iterable<Type> types = const [
    PublicAgreementContent,
    _$PublicAgreementContent
  ];

  @override
  final String wireName = r'PublicAgreementContent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    PublicAgreementContent object, {
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
    yield r'publishedAt';
    yield serializers.serialize(
      object.publishedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    PublicAgreementContent object, {
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
    required PublicAgreementContentBuilder result,
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
        case r'publishedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
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
  PublicAgreementContent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = PublicAgreementContentBuilder();
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
