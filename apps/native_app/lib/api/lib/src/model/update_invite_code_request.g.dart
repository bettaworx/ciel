// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_invite_code_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateInviteCodeRequest extends UpdateInviteCodeRequest {
  @override
  final String? code;
  @override
  final int? maxUses;
  @override
  final DateTime? expiresAt;
  @override
  final String? note;

  factory _$UpdateInviteCodeRequest(
          [void Function(UpdateInviteCodeRequestBuilder)? updates]) =>
      (UpdateInviteCodeRequestBuilder()..update(updates))._build();

  _$UpdateInviteCodeRequest._(
      {this.code, this.maxUses, this.expiresAt, this.note})
      : super._();
  @override
  UpdateInviteCodeRequest rebuild(
          void Function(UpdateInviteCodeRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateInviteCodeRequestBuilder toBuilder() =>
      UpdateInviteCodeRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateInviteCodeRequest &&
        code == other.code &&
        maxUses == other.maxUses &&
        expiresAt == other.expiresAt &&
        note == other.note;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jc(_$hash, maxUses.hashCode);
    _$hash = $jc(_$hash, expiresAt.hashCode);
    _$hash = $jc(_$hash, note.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateInviteCodeRequest')
          ..add('code', code)
          ..add('maxUses', maxUses)
          ..add('expiresAt', expiresAt)
          ..add('note', note))
        .toString();
  }
}

class UpdateInviteCodeRequestBuilder
    implements
        Builder<UpdateInviteCodeRequest, UpdateInviteCodeRequestBuilder> {
  _$UpdateInviteCodeRequest? _$v;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  int? _maxUses;
  int? get maxUses => _$this._maxUses;
  set maxUses(int? maxUses) => _$this._maxUses = maxUses;

  DateTime? _expiresAt;
  DateTime? get expiresAt => _$this._expiresAt;
  set expiresAt(DateTime? expiresAt) => _$this._expiresAt = expiresAt;

  String? _note;
  String? get note => _$this._note;
  set note(String? note) => _$this._note = note;

  UpdateInviteCodeRequestBuilder() {
    UpdateInviteCodeRequest._defaults(this);
  }

  UpdateInviteCodeRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _code = $v.code;
      _maxUses = $v.maxUses;
      _expiresAt = $v.expiresAt;
      _note = $v.note;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateInviteCodeRequest other) {
    _$v = other as _$UpdateInviteCodeRequest;
  }

  @override
  void update(void Function(UpdateInviteCodeRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateInviteCodeRequest build() => _build();

  _$UpdateInviteCodeRequest _build() {
    final _$result = _$v ??
        _$UpdateInviteCodeRequest._(
          code: code,
          maxUses: maxUses,
          expiresAt: expiresAt,
          note: note,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
