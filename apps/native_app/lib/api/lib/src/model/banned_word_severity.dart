//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'banned_word_severity.g.dart';

class BannedWordSeverity extends EnumClass {
  /// Action to take when banned word is detected
  @BuiltValueEnumConst(wireName: r'flag')
  static const BannedWordSeverity flag = _$flag;

  /// Action to take when banned word is detected
  @BuiltValueEnumConst(wireName: r'auto_delete')
  static const BannedWordSeverity autoDelete = _$autoDelete;

  static Serializer<BannedWordSeverity> get serializer =>
      _$bannedWordSeveritySerializer;

  const BannedWordSeverity._(String name) : super(name);

  static BuiltSet<BannedWordSeverity> get values => _$values;
  static BannedWordSeverity valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class BannedWordSeverityMixin = Object with _$BannedWordSeverityMixin;
