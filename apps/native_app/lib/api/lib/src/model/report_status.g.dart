// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'report_status.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ReportStatus _$pending = const ReportStatus._('pending');
const ReportStatus _$reviewing = const ReportStatus._('reviewing');
const ReportStatus _$resolved = const ReportStatus._('resolved');
const ReportStatus _$dismissed = const ReportStatus._('dismissed');

ReportStatus _$valueOf(String name) {
  switch (name) {
    case 'pending':
      return _$pending;
    case 'reviewing':
      return _$reviewing;
    case 'resolved':
      return _$resolved;
    case 'dismissed':
      return _$dismissed;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ReportStatus> _$values =
    BuiltSet<ReportStatus>(const <ReportStatus>[
  _$pending,
  _$reviewing,
  _$resolved,
  _$dismissed,
]);

class _$ReportStatusMeta {
  const _$ReportStatusMeta();
  ReportStatus get pending => _$pending;
  ReportStatus get reviewing => _$reviewing;
  ReportStatus get resolved => _$resolved;
  ReportStatus get dismissed => _$dismissed;
  ReportStatus valueOf(String name) => _$valueOf(name);
  BuiltSet<ReportStatus> get values => _$values;
}

abstract class _$ReportStatusMixin {
  // ignore: non_constant_identifier_names
  _$ReportStatusMeta get ReportStatus => const _$ReportStatusMeta();
}

Serializer<ReportStatus> _$reportStatusSerializer = _$ReportStatusSerializer();

class _$ReportStatusSerializer implements PrimitiveSerializer<ReportStatus> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'pending': 'pending',
    'reviewing': 'reviewing',
    'resolved': 'resolved',
    'dismissed': 'dismissed',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'pending': 'pending',
    'reviewing': 'reviewing',
    'resolved': 'resolved',
    'dismissed': 'dismissed',
  };

  @override
  final Iterable<Type> types = const <Type>[ReportStatus];
  @override
  final String wireName = 'ReportStatus';

  @override
  Object serialize(Serializers serializers, ReportStatus object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ReportStatus deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ReportStatus.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
