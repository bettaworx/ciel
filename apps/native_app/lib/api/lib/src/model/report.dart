//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/report_status.dart';
import 'package:ciel_api/src/model/report_target_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'report.g.dart';

/// Report
///
/// Properties:
/// * [id]
/// * [reporterUserId] - User who submitted the report
/// * [targetType]
/// * [targetId] - ID of the reported item
/// * [reason] - Predefined reason category
/// * [status]
/// * [createdAt]
/// * [updatedAt]
/// * [reporterUsername] - Username of reporter
/// * [reporterDisplayName] - Display name of reporter
/// * [details] - Additional details provided by reporter
/// * [reviewedBy] - Admin user ID who reviewed this report
/// * [reviewerUsername] - Username of reviewer
/// * [reviewerDisplayName] - Display name of reviewer
/// * [reviewedAt] - When the report was reviewed
/// * [resolution] - Admin's resolution notes
@BuiltValue()
abstract class Report implements Built<Report, ReportBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  /// User who submitted the report
  @BuiltValueField(wireName: r'reporterUserId')
  String get reporterUserId;

  @BuiltValueField(wireName: r'targetType')
  ReportTargetType get targetType;
  // enum targetTypeEnum {  user,  post,  media,  };

  /// ID of the reported item
  @BuiltValueField(wireName: r'targetId')
  String get targetId;

  /// Predefined reason category
  @BuiltValueField(wireName: r'reason')
  String get reason;

  @BuiltValueField(wireName: r'status')
  ReportStatus get status;
  // enum statusEnum {  pending,  reviewing,  resolved,  dismissed,  };

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  /// Username of reporter
  @BuiltValueField(wireName: r'reporterUsername')
  String? get reporterUsername;

  /// Display name of reporter
  @BuiltValueField(wireName: r'reporterDisplayName')
  String? get reporterDisplayName;

  /// Additional details provided by reporter
  @BuiltValueField(wireName: r'details')
  String? get details;

  /// Admin user ID who reviewed this report
  @BuiltValueField(wireName: r'reviewedBy')
  String? get reviewedBy;

  /// Username of reviewer
  @BuiltValueField(wireName: r'reviewerUsername')
  String? get reviewerUsername;

  /// Display name of reviewer
  @BuiltValueField(wireName: r'reviewerDisplayName')
  String? get reviewerDisplayName;

  /// When the report was reviewed
  @BuiltValueField(wireName: r'reviewedAt')
  DateTime? get reviewedAt;

  /// Admin's resolution notes
  @BuiltValueField(wireName: r'resolution')
  String? get resolution;

  Report._();

  factory Report([void updates(ReportBuilder b)]) = _$Report;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReportBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<Report> get serializer => _$ReportSerializer();
}

class _$ReportSerializer implements PrimitiveSerializer<Report> {
  @override
  final Iterable<Type> types = const [Report, _$Report];

  @override
  final String wireName = r'Report';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    Report object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'reporterUserId';
    yield serializers.serialize(
      object.reporterUserId,
      specifiedType: const FullType(String),
    );
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
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(ReportStatus),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.reporterUsername != null) {
      yield r'reporterUsername';
      yield serializers.serialize(
        object.reporterUsername,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.reporterDisplayName != null) {
      yield r'reporterDisplayName';
      yield serializers.serialize(
        object.reporterDisplayName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.details != null) {
      yield r'details';
      yield serializers.serialize(
        object.details,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.reviewedBy != null) {
      yield r'reviewedBy';
      yield serializers.serialize(
        object.reviewedBy,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.reviewerUsername != null) {
      yield r'reviewerUsername';
      yield serializers.serialize(
        object.reviewerUsername,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.reviewerDisplayName != null) {
      yield r'reviewerDisplayName';
      yield serializers.serialize(
        object.reviewerDisplayName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.reviewedAt != null) {
      yield r'reviewedAt';
      yield serializers.serialize(
        object.reviewedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
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
    Report object, {
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
    required ReportBuilder result,
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
        case r'reporterUserId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reporterUserId = valueDes;
          break;
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
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReportStatus),
          ) as ReportStatus;
          result.status = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        case r'reporterUsername':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reporterUsername = valueDes;
          break;
        case r'reporterDisplayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reporterDisplayName = valueDes;
          break;
        case r'details':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.details = valueDes;
          break;
        case r'reviewedBy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reviewedBy = valueDes;
          break;
        case r'reviewerUsername':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reviewerUsername = valueDes;
          break;
        case r'reviewerDisplayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.reviewerDisplayName = valueDes;
          break;
        case r'reviewedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.reviewedAt = valueDes;
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
  Report deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReportBuilder();
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
