//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/ip_ban.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ip_ban_page.g.dart';

/// IPBanPage
///
/// Properties:
/// * [items]
/// * [total] - Total number of IP bans
@BuiltValue()
abstract class IPBanPage implements Built<IPBanPage, IPBanPageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<IPBan> get items;

  /// Total number of IP bans
  @BuiltValueField(wireName: r'total')
  int get total;

  IPBanPage._();

  factory IPBanPage([void updates(IPBanPageBuilder b)]) = _$IPBanPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(IPBanPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<IPBanPage> get serializer => _$IPBanPageSerializer();
}

class _$IPBanPageSerializer implements PrimitiveSerializer<IPBanPage> {
  @override
  final Iterable<Type> types = const [IPBanPage, _$IPBanPage];

  @override
  final String wireName = r'IPBanPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    IPBanPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(IPBan)]),
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
    IPBanPage object, {
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
    required IPBanPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(IPBan)]),
          ) as BuiltList<IPBan>;
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
  IPBanPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = IPBanPageBuilder();
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
