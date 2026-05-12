// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_banned_image_hash_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateBannedImageHashRequest extends CreateBannedImageHashRequest {
  @override
  final String hash;
  @override
  final ImageHashType hashType;
  @override
  final String? reason;

  factory _$CreateBannedImageHashRequest(
          [void Function(CreateBannedImageHashRequestBuilder)? updates]) =>
      (CreateBannedImageHashRequestBuilder()..update(updates))._build();

  _$CreateBannedImageHashRequest._(
      {required this.hash, required this.hashType, this.reason})
      : super._();
  @override
  CreateBannedImageHashRequest rebuild(
          void Function(CreateBannedImageHashRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateBannedImageHashRequestBuilder toBuilder() =>
      CreateBannedImageHashRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateBannedImageHashRequest &&
        hash == other.hash &&
        hashType == other.hashType &&
        reason == other.reason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, hash.hashCode);
    _$hash = $jc(_$hash, hashType.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateBannedImageHashRequest')
          ..add('hash', hash)
          ..add('hashType', hashType)
          ..add('reason', reason))
        .toString();
  }
}

class CreateBannedImageHashRequestBuilder
    implements
        Builder<CreateBannedImageHashRequest,
            CreateBannedImageHashRequestBuilder> {
  _$CreateBannedImageHashRequest? _$v;

  String? _hash;
  String? get hash => _$this._hash;
  set hash(String? hash) => _$this._hash = hash;

  ImageHashType? _hashType;
  ImageHashType? get hashType => _$this._hashType;
  set hashType(ImageHashType? hashType) => _$this._hashType = hashType;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  CreateBannedImageHashRequestBuilder() {
    CreateBannedImageHashRequest._defaults(this);
  }

  CreateBannedImageHashRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _hash = $v.hash;
      _hashType = $v.hashType;
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateBannedImageHashRequest other) {
    _$v = other as _$CreateBannedImageHashRequest;
  }

  @override
  void update(void Function(CreateBannedImageHashRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateBannedImageHashRequest build() => _build();

  _$CreateBannedImageHashRequest _build() {
    final _$result = _$v ??
        _$CreateBannedImageHashRequest._(
          hash: BuiltValueNullFieldError.checkNotNull(
              hash, r'CreateBannedImageHashRequest', 'hash'),
          hashType: BuiltValueNullFieldError.checkNotNull(
              hashType, r'CreateBannedImageHashRequest', 'hashType'),
          reason: reason,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
