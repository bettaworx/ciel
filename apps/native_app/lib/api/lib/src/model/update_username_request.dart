//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_username_request.g.dart';

/// UpdateUsernameRequest
///
/// Properties:
/// * [username]
@BuiltValue()
abstract class UpdateUsernameRequest
    implements Built<UpdateUsernameRequest, UpdateUsernameRequestBuilder> {
  @BuiltValueField(wireName: r'username')
  String get username;

  UpdateUsernameRequest._();

  factory UpdateUsernameRequest(
      [void updates(UpdateUsernameRequestBuilder b)]) = _$UpdateUsernameRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateUsernameRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateUsernameRequest> get serializer =>
      _$UpdateUsernameRequestSerializer();
}

class _$UpdateUsernameRequestSerializer
    implements PrimitiveSerializer<UpdateUsernameRequest> {
  @override
  final Iterable<Type> types = const [
    UpdateUsernameRequest,
    _$UpdateUsernameRequest
  ];

  @override
  final String wireName = r'UpdateUsernameRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateUsernameRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'username';
    yield serializers.serialize(
      object.username,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateUsernameRequest object, {
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
    required UpdateUsernameRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'username':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.username = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateUsernameRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateUsernameRequestBuilder();
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
