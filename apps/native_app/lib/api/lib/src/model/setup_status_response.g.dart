// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'setup_status_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SetupStatusResponse extends SetupStatusResponse {
  @override
  final bool setupCompleted;
  @override
  final bool adminExists;

  factory _$SetupStatusResponse(
          [void Function(SetupStatusResponseBuilder)? updates]) =>
      (SetupStatusResponseBuilder()..update(updates))._build();

  _$SetupStatusResponse._(
      {required this.setupCompleted, required this.adminExists})
      : super._();
  @override
  SetupStatusResponse rebuild(
          void Function(SetupStatusResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SetupStatusResponseBuilder toBuilder() =>
      SetupStatusResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SetupStatusResponse &&
        setupCompleted == other.setupCompleted &&
        adminExists == other.adminExists;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, setupCompleted.hashCode);
    _$hash = $jc(_$hash, adminExists.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SetupStatusResponse')
          ..add('setupCompleted', setupCompleted)
          ..add('adminExists', adminExists))
        .toString();
  }
}

class SetupStatusResponseBuilder
    implements Builder<SetupStatusResponse, SetupStatusResponseBuilder> {
  _$SetupStatusResponse? _$v;

  bool? _setupCompleted;
  bool? get setupCompleted => _$this._setupCompleted;
  set setupCompleted(bool? setupCompleted) =>
      _$this._setupCompleted = setupCompleted;

  bool? _adminExists;
  bool? get adminExists => _$this._adminExists;
  set adminExists(bool? adminExists) => _$this._adminExists = adminExists;

  SetupStatusResponseBuilder() {
    SetupStatusResponse._defaults(this);
  }

  SetupStatusResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _setupCompleted = $v.setupCompleted;
      _adminExists = $v.adminExists;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SetupStatusResponse other) {
    _$v = other as _$SetupStatusResponse;
  }

  @override
  void update(void Function(SetupStatusResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SetupStatusResponse build() => _build();

  _$SetupStatusResponse _build() {
    final _$result = _$v ??
        _$SetupStatusResponse._(
          setupCompleted: BuiltValueNullFieldError.checkNotNull(
              setupCompleted, r'SetupStatusResponse', 'setupCompleted'),
          adminExists: BuiltValueNullFieldError.checkNotNull(
              adminExists, r'SetupStatusResponse', 'adminExists'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
