//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_admin_user_note_request.g.dart';

/// UpdateAdminUserNoteRequest
///
/// Properties:
/// * [content] - Updated admin note content
@BuiltValue()
abstract class UpdateAdminUserNoteRequest
    implements
        Built<UpdateAdminUserNoteRequest, UpdateAdminUserNoteRequestBuilder> {
  /// Updated admin note content
  @BuiltValueField(wireName: r'content')
  String get content;

  UpdateAdminUserNoteRequest._();

  factory UpdateAdminUserNoteRequest(
          [void updates(UpdateAdminUserNoteRequestBuilder b)]) =
      _$UpdateAdminUserNoteRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateAdminUserNoteRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateAdminUserNoteRequest> get serializer =>
      _$UpdateAdminUserNoteRequestSerializer();
}

class _$UpdateAdminUserNoteRequestSerializer
    implements PrimitiveSerializer<UpdateAdminUserNoteRequest> {
  @override
  final Iterable<Type> types = const [
    UpdateAdminUserNoteRequest,
    _$UpdateAdminUserNoteRequest
  ];

  @override
  final String wireName = r'UpdateAdminUserNoteRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateAdminUserNoteRequest object, {
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
    UpdateAdminUserNoteRequest object, {
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
    required UpdateAdminUserNoteRequestBuilder result,
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
  UpdateAdminUserNoteRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateAdminUserNoteRequestBuilder();
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
