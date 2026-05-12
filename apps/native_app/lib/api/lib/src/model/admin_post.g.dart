// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_post.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminPost extends AdminPost {
  @override
  final String? deletionReason;
  @override
  final PostVisibility visibility;
  @override
  final String? deletedBy;
  @override
  final String id;
  @override
  final User author;
  @override
  final String content;
  @override
  final BuiltList<Media> media;
  @override
  final DateTime createdAt;
  @override
  final DateTime? deletedAt;

  factory _$AdminPost([void Function(AdminPostBuilder)? updates]) =>
      (AdminPostBuilder()..update(updates))._build();

  _$AdminPost._(
      {this.deletionReason,
      required this.visibility,
      this.deletedBy,
      required this.id,
      required this.author,
      required this.content,
      required this.media,
      required this.createdAt,
      this.deletedAt})
      : super._();
  @override
  AdminPost rebuild(void Function(AdminPostBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminPostBuilder toBuilder() => AdminPostBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminPost &&
        deletionReason == other.deletionReason &&
        visibility == other.visibility &&
        deletedBy == other.deletedBy &&
        id == other.id &&
        author == other.author &&
        content == other.content &&
        media == other.media &&
        createdAt == other.createdAt &&
        deletedAt == other.deletedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, deletionReason.hashCode);
    _$hash = $jc(_$hash, visibility.hashCode);
    _$hash = $jc(_$hash, deletedBy.hashCode);
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, author.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jc(_$hash, media.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, deletedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminPost')
          ..add('deletionReason', deletionReason)
          ..add('visibility', visibility)
          ..add('deletedBy', deletedBy)
          ..add('id', id)
          ..add('author', author)
          ..add('content', content)
          ..add('media', media)
          ..add('createdAt', createdAt)
          ..add('deletedAt', deletedAt))
        .toString();
  }
}

class AdminPostBuilder
    implements Builder<AdminPost, AdminPostBuilder>, PostBuilder {
  _$AdminPost? _$v;

  String? _deletionReason;
  String? get deletionReason => _$this._deletionReason;
  set deletionReason(covariant String? deletionReason) =>
      _$this._deletionReason = deletionReason;

  PostVisibility? _visibility;
  PostVisibility? get visibility => _$this._visibility;
  set visibility(covariant PostVisibility? visibility) =>
      _$this._visibility = visibility;

  String? _deletedBy;
  String? get deletedBy => _$this._deletedBy;
  set deletedBy(covariant String? deletedBy) => _$this._deletedBy = deletedBy;

  String? _id;
  String? get id => _$this._id;
  set id(covariant String? id) => _$this._id = id;

  User? _author;
  User? get author => _$this._author;
  set author(covariant User? author) => _$this._author = author;

  String? _content;
  String? get content => _$this._content;
  set content(covariant String? content) => _$this._content = content;

  ListBuilder<Media>? _media;
  ListBuilder<Media> get media => _$this._media ??= ListBuilder<Media>();
  set media(covariant ListBuilder<Media>? media) => _$this._media = media;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(covariant DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _deletedAt;
  DateTime? get deletedAt => _$this._deletedAt;
  set deletedAt(covariant DateTime? deletedAt) => _$this._deletedAt = deletedAt;

  AdminPostBuilder() {
    AdminPost._defaults(this);
  }

  AdminPostBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _deletionReason = $v.deletionReason;
      _visibility = $v.visibility;
      _deletedBy = $v.deletedBy;
      _id = $v.id;
      _author = $v.author;
      _content = $v.content;
      _media = $v.media.toBuilder();
      _createdAt = $v.createdAt;
      _deletedAt = $v.deletedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(covariant AdminPost other) {
    _$v = other as _$AdminPost;
  }

  @override
  void update(void Function(AdminPostBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminPost build() => _build();

  _$AdminPost _build() {
    _$AdminPost _$result;
    try {
      _$result = _$v ??
          _$AdminPost._(
            deletionReason: deletionReason,
            visibility: BuiltValueNullFieldError.checkNotNull(
                visibility, r'AdminPost', 'visibility'),
            deletedBy: deletedBy,
            id: BuiltValueNullFieldError.checkNotNull(id, r'AdminPost', 'id'),
            author: BuiltValueNullFieldError.checkNotNull(
                author, r'AdminPost', 'author'),
            content: BuiltValueNullFieldError.checkNotNull(
                content, r'AdminPost', 'content'),
            media: media.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'AdminPost', 'createdAt'),
            deletedAt: deletedAt,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'media';
        media.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AdminPost', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
