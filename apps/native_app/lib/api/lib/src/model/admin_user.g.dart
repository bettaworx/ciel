// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUser extends AdminUser {
  @override
  final UserStats? stats;
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

  factory _$AdminUser([void Function(AdminUserBuilder)? updates]) =>
      (AdminUserBuilder()..update(updates))._build();

  _$AdminUser._(
      {this.stats,
      required this.id,
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
  AdminUser rebuild(void Function(AdminUserBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUserBuilder toBuilder() => AdminUserBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUser &&
        stats == other.stats &&
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
    _$hash = $jc(_$hash, stats.hashCode);
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
    return (newBuiltValueToStringHelper(r'AdminUser')
          ..add('stats', stats)
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

class AdminUserBuilder
    implements Builder<AdminUser, AdminUserBuilder>, UserBuilder {
  _$AdminUser? _$v;

  UserStatsBuilder? _stats;
  UserStatsBuilder get stats => _$this._stats ??= UserStatsBuilder();
  set stats(covariant UserStatsBuilder? stats) => _$this._stats = stats;

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

  AdminUserBuilder() {
    AdminUser._defaults(this);
  }

  AdminUserBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _stats = $v.stats?.toBuilder();
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
  void replace(covariant AdminUser other) {
    _$v = other as _$AdminUser;
  }

  @override
  void update(void Function(AdminUserBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUser build() => _build();

  _$AdminUser _build() {
    _$AdminUser _$result;
    try {
      _$result = _$v ??
          _$AdminUser._(
            stats: _stats?.build(),
            id: BuiltValueNullFieldError.checkNotNull(id, r'AdminUser', 'id'),
            username: BuiltValueNullFieldError.checkNotNull(
                username, r'AdminUser', 'username'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'AdminUser', 'createdAt'),
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
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'stats';
        _stats?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AdminUser', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
