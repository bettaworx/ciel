//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_role_request.g.dart';

/// CreateRoleRequest
///
/// Properties:
/// * [id]
/// * [name] - Display name of the role
/// * [description] - Description of the role
@BuiltValue()
abstract class CreateRoleRequest
    implements Built<CreateRoleRequest, CreateRoleRequestBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Display name of the role
  @BuiltValueField(wireName: r'name')
  String get name;

  /// Description of the role
  @BuiltValueField(wireName: r'description')
  String get description;

  CreateRoleRequest._();

  factory CreateRoleRequest([void updates(CreateRoleRequestBuilder b)]) =
      _$CreateRoleRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateRoleRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateRoleRequest> get serializer =>
      _$CreateRoleRequestSerializer();
}

class _$CreateRoleRequestSerializer
    implements PrimitiveSerializer<CreateRoleRequest> {
  @override
  final Iterable<Type> types = const [CreateRoleRequest, _$CreateRoleRequest];

  @override
  final String wireName = r'CreateRoleRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateRoleRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'description';
    yield serializers.serialize(
      object.description,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateRoleRequest object, {
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
    required CreateRoleRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateRoleRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateRoleRequestBuilder();
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
