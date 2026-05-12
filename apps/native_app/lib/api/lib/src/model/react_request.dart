//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'react_request.g.dart';

/// ReactRequest
///
/// Properties:
/// * [emoji] - Unicode emoji string or custom emoji shortcode in :shortcode: format.
@BuiltValue()
abstract class ReactRequest
    implements Built<ReactRequest, ReactRequestBuilder> {
  /// Unicode emoji string or custom emoji shortcode in :shortcode: format.
  @BuiltValueField(wireName: r'emoji')
  String get emoji;

  ReactRequest._();

  factory ReactRequest([void updates(ReactRequestBuilder b)]) = _$ReactRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReactRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReactRequest> get serializer => _$ReactRequestSerializer();
}

class _$ReactRequestSerializer implements PrimitiveSerializer<ReactRequest> {
  @override
  final Iterable<Type> types = const [ReactRequest, _$ReactRequest];

  @override
  final String wireName = r'ReactRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReactRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'emoji';
    yield serializers.serialize(
      object.emoji,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReactRequest object, {
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
    required ReactRequestBuilder result,
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReactRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReactRequestBuilder();
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
