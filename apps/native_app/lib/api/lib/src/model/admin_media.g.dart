// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_media.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminMedia extends AdminMedia {
  @override
  final String? deletionReason;
  @override
  final String? uploaderUsername;
  @override
  final DateTime? deletedAt;
  @override
  final String? phash;
  @override
  final int? usedInPostsCount;
  @override
  final String? userId;
  @override
  final String? deletedBy;
  @override
  final String id;
  @override
  final MediaType type;
  @override
  final String url;
  @override
  final int width;
  @override
  final int height;
  @override
  final DateTime createdAt;
  @override
  final double? duration;
  @override
  final String? thumbnailUrl;

  factory _$AdminMedia([void Function(AdminMediaBuilder)? updates]) =>
      (AdminMediaBuilder()..update(updates))._build();

  _$AdminMedia._(
      {this.deletionReason,
      this.uploaderUsername,
      this.deletedAt,
      this.phash,
      this.usedInPostsCount,
      this.userId,
      this.deletedBy,
      required this.id,
      required this.type,
      required this.url,
      required this.width,
      required this.height,
      required this.createdAt,
      this.duration,
      this.thumbnailUrl})
      : super._();
  @override
  AdminMedia rebuild(void Function(AdminMediaBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminMediaBuilder toBuilder() => AdminMediaBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminMedia &&
        deletionReason == other.deletionReason &&
        uploaderUsername == other.uploaderUsername &&
        deletedAt == other.deletedAt &&
        phash == other.phash &&
        usedInPostsCount == other.usedInPostsCount &&
        userId == other.userId &&
        deletedBy == other.deletedBy &&
        id == other.id &&
        type == other.type &&
        url == other.url &&
        width == other.width &&
        height == other.height &&
        createdAt == other.createdAt &&
        duration == other.duration &&
        thumbnailUrl == other.thumbnailUrl;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, deletionReason.hashCode);
    _$hash = $jc(_$hash, uploaderUsername.hashCode);
    _$hash = $jc(_$hash, deletedAt.hashCode);
    _$hash = $jc(_$hash, phash.hashCode);
    _$hash = $jc(_$hash, usedInPostsCount.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, deletedBy.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, url.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, duration.hashCode);
    _$hash = $jc(_$hash, thumbnailUrl.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminMedia')
          ..add('deletionReason', deletionReason)
          ..add('uploaderUsername', uploaderUsername)
          ..add('deletedAt', deletedAt)
          ..add('phash', phash)
          ..add('usedInPostsCount', usedInPostsCount)
          ..add('userId', userId)
          ..add('deletedBy', deletedBy)
          ..add('id', id)
          ..add('type', type)
          ..add('url', url)
          ..add('width', width)
          ..add('height', height)
          ..add('createdAt', createdAt)
          ..add('duration', duration)
          ..add('thumbnailUrl', thumbnailUrl))
        .toString();
  }
}

class AdminMediaBuilder
    implements Builder<AdminMedia, AdminMediaBuilder>, MediaBuilder {
  _$AdminMedia? _$v;

  String? _deletionReason;
  String? get deletionReason => _$this._deletionReason;
  set deletionReason(covariant String? deletionReason) =>
      _$this._deletionReason = deletionReason;

  String? _uploaderUsername;
  String? get uploaderUsername => _$this._uploaderUsername;
  set uploaderUsername(covariant String? uploaderUsername) =>
      _$this._uploaderUsername = uploaderUsername;

  DateTime? _deletedAt;
  DateTime? get deletedAt => _$this._deletedAt;
  set deletedAt(covariant DateTime? deletedAt) => _$this._deletedAt = deletedAt;

  String? _phash;
  String? get phash => _$this._phash;
  set phash(covariant String? phash) => _$this._phash = phash;

  int? _usedInPostsCount;
  int? get usedInPostsCount => _$this._usedInPostsCount;
  set usedInPostsCount(covariant int? usedInPostsCount) =>
      _$this._usedInPostsCount = usedInPostsCount;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(covariant String? userId) => _$this._userId = userId;

  String? _deletedBy;
  String? get deletedBy => _$this._deletedBy;
  set deletedBy(covariant String? deletedBy) => _$this._deletedBy = deletedBy;

  String? _id;
  String? get id => _$this._id;
  set id(covariant String? id) => _$this._id = id;

  MediaType? _type;
  MediaType? get type => _$this._type;
  set type(covariant MediaType? type) => _$this._type = type;

  String? _url;
  String? get url => _$this._url;
  set url(covariant String? url) => _$this._url = url;

  int? _width;
  int? get width => _$this._width;
  set width(covariant int? width) => _$this._width = width;

  int? _height;
  int? get height => _$this._height;
  set height(covariant int? height) => _$this._height = height;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(covariant DateTime? createdAt) => _$this._createdAt = createdAt;

  double? _duration;
  double? get duration => _$this._duration;
  set duration(covariant double? duration) => _$this._duration = duration;

  String? _thumbnailUrl;
  String? get thumbnailUrl => _$this._thumbnailUrl;
  set thumbnailUrl(covariant String? thumbnailUrl) =>
      _$this._thumbnailUrl = thumbnailUrl;

  AdminMediaBuilder() {
    AdminMedia._defaults(this);
  }

  AdminMediaBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _deletionReason = $v.deletionReason;
      _uploaderUsername = $v.uploaderUsername;
      _deletedAt = $v.deletedAt;
      _phash = $v.phash;
      _usedInPostsCount = $v.usedInPostsCount;
      _userId = $v.userId;
      _deletedBy = $v.deletedBy;
      _id = $v.id;
      _type = $v.type;
      _url = $v.url;
      _width = $v.width;
      _height = $v.height;
      _createdAt = $v.createdAt;
      _duration = $v.duration;
      _thumbnailUrl = $v.thumbnailUrl;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(covariant AdminMedia other) {
    _$v = other as _$AdminMedia;
  }

  @override
  void update(void Function(AdminMediaBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminMedia build() => _build();

  _$AdminMedia _build() {
    final _$result = _$v ??
        _$AdminMedia._(
          deletionReason: deletionReason,
          uploaderUsername: uploaderUsername,
          deletedAt: deletedAt,
          phash: phash,
          usedInPostsCount: usedInPostsCount,
          userId: userId,
          deletedBy: deletedBy,
          id: BuiltValueNullFieldError.checkNotNull(id, r'AdminMedia', 'id'),
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'AdminMedia', 'type'),
          url: BuiltValueNullFieldError.checkNotNull(url, r'AdminMedia', 'url'),
          width: BuiltValueNullFieldError.checkNotNull(
              width, r'AdminMedia', 'width'),
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'AdminMedia', 'height'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'AdminMedia', 'createdAt'),
          duration: duration,
          thumbnailUrl: thumbnailUrl,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
