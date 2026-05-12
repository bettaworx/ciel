// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_report_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateReportRequest extends UpdateReportRequest {
  @override
  final ReportStatus status;
  @override
  final String? resolution;

  factory _$UpdateReportRequest(
          [void Function(UpdateReportRequestBuilder)? updates]) =>
      (UpdateReportRequestBuilder()..update(updates))._build();

  _$UpdateReportRequest._({required this.status, this.resolution}) : super._();
  @override
  UpdateReportRequest rebuild(
          void Function(UpdateReportRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateReportRequestBuilder toBuilder() =>
      UpdateReportRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateReportRequest &&
        status == other.status &&
        resolution == other.resolution;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, resolution.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateReportRequest')
          ..add('status', status)
          ..add('resolution', resolution))
        .toString();
  }
}

class UpdateReportRequestBuilder
    implements Builder<UpdateReportRequest, UpdateReportRequestBuilder> {
  _$UpdateReportRequest? _$v;

  ReportStatus? _status;
  ReportStatus? get status => _$this._status;
  set status(ReportStatus? status) => _$this._status = status;

  String? _resolution;
  String? get resolution => _$this._resolution;
  set resolution(String? resolution) => _$this._resolution = resolution;

  UpdateReportRequestBuilder() {
    UpdateReportRequest._defaults(this);
  }

  UpdateReportRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _status = $v.status;
      _resolution = $v.resolution;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateReportRequest other) {
    _$v = other as _$UpdateReportRequest;
  }

  @override
  void update(void Function(UpdateReportRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateReportRequest build() => _build();

  _$UpdateReportRequest _build() {
    final _$result = _$v ??
        _$UpdateReportRequest._(
          status: BuiltValueNullFieldError.checkNotNull(
              status, r'UpdateReportRequest', 'status'),
          resolution: resolution,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
