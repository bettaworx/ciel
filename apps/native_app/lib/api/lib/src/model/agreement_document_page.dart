//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/agreement_document.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'agreement_document_page.g.dart';

/// AgreementDocumentPage
///
/// Properties:
/// * [items]
/// * [total] - Total number of documents matching the filters
@BuiltValue()
abstract class AgreementDocumentPage
    implements Built<AgreementDocumentPage, AgreementDocumentPageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AgreementDocument> get items;

  /// Total number of documents matching the filters
  @BuiltValueField(wireName: r'total')
  int get total;

  AgreementDocumentPage._();

  factory AgreementDocumentPage(
      [void updates(AgreementDocumentPageBuilder b)]) = _$AgreementDocumentPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AgreementDocumentPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AgreementDocumentPage> get serializer =>
      _$AgreementDocumentPageSerializer();
}

class _$AgreementDocumentPageSerializer
    implements PrimitiveSerializer<AgreementDocumentPage> {
  @override
  final Iterable<Type> types = const [
    AgreementDocumentPage,
    _$AgreementDocumentPage
  ];

  @override
  final String wireName = r'AgreementDocumentPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AgreementDocumentPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AgreementDocument)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AgreementDocumentPage object, {
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
    required AgreementDocumentPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(AgreementDocument)]),
          ) as BuiltList<AgreementDocument>;
          result.items.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AgreementDocumentPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AgreementDocumentPageBuilder();
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
