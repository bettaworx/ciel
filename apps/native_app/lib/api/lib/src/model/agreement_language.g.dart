// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreement_language.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AgreementLanguage _$en = const AgreementLanguage._('en');
const AgreementLanguage _$ja = const AgreementLanguage._('ja');

AgreementLanguage _$valueOf(String name) {
  switch (name) {
    case 'en':
      return _$en;
    case 'ja':
      return _$ja;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AgreementLanguage> _$values =
    BuiltSet<AgreementLanguage>(const <AgreementLanguage>[
  _$en,
  _$ja,
]);

class _$AgreementLanguageMeta {
  const _$AgreementLanguageMeta();
  AgreementLanguage get en => _$en;
  AgreementLanguage get ja => _$ja;
  AgreementLanguage valueOf(String name) => _$valueOf(name);
  BuiltSet<AgreementLanguage> get values => _$values;
}

abstract class _$AgreementLanguageMixin {
  // ignore: non_constant_identifier_names
  _$AgreementLanguageMeta get AgreementLanguage =>
      const _$AgreementLanguageMeta();
}

Serializer<AgreementLanguage> _$agreementLanguageSerializer =
    _$AgreementLanguageSerializer();

class _$AgreementLanguageSerializer
    implements PrimitiveSerializer<AgreementLanguage> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'en': 'en',
    'ja': 'ja',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'en': 'en',
    'ja': 'ja',
  };

  @override
  final Iterable<Type> types = const <Type>[AgreementLanguage];
  @override
  final String wireName = 'AgreementLanguage';

  @override
  Object serialize(Serializers serializers, AgreementLanguage object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  AgreementLanguage deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      AgreementLanguage.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
