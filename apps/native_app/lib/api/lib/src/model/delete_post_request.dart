//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'delete_post_request.g.dart';

/// DeletePostRequest
///
/// Properties:
/// * [reason] - Reason for deletion
@BuiltValue()
abstract class DeletePostRequest
    implements Built<DeletePostRequest, DeletePostRequestBuilder> {
  /// Reason for deletion
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  DeletePostRequest._();

  factory DeletePostRequest([void updates(DeletePostRequestBuilder b)]) =
      _$DeletePostRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DeletePostRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DeletePostRequest> get serializer =>
      _$DeletePostRequestSerializer();
}

class _$DeletePostRequestSerializer
    implements PrimitiveSerializer<DeletePostRequest> {
  @override
  final Iterable<Type> types = const [DeletePostRequest, _$DeletePostRequest];

  @override
  final String wireName = r'DeletePostRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DeletePostRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DeletePostRequest object, {
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
    required DeletePostRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DeletePostRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DeletePostRequestBuilder();
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
