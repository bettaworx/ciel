//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/reaction_count.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reaction_counts.g.dart';

/// ReactionCounts
///
/// Properties:
/// * [postId]
/// * [reactions]
@BuiltValue()
abstract class ReactionCounts
    implements Built<ReactionCounts, ReactionCountsBuilder> {
  @BuiltValueField(wireName: r'postId')
  String get postId;

  @BuiltValueField(wireName: r'reactions')
  BuiltList<ReactionCount> get reactions;

  ReactionCounts._();

  factory ReactionCounts([void updates(ReactionCountsBuilder b)]) =
      _$ReactionCounts;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReactionCountsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReactionCounts> get serializer =>
      _$ReactionCountsSerializer();
}

class _$ReactionCountsSerializer
    implements PrimitiveSerializer<ReactionCounts> {
  @override
  final Iterable<Type> types = const [ReactionCounts, _$ReactionCounts];

  @override
  final String wireName = r'ReactionCounts';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReactionCounts object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'postId';
    yield serializers.serialize(
      object.postId,
      specifiedType: const FullType(String),
    );
    yield r'reactions';
    yield serializers.serialize(
      object.reactions,
      specifiedType: const FullType(BuiltList, [FullType(ReactionCount)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReactionCounts object, {
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
    required ReactionCountsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'postId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.postId = valueDes;
          break;
        case r'reactions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ReactionCount)]),
          ) as BuiltList<ReactionCount>;
          result.reactions.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReactionCounts deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReactionCountsBuilder();
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
