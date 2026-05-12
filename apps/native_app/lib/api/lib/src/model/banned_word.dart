//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/banned_word_applies_to.dart';
import 'package:ciel_api/src/model/banned_word_severity.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'banned_word.g.dart';

/// BannedWord
///
/// Properties:
/// * [id] - Banned word ID
/// * [pattern] - Regex or literal pattern to match
/// * [appliesTo]
/// * [severity]
/// * [createdBy] - Admin user ID who created this rule
/// * [createdAt]
@BuiltValue()
abstract class BannedWord implements Built<BannedWord, BannedWordBuilder> {
  /// Banned word ID
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Regex or literal pattern to match
  @BuiltValueField(wireName: r'pattern')
  String get pattern;

  @BuiltValueField(wireName: r'appliesTo')
  BannedWordAppliesTo get appliesTo;
  // enum appliesToEnum {  posts,  profiles,  all,  };

  @BuiltValueField(wireName: r'severity')
  BannedWordSeverity get severity;
  // enum severityEnum {  flag,  auto_delete,  };

  /// Admin user ID who created this rule
  @BuiltValueField(wireName: r'createdBy')
  String get createdBy;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  BannedWord._();

  factory BannedWord([void updates(BannedWordBuilder b)]) = _$BannedWord;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BannedWordBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BannedWord> get serializer => _$BannedWordSerializer();
}

class _$BannedWordSerializer implements PrimitiveSerializer<BannedWord> {
  @override
  final Iterable<Type> types = const [BannedWord, _$BannedWord];

  @override
  final String wireName = r'BannedWord';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BannedWord object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'pattern';
    yield serializers.serialize(
      object.pattern,
      specifiedType: const FullType(String),
    );
    yield r'appliesTo';
    yield serializers.serialize(
      object.appliesTo,
      specifiedType: const FullType(BannedWordAppliesTo),
    );
    yield r'severity';
    yield serializers.serialize(
      object.severity,
      specifiedType: const FullType(BannedWordSeverity),
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
  }

  @override
  Object serialize(
    Serializers serializers,
    BannedWord object, {
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
    required BannedWordBuilder result,
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
        case r'pattern':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.pattern = valueDes;
          break;
        case r'appliesTo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BannedWordAppliesTo),
          ) as BannedWordAppliesTo;
          result.appliesTo = valueDes;
          break;
        case r'severity':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BannedWordSeverity),
          ) as BannedWordSeverity;
          result.severity = valueDes;
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BannedWord deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BannedWordBuilder();
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
