// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'refresh_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RefreshResponse extends RefreshResponse {
  @override
  final int expiresInSeconds;

  factory _$RefreshResponse([void Function(RefreshResponseBuilder)? updates]) =>
      (RefreshResponseBuilder()..update(updates))._build();

  _$RefreshResponse._({required this.expiresInSeconds}) : super._();
  @override
  RefreshResponse rebuild(void Function(RefreshResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RefreshResponseBuilder toBuilder() => RefreshResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RefreshResponse &&
        expiresInSeconds == other.expiresInSeconds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, expiresInSeconds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RefreshResponse')
          ..add('expiresInSeconds', expiresInSeconds))
        .toString();
  }
}

class RefreshResponseBuilder
    implements Builder<RefreshResponse, RefreshResponseBuilder> {
  _$RefreshResponse? _$v;

  int? _expiresInSeconds;
  int? get expiresInSeconds => _$this._expiresInSeconds;
  set expiresInSeconds(int? expiresInSeconds) =>
      _$this._expiresInSeconds = expiresInSeconds;

  RefreshResponseBuilder() {
    RefreshResponse._defaults(this);
  }

  RefreshResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _expiresInSeconds = $v.expiresInSeconds;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RefreshResponse other) {
    _$v = other as _$RefreshResponse;
  }

  @override
  void update(void Function(RefreshResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RefreshResponse build() => _build();

  _$RefreshResponse _build() {
    final _$result = _$v ??
        _$RefreshResponse._(
          expiresInSeconds: BuiltValueNullFieldError.checkNotNull(
              expiresInSeconds, r'RefreshResponse', 'expiresInSeconds'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
