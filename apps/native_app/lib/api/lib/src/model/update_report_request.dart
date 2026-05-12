//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/report_status.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_report_request.g.dart';

/// UpdateReportRequest
///
/// Properties:
/// * [status]
/// * [resolution] - Admin's resolution notes
@BuiltValue()
abstract class UpdateReportRequest
    implements Built<UpdateReportRequest, UpdateReportRequestBuilder> {
  @BuiltValueField(wireName: r'status')
  ReportStatus get status;
  // enum statusEnum {  pending,  reviewing,  resolved,  dismissed,  };

  /// Admin's resolution notes
  @BuiltValueField(wireName: r'resolution')
  String? get resolution;

  UpdateReportRequest._();

  factory UpdateReportRequest([void updates(UpdateReportRequestBuilder b)]) =
      _$UpdateReportRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateReportRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateReportRequest> get serializer =>
      _$UpdateReportRequestSerializer();
}

class _$UpdateReportRequestSerializer
    implements PrimitiveSerializer<UpdateReportRequest> {
  @override
  final Iterable<Type> types = const [
    UpdateReportRequest,
    _$UpdateReportRequest
  ];

  @override
  final String wireName = r'UpdateReportRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateReportRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(ReportStatus),
    );
    if (object.resolution != null) {
      yield r'resolution';
      yield serializers.serialize(
        object.resolution,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateReportRequest object, {
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
    required UpdateReportRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReportStatus),
          ) as ReportStatus;
          result.status = valueDes;
          break;
        case r'resolution':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.resolution = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateReportRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateReportRequestBuilder();
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
