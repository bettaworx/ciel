//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/moderation_log.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'moderation_log_page.g.dart';

/// ModerationLogPage
///
/// Properties:
/// * [items]
/// * [total] - Total number of moderation logs matching the filters
@BuiltValue()
abstract class ModerationLogPage
    implements Built<ModerationLogPage, ModerationLogPageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<ModerationLog> get items;

  /// Total number of moderation logs matching the filters
  @BuiltValueField(wireName: r'total')
  int get total;

  ModerationLogPage._();

  factory ModerationLogPage([void updates(ModerationLogPageBuilder b)]) =
      _$ModerationLogPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ModerationLogPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ModerationLogPage> get serializer =>
      _$ModerationLogPageSerializer();
}

class _$ModerationLogPageSerializer
    implements PrimitiveSerializer<ModerationLogPage> {
  @override
  final Iterable<Type> types = const [ModerationLogPage, _$ModerationLogPage];

  @override
  final String wireName = r'ModerationLogPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ModerationLogPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(ModerationLog)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ModerationLogPage object, {
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
    required ModerationLogPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ModerationLog)]),
          ) as BuiltList<ModerationLog>;
          result.items.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ModerationLogPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ModerationLogPageBuilder();
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
