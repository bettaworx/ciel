// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ban_user_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BanUserRequest extends BanUserRequest {
  @override
  final int? ttlSeconds;

  factory _$BanUserRequest([void Function(BanUserRequestBuilder)? updates]) =>
      (BanUserRequestBuilder()..update(updates))._build();

  _$BanUserRequest._({this.ttlSeconds}) : super._();
  @override
  BanUserRequest rebuild(void Function(BanUserRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BanUserRequestBuilder toBuilder() => BanUserRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BanUserRequest && ttlSeconds == other.ttlSeconds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ttlSeconds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BanUserRequest')
          ..add('ttlSeconds', ttlSeconds))
        .toString();
  }
}

class BanUserRequestBuilder
    implements Builder<BanUserRequest, BanUserRequestBuilder> {
  _$BanUserRequest? _$v;

  int? _ttlSeconds;
  int? get ttlSeconds => _$this._ttlSeconds;
  set ttlSeconds(int? ttlSeconds) => _$this._ttlSeconds = ttlSeconds;

  BanUserRequestBuilder() {
    BanUserRequest._defaults(this);
  }

  BanUserRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ttlSeconds = $v.ttlSeconds;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BanUserRequest other) {
    _$v = other as _$BanUserRequest;
  }

  @override
  void update(void Function(BanUserRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BanUserRequest build() => _build();

  _$BanUserRequest _build() {
    final _$result = _$v ??
        _$BanUserRequest._(
          ttlSeconds: ttlSeconds,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
