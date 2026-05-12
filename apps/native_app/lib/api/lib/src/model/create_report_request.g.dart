// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_report_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateReportRequest extends CreateReportRequest {
  @override
  final ReportTargetType targetType;
  @override
  final String targetId;
  @override
  final String reason;
  @override
  final String? details;

  factory _$CreateReportRequest(
          [void Function(CreateReportRequestBuilder)? updates]) =>
      (CreateReportRequestBuilder()..update(updates))._build();

  _$CreateReportRequest._(
      {required this.targetType,
      required this.targetId,
      required this.reason,
      this.details})
      : super._();
  @override
  CreateReportRequest rebuild(
          void Function(CreateReportRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateReportRequestBuilder toBuilder() =>
      CreateReportRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateReportRequest &&
        targetType == other.targetType &&
        targetId == other.targetId &&
        reason == other.reason &&
        details == other.details;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, targetType.hashCode);
    _$hash = $jc(_$hash, targetId.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jc(_$hash, details.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateReportRequest')
          ..add('targetType', targetType)
          ..add('targetId', targetId)
          ..add('reason', reason)
          ..add('details', details))
        .toString();
  }
}

class CreateReportRequestBuilder
    implements Builder<CreateReportRequest, CreateReportRequestBuilder> {
  _$CreateReportRequest? _$v;

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

  String? _details;
  String? get details => _$this._details;
  set details(String? details) => _$this._details = details;

  CreateReportRequestBuilder() {
    CreateReportRequest._defaults(this);
  }

  CreateReportRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _targetType = $v.targetType;
      _targetId = $v.targetId;
      _reason = $v.reason;
      _details = $v.details;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateReportRequest other) {
    _$v = other as _$CreateReportRequest;
  }

  @override
  void update(void Function(CreateReportRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateReportRequest build() => _build();

  _$CreateReportRequest _build() {
    final _$result = _$v ??
        _$CreateReportRequest._(
          targetType: BuiltValueNullFieldError.checkNotNull(
              targetType, r'CreateReportRequest', 'targetType'),
          targetId: BuiltValueNullFieldError.checkNotNull(
              targetId, r'CreateReportRequest', 'targetId'),
          reason: BuiltValueNullFieldError.checkNotNull(
              reason, r'CreateReportRequest', 'reason'),
          details: details,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
