//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'agreement_type.g.dart';

class AgreementType extends EnumClass {
  /// Type of agreement document
  @BuiltValueEnumConst(wireName: r'terms')
  static const AgreementType terms = _$terms;

  /// Type of agreement document
  @BuiltValueEnumConst(wireName: r'privacy')
  static const AgreementType privacy = _$privacy;

  static Serializer<AgreementType> get serializer => _$agreementTypeSerializer;

  const AgreementType._(String name) : super(name);

  static BuiltSet<AgreementType> get values => _$values;
  static AgreementType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class AgreementTypeMixin = Object with _$AgreementTypeMixin;
