//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/admin_post.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_post_page.g.dart';

/// AdminPostPage
///
/// Properties:
/// * [items]
/// * [total] - Total number of posts matching the filters
@BuiltValue()
abstract class AdminPostPage
    implements Built<AdminPostPage, AdminPostPageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<AdminPost> get items;

  /// Total number of posts matching the filters
  @BuiltValueField(wireName: r'total')
  int get total;

  AdminPostPage._();

  factory AdminPostPage([void updates(AdminPostPageBuilder b)]) =
      _$AdminPostPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminPostPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminPostPage> get serializer =>
      _$AdminPostPageSerializer();
}

class _$AdminPostPageSerializer implements PrimitiveSerializer<AdminPostPage> {
  @override
  final Iterable<Type> types = const [AdminPostPage, _$AdminPostPage];

  @override
  final String wireName = r'AdminPostPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminPostPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(AdminPost)]),
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
    AdminPostPage object, {
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
    required AdminPostPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminPost)]),
          ) as BuiltList<AdminPost>;
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
  AdminPostPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminPostPageBuilder();
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
