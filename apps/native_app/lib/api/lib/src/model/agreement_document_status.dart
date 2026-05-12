//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'agreement_document_status.g.dart';

class AgreementDocumentStatus extends EnumClass {
  /// Publication status of agreement document
  @BuiltValueEnumConst(wireName: r'draft')
  static const AgreementDocumentStatus draft = _$draft;

  /// Publication status of agreement document
  @BuiltValueEnumConst(wireName: r'published')
  static const AgreementDocumentStatus published = _$published;

  static Serializer<AgreementDocumentStatus> get serializer =>
      _$agreementDocumentStatusSerializer;

  const AgreementDocumentStatus._(String name) : super(name);

  static BuiltSet<AgreementDocumentStatus> get values => _$values;
  static AgreementDocumentStatus valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class AgreementDocumentStatusMixin = Object
    with _$AgreementDocumentStatusMixin;
