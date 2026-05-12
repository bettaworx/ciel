// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'banned_image_hash.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BannedImageHash extends BannedImageHash {
  @override
  final String id;
  @override
  final String hash;
  @override
  final ImageHashType hashType;
  @override
  final String createdBy;
  @override
  final DateTime createdAt;
  @override
  final String? reason;

  factory _$BannedImageHash([void Function(BannedImageHashBuilder)? updates]) =>
      (BannedImageHashBuilder()..update(updates))._build();

  _$BannedImageHash._(
      {required this.id,
      required this.hash,
      required this.hashType,
      required this.createdBy,
      required this.createdAt,
      this.reason})
      : super._();
  @override
  BannedImageHash rebuild(void Function(BannedImageHashBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BannedImageHashBuilder toBuilder() => BannedImageHashBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BannedImageHash &&
        id == other.id &&
        hash == other.hash &&
        hashType == other.hashType &&
        createdBy == other.createdBy &&
        createdAt == other.createdAt &&
        reason == other.reason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, hash.hashCode);
    _$hash = $jc(_$hash, hashType.hashCode);
    _$hash = $jc(_$hash, createdBy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BannedImageHash')
          ..add('id', id)
          ..add('hash', hash)
          ..add('hashType', hashType)
          ..add('createdBy', createdBy)
          ..add('createdAt', createdAt)
          ..add('reason', reason))
        .toString();
  }
}

class BannedImageHashBuilder
    implements Builder<BannedImageHash, BannedImageHashBuilder> {
  _$BannedImageHash? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _hash;
  String? get hash => _$this._hash;
  set hash(String? hash) => _$this._hash = hash;

  ImageHashType? _hashType;
  ImageHashType? get hashType => _$this._hashType;
  set hashType(ImageHashType? hashType) => _$this._hashType = hashType;

  String? _createdBy;
  String? get createdBy => _$this._createdBy;
  set createdBy(String? createdBy) => _$this._createdBy = createdBy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  BannedImageHashBuilder() {
    BannedImageHash._defaults(this);
  }

  BannedImageHashBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _hash = $v.hash;
      _hashType = $v.hashType;
      _createdBy = $v.createdBy;
      _createdAt = $v.createdAt;
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BannedImageHash other) {
    _$v = other as _$BannedImageHash;
  }

  @override
  void update(void Function(BannedImageHashBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BannedImageHash build() => _build();

  _$BannedImageHash _build() {
    final _$result = _$v ??
        _$BannedImageHash._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'BannedImageHash', 'id'),
          hash: BuiltValueNullFieldError.checkNotNull(
              hash, r'BannedImageHash', 'hash'),
          hashType: BuiltValueNullFieldError.checkNotNull(
              hashType, r'BannedImageHash', 'hashType'),
          createdBy: BuiltValueNullFieldError.checkNotNull(
              createdBy, r'BannedImageHash', 'createdBy'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'BannedImageHash', 'createdAt'),
          reason: reason,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
