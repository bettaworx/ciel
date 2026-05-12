// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

abstract class PostBuilder {
  void replace(Post other);
  void update(void Function(PostBuilder) updates);
  String? get id;
  set id(String? id);

  User? get author;
  set author(User? author);

  String? get content;
  set content(String? content);

  ListBuilder<Media> get media;
  set media(ListBuilder<Media>? media);

  DateTime? get createdAt;
  set createdAt(DateTime? createdAt);

  DateTime? get deletedAt;
  set deletedAt(DateTime? deletedAt);
}

class _$$Post extends $Post {
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

  factory _$$Post([void Function($PostBuilder)? updates]) =>
      ($PostBuilder()..update(updates))._build();

  _$$Post._(
      {required this.id,
      required this.author,
      required this.content,
      required this.media,
      required this.createdAt,
      this.deletedAt})
      : super._();
  @override
  $Post rebuild(void Function($PostBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  $PostBuilder toBuilder() => $PostBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is $Post &&
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
    return (newBuiltValueToStringHelper(r'$Post')
          ..add('id', id)
          ..add('author', author)
          ..add('content', content)
          ..add('media', media)
          ..add('createdAt', createdAt)
          ..add('deletedAt', deletedAt))
        .toString();
  }
}

class $PostBuilder implements Builder<$Post, $PostBuilder>, PostBuilder {
  _$$Post? _$v;

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

  $PostBuilder() {
    $Post._defaults(this);
  }

  $PostBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
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
  void replace(covariant $Post other) {
    _$v = other as _$$Post;
  }

  @override
  void update(void Function($PostBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  $Post build() => _build();

  _$$Post _build() {
    _$$Post _$result;
    try {
      _$result = _$v ??
          _$$Post._(
            id: BuiltValueNullFieldError.checkNotNull(id, r'$Post', 'id'),
            author: BuiltValueNullFieldError.checkNotNull(
                author, r'$Post', 'author'),
            content: BuiltValueNullFieldError.checkNotNull(
                content, r'$Post', 'content'),
            media: media.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'$Post', 'createdAt'),
            deletedAt: deletedAt,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'media';
        media.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(r'$Post', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
