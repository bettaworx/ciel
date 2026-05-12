//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/public_emoji.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'emoji_list_response.g.dart';

/// EmojiListResponse
///
/// Properties:
/// * [emojis]
/// * [total] - Total number of custom emojis on this server.
@BuiltValue()
abstract class EmojiListResponse
    implements Built<EmojiListResponse, EmojiListResponseBuilder> {
  @BuiltValueField(wireName: r'emojis')
  BuiltList<PublicEmoji> get emojis;

  /// Total number of custom emojis on this server.
  @BuiltValueField(wireName: r'total')
  int get total;

  EmojiListResponse._();

  factory EmojiListResponse([void updates(EmojiListResponseBuilder b)]) =
      _$EmojiListResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(EmojiListResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<EmojiListResponse> get serializer =>
      _$EmojiListResponseSerializer();
}

class _$EmojiListResponseSerializer
    implements PrimitiveSerializer<EmojiListResponse> {
  @override
  final Iterable<Type> types = const [EmojiListResponse, _$EmojiListResponse];

  @override
  final String wireName = r'EmojiListResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    EmojiListResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'emojis';
    yield serializers.serialize(
      object.emojis,
      specifiedType: const FullType(BuiltList, [FullType(PublicEmoji)]),
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
    EmojiListResponse object, {
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
    required EmojiListResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'emojis':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(PublicEmoji)]),
          ) as BuiltList<PublicEmoji>;
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
  EmojiListResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = EmojiListResponseBuilder();
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
