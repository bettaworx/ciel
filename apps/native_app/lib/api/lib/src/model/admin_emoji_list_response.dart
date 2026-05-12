//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/admin_emoji.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_emoji_list_response.g.dart';

/// AdminEmojiListResponse
///
/// Properties:
/// * [emojis]
/// * [total] - Total number of custom emojis on this server.
@BuiltValue()
abstract class AdminEmojiListResponse
    implements Built<AdminEmojiListResponse, AdminEmojiListResponseBuilder> {
  @BuiltValueField(wireName: r'emojis')
  BuiltList<AdminEmoji> get emojis;

  /// Total number of custom emojis on this server.
  @BuiltValueField(wireName: r'total')
  int get total;

  AdminEmojiListResponse._();

  factory AdminEmojiListResponse(
          [void updates(AdminEmojiListResponseBuilder b)]) =
      _$AdminEmojiListResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminEmojiListResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminEmojiListResponse> get serializer =>
      _$AdminEmojiListResponseSerializer();
}

class _$AdminEmojiListResponseSerializer
    implements PrimitiveSerializer<AdminEmojiListResponse> {
  @override
  final Iterable<Type> types = const [
    AdminEmojiListResponse,
    _$AdminEmojiListResponse
  ];

  @override
  final String wireName = r'AdminEmojiListResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminEmojiListResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'emojis';
    yield serializers.serialize(
      object.emojis,
      specifiedType: const FullType(BuiltList, [FullType(AdminEmoji)]),
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
    AdminEmojiListResponse object, {
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
    required AdminEmojiListResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'emojis':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminEmoji)]),
          ) as BuiltList<AdminEmoji>;
          result.emojis.replace(valueDes);
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
  AdminEmojiListResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminEmojiListResponseBuilder();
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
