// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'report.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$Report extends Report {
  @override
  final String id;
  @override
  final String reporterUserId;
  @override
  final ReportTargetType targetType;
  @override
  final String targetId;
  @override
  final String reason;
  @override
  final ReportStatus status;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final String? reporterUsername;
  @override
  final String? reporterDisplayName;
  @override
  final String? details;
  @override
  final String? reviewedBy;
  @override
  final String? reviewerUsername;
  @override
  final String? reviewerDisplayName;
  @override
  final DateTime? reviewedAt;
  @override
  final String? resolution;

  factory _$Report([void Function(ReportBuilder)? updates]) =>
      (ReportBuilder()..update(updates))._build();

  _$Report._(
      {required this.id,
      required this.reporterUserId,
      required this.targetType,
      required this.targetId,
      required this.reason,
      required this.status,
      required this.createdAt,
      required this.updatedAt,
      this.reporterUsername,
      this.reporterDisplayName,
      this.details,
      this.reviewedBy,
      this.reviewerUsername,
      this.reviewerDisplayName,
      this.reviewedAt,
      this.resolution})
      : super._();
  @override
  Report rebuild(void Function(ReportBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReportBuilder toBuilder() => ReportBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is Report &&
        id == other.id &&
        reporterUserId == other.reporterUserId &&
        targetType == other.targetType &&
        targetId == other.targetId &&
        reason == other.reason &&
        status == other.status &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        reporterUsername == other.reporterUsername &&
        reporterDisplayName == other.reporterDisplayName &&
        details == other.details &&
        reviewedBy == other.reviewedBy &&
        reviewerUsername == other.reviewerUsername &&
        reviewerDisplayName == other.reviewerDisplayName &&
        reviewedAt == other.reviewedAt &&
        resolution == other.resolution;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, reporterUserId.hashCode);
    _$hash = $jc(_$hash, targetType.hashCode);
    _$hash = $jc(_$hash, targetId.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, reporterUsername.hashCode);
    _$hash = $jc(_$hash, reporterDisplayName.hashCode);
    _$hash = $jc(_$hash, details.hashCode);
    _$hash = $jc(_$hash, reviewedBy.hashCode);
    _$hash = $jc(_$hash, reviewerUsername.hashCode);
    _$hash = $jc(_$hash, reviewerDisplayName.hashCode);
    _$hash = $jc(_$hash, reviewedAt.hashCode);
    _$hash = $jc(_$hash, resolution.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'Report')
          ..add('id', id)
          ..add('reporterUserId', reporterUserId)
          ..add('targetType', targetType)
          ..add('targetId', targetId)
          ..add('reason', reason)
          ..add('status', status)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('reporterUsername', reporterUsername)
          ..add('reporterDisplayName', reporterDisplayName)
          ..add('details', details)
          ..add('reviewedBy', reviewedBy)
          ..add('reviewerUsername', reviewerUsername)
          ..add('reviewerDisplayName', reviewerDisplayName)
          ..add('reviewedAt', reviewedAt)
          ..add('resolution', resolution))
        .toString();
  }
}

class ReportBuilder implements Builder<Report, ReportBuilder> {
  _$Report? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _reporterUserId;
  String? get reporterUserId => _$this._reporterUserId;
  set reporterUserId(String? reporterUserId) =>
      _$this._reporterUserId = reporterUserId;

  ReportTargetType? _targetType;
  ReportTargetType? get targetType => _$this._targetType;
  set targetType(ReportTargetType? targetType) =>
      _$this._targetType = targetType;

  String? _targetId;
  String? get targetId => _$this._targetId;
  set targetId(String? targetId) => _$this._targetId = targetId;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  ReportStatus? _status;
  ReportStatus? get status => _$this._status;
  set status(ReportStatus? status) => _$this._status = status;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  String? _reporterUsername;
  String? get reporterUsername => _$this._reporterUsername;
  set reporterUsername(String? reporterUsername) =>
      _$this._reporterUsername = reporterUsername;

  String? _reporterDisplayName;
  String? get reporterDisplayName => _$this._reporterDisplayName;
  set reporterDisplayName(String? reporterDisplayName) =>
      _$this._reporterDisplayName = reporterDisplayName;

  String? _details;
  String? get details => _$this._details;
  set details(String? details) => _$this._details = details;

  String? _reviewedBy;
  String? get reviewedBy => _$this._reviewedBy;
  set reviewedBy(String? reviewedBy) => _$this._reviewedBy = reviewedBy;

  String? _reviewerUsername;
  String? get reviewerUsername => _$this._reviewerUsername;
  set reviewerUsername(String? reviewerUsername) =>
      _$this._reviewerUsername = reviewerUsername;

  String? _reviewerDisplayName;
  String? get reviewerDisplayName => _$this._reviewerDisplayName;
  set reviewerDisplayName(String? reviewerDisplayName) =>
      _$this._reviewerDisplayName = reviewerDisplayName;

  DateTime? _reviewedAt;
  DateTime? get reviewedAt => _$this._reviewedAt;
  set reviewedAt(DateTime? reviewedAt) => _$this._reviewedAt = reviewedAt;

  String? _resolution;
  String? get resolution => _$this._resolution;
  set resolution(String? resolution) => _$this._resolution = resolution;

  ReportBuilder() {
    Report._defaults(this);
  }

  ReportBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _reporterUserId = $v.reporterUserId;
      _targetType = $v.targetType;
      _targetId = $v.targetId;
      _reason = $v.reason;
      _status = $v.status;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _reporterUsername = $v.reporterUsername;
      _reporterDisplayName = $v.reporterDisplayName;
      _details = $v.details;
      _reviewedBy = $v.reviewedBy;
      _reviewerUsername = $v.reviewerUsername;
      _reviewerDisplayName = $v.reviewerDisplayName;
      _reviewedAt = $v.reviewedAt;
      _resolution = $v.resolution;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(Report other) {
    _$v = other as _$Report;
  }

  @override
  void update(void Function(ReportBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  Report build() => _build();

  _$Report _build() {
    final _$result = _$v ??
        _$Report._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'Report', 'id'),
          reporterUserId: BuiltValueNullFieldError.checkNotNull(
              reporterUserId, r'Report', 'reporterUserId'),
          targetType: BuiltValueNullFieldError.checkNotNull(
              targetType, r'Report', 'targetType'),
          targetId: BuiltValueNullFieldError.checkNotNull(
              targetId, r'Report', 'targetId'),
          reason: BuiltValueNullFieldError.checkNotNull(
              reason, r'Report', 'reason'),
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'Report', 'status'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'Report', 'createdAt'),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt, r'Report', 'updatedAt'),
          reporterUsername: reporterUsername,
          reporterDisplayName: reporterDisplayName,
          details: details,
          reviewedBy: reviewedBy,
          reviewerUsername: reviewerUsername,
          reviewerDisplayName: reviewerDisplayName,
          reviewedAt: reviewedAt,
          resolution: resolution,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
