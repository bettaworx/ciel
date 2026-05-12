// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_invite_code_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateInviteCodeRequest extends CreateInviteCodeRequest {
  @override
  final String? code;
  @override
  final int? maxUses;
  @override
  final DateTime? expiresAt;
  @override
  final String? note;

  factory _$CreateInviteCodeRequest(
          [void Function(CreateInviteCodeRequestBuilder)? updates]) =>
      (CreateInviteCodeRequestBuilder()..update(updates))._build();

  _$CreateInviteCodeRequest._(
      {this.code, this.maxUses, this.expiresAt, this.note})
      : super._();
  @override
  CreateInviteCodeRequest rebuild(
          void Function(CreateInviteCodeRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateInviteCodeRequestBuilder toBuilder() =>
      CreateInviteCodeRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateInviteCodeRequest &&
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
    return (newBuiltValueToStringHelper(r'CreateInviteCodeRequest')
          ..add('code', code)
          ..add('maxUses', maxUses)
          ..add('expiresAt', expiresAt)
          ..add('note', note))
        .toString();
  }
}

class CreateInviteCodeRequestBuilder
    implements
        Builder<CreateInviteCodeRequest, CreateInviteCodeRequestBuilder> {
  _$CreateInviteCodeRequest? _$v;

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

  CreateInviteCodeRequestBuilder() {
    CreateInviteCodeRequest._defaults(this);
  }

  CreateInviteCodeRequestBuilder get _$this {
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
  void replace(CreateInviteCodeRequest other) {
    _$v = other as _$CreateInviteCodeRequest;
  }

  @override
  void update(void Function(CreateInviteCodeRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateInviteCodeRequest build() => _build();

  _$CreateInviteCodeRequest _build() {
    final _$result = _$v ??
        _$CreateInviteCodeRequest._(
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
