//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/report_target_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_report_request.g.dart';

/// CreateReportRequest
///
/// Properties:
/// * [targetType]
/// * [targetId] - ID of the item being reported
/// * [reason] - Predefined reason category (e.g., spam, harassment, inappropriate)
/// * [details] - Additional details about the report
@BuiltValue()
abstract class CreateReportRequest
    implements Built<CreateReportRequest, CreateReportRequestBuilder> {
  @BuiltValueField(wireName: r'targetType')
  ReportTargetType get targetType;
  // enum targetTypeEnum {  user,  post,  media,  };

  /// ID of the item being reported
  @BuiltValueField(wireName: r'targetId')
  String get targetId;

  /// Predefined reason category (e.g., spam, harassment, inappropriate)
  @BuiltValueField(wireName: r'reason')
  String get reason;

  /// Additional details about the report
  @BuiltValueField(wireName: r'details')
  String? get details;

  CreateReportRequest._();

  factory CreateReportRequest([void updates(CreateReportRequestBuilder b)]) =
      _$CreateReportRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateReportRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateReportRequest> get serializer =>
      _$CreateReportRequestSerializer();
}

class _$CreateReportRequestSerializer
    implements PrimitiveSerializer<CreateReportRequest> {
  @override
  final Iterable<Type> types = const [
    CreateReportRequest,
    _$CreateReportRequest
  ];

  @override
  final String wireName = r'CreateReportRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateReportRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'targetType';
    yield serializers.serialize(
      object.targetType,
      specifiedType: const FullType(ReportTargetType),
    );
    yield r'targetId';
    yield serializers.serialize(
      object.targetId,
      specifiedType: const FullType(String),
    );
    yield r'reason';
    yield serializers.serialize(
      object.reason,
      specifiedType: const FullType(String),
    );
    if (object.details != null) {
      yield r'details';
      yield serializers.serialize(
        object.details,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateReportRequest object, {
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
    required CreateReportRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'targetType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReportTargetType),
          ) as ReportTargetType;
          result.targetType = valueDes;
          break;
        case r'targetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.targetId = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reason = valueDes;
          break;
        case r'details':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.details = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateReportRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateReportRequestBuilder();
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
