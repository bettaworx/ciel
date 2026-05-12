//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/mute_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_user_mute_request.g.dart';

/// CreateUserMuteRequest
///
/// Properties:
/// * [muteType]
/// * [reason] - Reason for the mute
/// * [expiresAt] - When the mute should expire (null = permanent)
@BuiltValue()
abstract class CreateUserMuteRequest
    implements Built<CreateUserMuteRequest, CreateUserMuteRequestBuilder> {
  @BuiltValueField(wireName: r'muteType')
  MuteType get muteType;
  // enum muteTypeEnum {  posts_create,  media_upload,  reactions_add,  all,  };

  /// Reason for the mute
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  /// When the mute should expire (null = permanent)
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  CreateUserMuteRequest._();

  factory CreateUserMuteRequest(
      [void updates(CreateUserMuteRequestBuilder b)]) = _$CreateUserMuteRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateUserMuteRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateUserMuteRequest> get serializer =>
      _$CreateUserMuteRequestSerializer();
}

class _$CreateUserMuteRequestSerializer
    implements PrimitiveSerializer<CreateUserMuteRequest> {
  @override
  final Iterable<Type> types = const [
    CreateUserMuteRequest,
    _$CreateUserMuteRequest
  ];

  @override
  final String wireName = r'CreateUserMuteRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateUserMuteRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'muteType';
    yield serializers.serialize(
      object.muteType,
      specifiedType: const FullType(MuteType),
    );
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.expiresAt != null) {
      yield r'expiresAt';
      yield serializers.serialize(
        object.expiresAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateUserMuteRequest object, {
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
    required CreateUserMuteRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'muteType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MuteType),
          ) as MuteType;
          result.muteType = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reason = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.expiresAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateUserMuteRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateUserMuteRequestBuilder();
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
