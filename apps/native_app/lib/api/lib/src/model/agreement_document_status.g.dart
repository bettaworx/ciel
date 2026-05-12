// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreement_document_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AgreementDocumentStatus _$draft =
    const AgreementDocumentStatus._('draft');
const AgreementDocumentStatus _$published =
    const AgreementDocumentStatus._('published');

AgreementDocumentStatus _$valueOf(String name) {
  switch (name) {
    case 'draft':
      return _$draft;
    case 'published':
      return _$published;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AgreementDocumentStatus> _$values =
    BuiltSet<AgreementDocumentStatus>(const <AgreementDocumentStatus>[
  _$draft,
  _$published,
]);

class _$AgreementDocumentStatusMeta {
  const _$AgreementDocumentStatusMeta();
  AgreementDocumentStatus get draft => _$draft;
  AgreementDocumentStatus get published => _$published;
  AgreementDocumentStatus valueOf(String name) => _$valueOf(name);
  BuiltSet<AgreementDocumentStatus> get values => _$values;
}

abstract class _$AgreementDocumentStatusMixin {
  // ignore: non_constant_identifier_names
  _$AgreementDocumentStatusMeta get AgreementDocumentStatus =>
      const _$AgreementDocumentStatusMeta();
}

Serializer<AgreementDocumentStatus> _$agreementDocumentStatusSerializer =
    _$AgreementDocumentStatusSerializer();

class _$AgreementDocumentStatusSerializer
    implements PrimitiveSerializer<AgreementDocumentStatus> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'draft': 'draft',
    'published': 'published',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'draft': 'draft',
    'published': 'published',
  };

  @override
  final Iterable<Type> types = const <Type>[AgreementDocumentStatus];
  @override
  final String wireName = 'AgreementDocumentStatus';

  @override
  Object serialize(Serializers serializers, AgreementDocumentStatus object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  AgreementDocumentStatus deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      AgreementDocumentStatus.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
