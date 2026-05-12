//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/post.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'timeline_page.g.dart';

/// TimelinePage
///
/// Properties:
/// * [items]
/// * [nextCursor]
@BuiltValue()
abstract class TimelinePage
    implements Built<TimelinePage, TimelinePageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<Post> get items;

  @BuiltValueField(wireName: r'nextCursor')
  String? get nextCursor;

  TimelinePage._();

  factory TimelinePage([void updates(TimelinePageBuilder b)]) = _$TimelinePage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TimelinePageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TimelinePage> get serializer => _$TimelinePageSerializer();
}

class _$TimelinePageSerializer implements PrimitiveSerializer<TimelinePage> {
  @override
  final Iterable<Type> types = const [TimelinePage, _$TimelinePage];

  @override
  final String wireName = r'TimelinePage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TimelinePage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(Post)]),
    );
    if (object.nextCursor != null) {
      yield r'nextCursor';
      yield serializers.serialize(
        object.nextCursor,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    TimelinePage object, {
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
    required TimelinePageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(Post)]),
          ) as BuiltList<Post>;
          result.items.replace(valueDes);
          break;
        case r'nextCursor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.nextCursor = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TimelinePage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TimelinePageBuilder();
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
