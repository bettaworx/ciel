//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/admin_media.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_media_page.g.dart';

/// AdminMediaPage
///
/// Properties:
/// * [items]
/// * [total] - Total number of media items matching the filters
@BuiltValue()
abstract class AdminMediaPage
    implements Built<AdminMediaPage, AdminMediaPageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AdminMedia> get items;

  /// Total number of media items matching the filters
  @BuiltValueField(wireName: r'total')
  int get total;

  AdminMediaPage._();

  factory AdminMediaPage([void updates(AdminMediaPageBuilder b)]) =
      _$AdminMediaPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminMediaPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminMediaPage> get serializer =>
      _$AdminMediaPageSerializer();
}

class _$AdminMediaPageSerializer
    implements PrimitiveSerializer<AdminMediaPage> {
  @override
  final Iterable<Type> types = const [AdminMediaPage, _$AdminMediaPage];

  @override
  final String wireName = r'AdminMediaPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminMediaPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AdminMedia)]),
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
    AdminMediaPage object, {
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
    required AdminMediaPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminMedia)]),
          ) as BuiltList<AdminMedia>;
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
  AdminMediaPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminMediaPageBuilder();
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
