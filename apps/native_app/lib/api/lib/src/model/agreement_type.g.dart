// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreement_type.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AgreementType _$terms = const AgreementType._('terms');
const AgreementType _$privacy = const AgreementType._('privacy');

AgreementType _$valueOf(String name) {
  switch (name) {
    case 'terms':
      return _$terms;
    case 'privacy':
      return _$privacy;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AgreementType> _$values =
    BuiltSet<AgreementType>(const <AgreementType>[
  _$terms,
  _$privacy,
]);

class _$AgreementTypeMeta {
  const _$AgreementTypeMeta();
  AgreementType get terms => _$terms;
  AgreementType get privacy => _$privacy;
  AgreementType valueOf(String name) => _$valueOf(name);
  BuiltSet<AgreementType> get values => _$values;
}

abstract class _$AgreementTypeMixin {
  // ignore: non_constant_identifier_names
  _$AgreementTypeMeta get AgreementType => const _$AgreementTypeMeta();
}

Serializer<AgreementType> _$agreementTypeSerializer =
    _$AgreementTypeSerializer();

class _$AgreementTypeSerializer implements PrimitiveSerializer<AgreementType> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'terms': 'terms',
    'privacy': 'privacy',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'terms': 'terms',
    'privacy': 'privacy',
  };

  @override
  final Iterable<Type> types = const <Type>[AgreementType];
  @override
  final String wireName = 'AgreementType';

  @override
  Object serialize(Serializers serializers, AgreementType object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  AgreementType deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      AgreementType.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
