// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

abstract class UserBuilder {
  void replace(User other);
  void update(void Function(UserBuilder) updates);
  String? get id;
  set id(String? id);

  String? get username;
  set username(String? username);

  DateTime? get createdAt;
  set createdAt(DateTime? createdAt);

  String? get displayName;
  set displayName(String? displayName);

  String? get bio;
  set bio(String? bio);

  String? get avatarUrl;
  set avatarUrl(String? avatarUrl);

  String? get bannerUrl;
  set bannerUrl(String? bannerUrl);

  bool? get isAdmin;
  set isAdmin(bool? isAdmin);

  int? get termsVersion;
  set termsVersion(int? termsVersion);

  int? get privacyVersion;
  set privacyVersion(int? privacyVersion);

  DateTime? get termsAcceptedAt;
  set termsAcceptedAt(DateTime? termsAcceptedAt);

  DateTime? get privacyAcceptedAt;
  set privacyAcceptedAt(DateTime? privacyAcceptedAt);
}

class _$$User extends $User {
  @override
  final String id;
  @override
  final String username;
  @override
  final DateTime createdAt;
  @override
  final String? displayName;
  @override
  final String? bio;
  @override
  final String? avatarUrl;
  @override
  final String? bannerUrl;
  @override
  final bool? isAdmin;
  @override
  final int? termsVersion;
  @override
  final int? privacyVersion;
  @override
  final DateTime? termsAcceptedAt;
  @override
  final DateTime? privacyAcceptedAt;

  factory _$$User([void Function($UserBuilder)? updates]) =>
      ($UserBuilder()..update(updates))._build();

  _$$User._(
      {required this.id,
      required this.username,
      required this.createdAt,
      this.displayName,
      this.bio,
      this.avatarUrl,
      this.bannerUrl,
      this.isAdmin,
      this.termsVersion,
      this.privacyVersion,
      this.termsAcceptedAt,
      this.privacyAcceptedAt})
      : super._();
  @override
  $User rebuild(void Function($UserBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  $UserBuilder toBuilder() => $UserBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is $User &&
        id == other.id &&
        username == other.username &&
        createdAt == other.createdAt &&
        displayName == other.displayName &&
        bio == other.bio &&
        avatarUrl == other.avatarUrl &&
        bannerUrl == other.bannerUrl &&
        isAdmin == other.isAdmin &&
        termsVersion == other.termsVersion &&
        privacyVersion == other.privacyVersion &&
        termsAcceptedAt == other.termsAcceptedAt &&
        privacyAcceptedAt == other.privacyAcceptedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, bio.hashCode);
    _$hash = $jc(_$hash, avatarUrl.hashCode);
    _$hash = $jc(_$hash, bannerUrl.hashCode);
    _$hash = $jc(_$hash, isAdmin.hashCode);
    _$hash = $jc(_$hash, termsVersion.hashCode);
    _$hash = $jc(_$hash, privacyVersion.hashCode);
    _$hash = $jc(_$hash, termsAcceptedAt.hashCode);
    _$hash = $jc(_$hash, privacyAcceptedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'$User')
          ..add('id', id)
          ..add('username', username)
          ..add('createdAt', createdAt)
          ..add('displayName', displayName)
          ..add('bio', bio)
          ..add('avatarUrl', avatarUrl)
          ..add('bannerUrl', bannerUrl)
          ..add('isAdmin', isAdmin)
          ..add('termsVersion', termsVersion)
          ..add('privacyVersion', privacyVersion)
          ..add('termsAcceptedAt', termsAcceptedAt)
          ..add('privacyAcceptedAt', privacyAcceptedAt))
        .toString();
  }
}

class $UserBuilder implements Builder<$User, $UserBuilder>, UserBuilder {
  _$$User? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(covariant String? id) => _$this._id = id;

  String? _username;
  String? get username => _$this._username;
  set username(covariant String? username) => _$this._username = username;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(covariant DateTime? createdAt) => _$this._createdAt = createdAt;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(covariant String? displayName) =>
      _$this._displayName = displayName;

  String? _bio;
  String? get bio => _$this._bio;
  set bio(covariant String? bio) => _$this._bio = bio;

  String? _avatarUrl;
  String? get avatarUrl => _$this._avatarUrl;
  set avatarUrl(covariant String? avatarUrl) => _$this._avatarUrl = avatarUrl;

  String? _bannerUrl;
  String? get bannerUrl => _$this._bannerUrl;
  set bannerUrl(covariant String? bannerUrl) => _$this._bannerUrl = bannerUrl;

  bool? _isAdmin;
  bool? get isAdmin => _$this._isAdmin;
  set isAdmin(covariant bool? isAdmin) => _$this._isAdmin = isAdmin;

  int? _termsVersion;
  int? get termsVersion => _$this._termsVersion;
  set termsVersion(covariant int? termsVersion) =>
      _$this._termsVersion = termsVersion;

  int? _privacyVersion;
  int? get privacyVersion => _$this._privacyVersion;
  set privacyVersion(covariant int? privacyVersion) =>
      _$this._privacyVersion = privacyVersion;

  DateTime? _termsAcceptedAt;
  DateTime? get termsAcceptedAt => _$this._termsAcceptedAt;
  set termsAcceptedAt(covariant DateTime? termsAcceptedAt) =>
      _$this._termsAcceptedAt = termsAcceptedAt;

  DateTime? _privacyAcceptedAt;
  DateTime? get privacyAcceptedAt => _$this._privacyAcceptedAt;
  set privacyAcceptedAt(covariant DateTime? privacyAcceptedAt) =>
      _$this._privacyAcceptedAt = privacyAcceptedAt;

  $UserBuilder() {
    $User._defaults(this);
  }

  $UserBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _username = $v.username;
      _createdAt = $v.createdAt;
      _displayName = $v.displayName;
      _bio = $v.bio;
      _avatarUrl = $v.avatarUrl;
      _bannerUrl = $v.bannerUrl;
      _isAdmin = $v.isAdmin;
      _termsVersion = $v.termsVersion;
      _privacyVersion = $v.privacyVersion;
      _termsAcceptedAt = $v.termsAcceptedAt;
      _privacyAcceptedAt = $v.privacyAcceptedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(covariant $User other) {
    _$v = other as _$$User;
  }

  @override
  void update(void Function($UserBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  $User build() => _build();

  _$$User _build() {
    final _$result = _$v ??
        _$$User._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'$User', 'id'),
          username: BuiltValueNullFieldError.checkNotNull(
              username, r'$User', 'username'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'$User', 'createdAt'),
          displayName: displayName,
          bio: bio,
          avatarUrl: avatarUrl,
          bannerUrl: bannerUrl,
          isAdmin: isAdmin,
          termsVersion: termsVersion,
          privacyVersion: privacyVersion,
          termsAcceptedAt: termsAcceptedAt,
          privacyAcceptedAt: privacyAcceptedAt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
