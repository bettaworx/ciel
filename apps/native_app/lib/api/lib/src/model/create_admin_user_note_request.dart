//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_admin_user_note_request.g.dart';

/// CreateAdminUserNoteRequest
///
/// Properties:
/// * [content] - Admin note content
@BuiltValue()
abstract class CreateAdminUserNoteRequest
    implements
        Built<CreateAdminUserNoteRequest, CreateAdminUserNoteRequestBuilder> {
  /// Admin note content
  @BuiltValueField(wireName: r'content')
  String get content;

  CreateAdminUserNoteRequest._();

  factory CreateAdminUserNoteRequest(
          [void updates(CreateAdminUserNoteRequestBuilder b)]) =
      _$CreateAdminUserNoteRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateAdminUserNoteRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateAdminUserNoteRequest> get serializer =>
      _$CreateAdminUserNoteRequestSerializer();
}

class _$CreateAdminUserNoteRequestSerializer
    implements PrimitiveSerializer<CreateAdminUserNoteRequest> {
  @override
  final Iterable<Type> types = const [
    CreateAdminUserNoteRequest,
    _$CreateAdminUserNoteRequest
  ];

  @override
  final String wireName = r'CreateAdminUserNoteRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateAdminUserNoteRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'content';
    yield serializers.serialize(
      object.content,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateAdminUserNoteRequest object, {
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
    required CreateAdminUserNoteRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'content':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.content = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateAdminUserNoteRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateAdminUserNoteRequestBuilder();
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
