//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/banned_word_applies_to.dart';
import 'package:ciel_api/src/model/banned_word_severity.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_banned_word_request.g.dart';

/// CreateBannedWordRequest
///
/// Properties:
/// * [pattern] - Regex or literal pattern to match
/// * [appliesTo]
/// * [severity]
@BuiltValue()
abstract class CreateBannedWordRequest
    implements Built<CreateBannedWordRequest, CreateBannedWordRequestBuilder> {
  /// Regex or literal pattern to match
  @BuiltValueField(wireName: r'pattern')
  String get pattern;

  @BuiltValueField(wireName: r'appliesTo')
  BannedWordAppliesTo get appliesTo;
  // enum appliesToEnum {  posts,  profiles,  all,  };

  @BuiltValueField(wireName: r'severity')
  BannedWordSeverity get severity;
  // enum severityEnum {  flag,  auto_delete,  };

  CreateBannedWordRequest._();

  factory CreateBannedWordRequest(
          [void updates(CreateBannedWordRequestBuilder b)]) =
      _$CreateBannedWordRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateBannedWordRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateBannedWordRequest> get serializer =>
      _$CreateBannedWordRequestSerializer();
}

class _$CreateBannedWordRequestSerializer
    implements PrimitiveSerializer<CreateBannedWordRequest> {
  @override
  final Iterable<Type> types = const [
    CreateBannedWordRequest,
    _$CreateBannedWordRequest
  ];

  @override
  final String wireName = r'CreateBannedWordRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateBannedWordRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateBannedWordRequest object, {
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
    required CreateBannedWordRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateBannedWordRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateBannedWordRequestBuilder();
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
