//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/reaction_counts.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reaction_updated_event.g.dart';

/// ReactionUpdatedEvent
///
/// Properties:
/// * [type]
/// * [reactionCounts]
@BuiltValue()
abstract class ReactionUpdatedEvent
    implements Built<ReactionUpdatedEvent, ReactionUpdatedEventBuilder> {
  @BuiltValueField(wireName: r'type')
  ReactionUpdatedEventTypeEnum get type;
  // enum typeEnum {  reaction_updated,  };

  @BuiltValueField(wireName: r'reactionCounts')
  ReactionCounts get reactionCounts;

  ReactionUpdatedEvent._();

  factory ReactionUpdatedEvent([void updates(ReactionUpdatedEventBuilder b)]) =
      _$ReactionUpdatedEvent;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReactionUpdatedEventBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReactionUpdatedEvent> get serializer =>
      _$ReactionUpdatedEventSerializer();
}

class _$ReactionUpdatedEventSerializer
    implements PrimitiveSerializer<ReactionUpdatedEvent> {
  @override
  final Iterable<Type> types = const [
    ReactionUpdatedEvent,
    _$ReactionUpdatedEvent
  ];

  @override
  final String wireName = r'ReactionUpdatedEvent';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReactionUpdatedEvent object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(ReactionUpdatedEventTypeEnum),
    );
    yield r'reactionCounts';
    yield serializers.serialize(
      object.reactionCounts,
      specifiedType: const FullType(ReactionCounts),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReactionUpdatedEvent object, {
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
    required ReactionUpdatedEventBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReactionUpdatedEventTypeEnum),
          ) as ReactionUpdatedEventTypeEnum;
          result.type = valueDes;
          break;
        case r'reactionCounts':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReactionCounts),
          ) as ReactionCounts;
          result.reactionCounts.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReactionUpdatedEvent deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReactionUpdatedEventBuilder();
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

class ReactionUpdatedEventTypeEnum extends EnumClass {
  @BuiltValueEnumConst(wireName: r'reaction_updated')
  static const ReactionUpdatedEventTypeEnum reactionUpdated =
      _$reactionUpdatedEventTypeEnum_reactionUpdated;

  static Serializer<ReactionUpdatedEventTypeEnum> get serializer =>
      _$reactionUpdatedEventTypeEnumSerializer;

  const ReactionUpdatedEventTypeEnum._(String name) : super(name);

  static BuiltSet<ReactionUpdatedEventTypeEnum> get values =>
      _$reactionUpdatedEventTypeEnumValues;
  static ReactionUpdatedEventTypeEnum valueOf(String name) =>
      _$reactionUpdatedEventTypeEnumValueOf(name);
}
