// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invite_codes_list_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InviteCodesListResponse extends InviteCodesListResponse {
  @override
  final BuiltList<InviteCodeWithCreator> invites;
  @override
  final int total;

  factory _$InviteCodesListResponse(
          [void Function(InviteCodesListResponseBuilder)? updates]) =>
      (InviteCodesListResponseBuilder()..update(updates))._build();

  _$InviteCodesListResponse._({required this.invites, required this.total})
      : super._();
  @override
  InviteCodesListResponse rebuild(
          void Function(InviteCodesListResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InviteCodesListResponseBuilder toBuilder() =>
      InviteCodesListResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InviteCodesListResponse &&
        invites == other.invites &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, invites.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'InviteCodesListResponse')
          ..add('invites', invites)
          ..add('total', total))
        .toString();
  }
}

class InviteCodesListResponseBuilder
    implements
        Builder<InviteCodesListResponse, InviteCodesListResponseBuilder> {
  _$InviteCodesListResponse? _$v;

  ListBuilder<InviteCodeWithCreator>? _invites;
  ListBuilder<InviteCodeWithCreator> get invites =>
      _$this._invites ??= ListBuilder<InviteCodeWithCreator>();
  set invites(ListBuilder<InviteCodeWithCreator>? invites) =>
      _$this._invites = invites;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  InviteCodesListResponseBuilder() {
    InviteCodesListResponse._defaults(this);
  }

  InviteCodesListResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _invites = $v.invites.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InviteCodesListResponse other) {
    _$v = other as _$InviteCodesListResponse;
  }

  @override
  void update(void Function(InviteCodesListResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InviteCodesListResponse build() => _build();

  _$InviteCodesListResponse _build() {
    _$InviteCodesListResponse _$result;
    try {
      _$result = _$v ??
          _$InviteCodesListResponse._(
            invites: invites.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'InviteCodesListResponse', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'invites';
        invites.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'InviteCodesListResponse', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
