//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reaction_count.g.dart';

/// ReactionCount
///
/// Properties:
/// * [emoji] - Unicode emoji string or custom emoji shortcode in :shortcode: format.
/// * [count]
/// * [reactedByCurrentUser] - Whether the authenticated user has reacted with this emoji (false for anonymous users)
@BuiltValue()
abstract class ReactionCount
    implements Built<ReactionCount, ReactionCountBuilder> {
  /// Unicode emoji string or custom emoji shortcode in :shortcode: format.
  @BuiltValueField(wireName: r'emoji')
  String get emoji;

  @BuiltValueField(wireName: r'count')
  int get count;

  /// Whether the authenticated user has reacted with this emoji (false for anonymous users)
  @BuiltValueField(wireName: r'reactedByCurrentUser')
  bool get reactedByCurrentUser;

  ReactionCount._();

  factory ReactionCount([void updates(ReactionCountBuilder b)]) =
      _$ReactionCount;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReactionCountBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReactionCount> get serializer =>
      _$ReactionCountSerializer();
}

class _$ReactionCountSerializer implements PrimitiveSerializer<ReactionCount> {
  @override
  final Iterable<Type> types = const [ReactionCount, _$ReactionCount];

  @override
  final String wireName = r'ReactionCount';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReactionCount object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'emoji';
    yield serializers.serialize(
      object.emoji,
      specifiedType: const FullType(String),
    );
    yield r'count';
    yield serializers.serialize(
      object.count,
      specifiedType: const FullType(int),
    );
    yield r'reactedByCurrentUser';
    yield serializers.serialize(
      object.reactedByCurrentUser,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReactionCount object, {
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
    required ReactionCountBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'emoji':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.emoji = valueDes;
          break;
        case r'count':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.count = valueDes;
          break;
        case r'reactedByCurrentUser':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.reactedByCurrentUser = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReactionCount deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReactionCountBuilder();
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
