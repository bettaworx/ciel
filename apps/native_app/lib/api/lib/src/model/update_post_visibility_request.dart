//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/post_visibility.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_post_visibility_request.g.dart';

/// UpdatePostVisibilityRequest
///
/// Properties:
/// * [visibility]
@BuiltValue()
abstract class UpdatePostVisibilityRequest
    implements
        Built<UpdatePostVisibilityRequest, UpdatePostVisibilityRequestBuilder> {
  @BuiltValueField(wireName: r'visibility')
  PostVisibility get visibility;
  // enum visibilityEnum {  public,  hidden,  deleted,  };

  UpdatePostVisibilityRequest._();

  factory UpdatePostVisibilityRequest(
          [void updates(UpdatePostVisibilityRequestBuilder b)]) =
      _$UpdatePostVisibilityRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdatePostVisibilityRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdatePostVisibilityRequest> get serializer =>
      _$UpdatePostVisibilityRequestSerializer();
}

class _$UpdatePostVisibilityRequestSerializer
    implements PrimitiveSerializer<UpdatePostVisibilityRequest> {
  @override
  final Iterable<Type> types = const [
    UpdatePostVisibilityRequest,
    _$UpdatePostVisibilityRequest
  ];

  @override
  final String wireName = r'UpdatePostVisibilityRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdatePostVisibilityRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'visibility';
    yield serializers.serialize(
      object.visibility,
      specifiedType: const FullType(PostVisibility),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdatePostVisibilityRequest object, {
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
    required UpdatePostVisibilityRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'visibility':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(PostVisibility),
          ) as PostVisibility;
          result.visibility = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdatePostVisibilityRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdatePostVisibilityRequestBuilder();
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
