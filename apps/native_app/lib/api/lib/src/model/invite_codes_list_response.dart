//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/invite_code_with_creator.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invite_codes_list_response.g.dart';

/// InviteCodesListResponse
///
/// Properties:
/// * [invites]
/// * [total] - Total number of invite codes
@BuiltValue()
abstract class InviteCodesListResponse
    implements Built<InviteCodesListResponse, InviteCodesListResponseBuilder> {
  @BuiltValueField(wireName: r'invites')
  BuiltList<InviteCodeWithCreator> get invites;

  /// Total number of invite codes
  @BuiltValueField(wireName: r'total')
  int get total;

  InviteCodesListResponse._();

  factory InviteCodesListResponse(
          [void updates(InviteCodesListResponseBuilder b)]) =
      _$InviteCodesListResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InviteCodesListResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InviteCodesListResponse> get serializer =>
      _$InviteCodesListResponseSerializer();
}

class _$InviteCodesListResponseSerializer
    implements PrimitiveSerializer<InviteCodesListResponse> {
  @override
  final Iterable<Type> types = const [
    InviteCodesListResponse,
    _$InviteCodesListResponse
  ];

  @override
  final String wireName = r'InviteCodesListResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InviteCodesListResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'invites';
    yield serializers.serialize(
      object.invites,
      specifiedType:
          const FullType(BuiltList, [FullType(InviteCodeWithCreator)]),
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
    InviteCodesListResponse object, {
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
    required InviteCodesListResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'invites':
          final valueDes = serializers.deserialize(
            value,
            specifiedType:
                const FullType(BuiltList, [FullType(InviteCodeWithCreator)]),
          ) as BuiltList<InviteCodeWithCreator>;
          result.invites.replace(valueDes);
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
  InviteCodesListResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InviteCodesListResponseBuilder();
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
