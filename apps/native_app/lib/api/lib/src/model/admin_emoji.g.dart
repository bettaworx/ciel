// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_emoji.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminEmoji extends AdminEmoji {
  @override
  final String id;
  @override
  final String shortcode;
  @override
  final String imageUrl;
  @override
  final int width;
  @override
  final int height;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final String? name;
  @override
  final String? category;
  @override
  final String? license;

  factory _$AdminEmoji([void Function(AdminEmojiBuilder)? updates]) =>
      (AdminEmojiBuilder()..update(updates))._build();

  _$AdminEmoji._(
      {required this.id,
      required this.shortcode,
      required this.imageUrl,
      required this.width,
      required this.height,
      required this.createdAt,
      required this.updatedAt,
      this.name,
      this.category,
      this.license})
      : super._();
  @override
  AdminEmoji rebuild(void Function(AdminEmojiBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminEmojiBuilder toBuilder() => AdminEmojiBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminEmoji &&
        id == other.id &&
        shortcode == other.shortcode &&
        imageUrl == other.imageUrl &&
        width == other.width &&
        height == other.height &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        name == other.name &&
        category == other.category &&
        license == other.license;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, shortcode.hashCode);
    _$hash = $jc(_$hash, imageUrl.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, category.hashCode);
    _$hash = $jc(_$hash, license.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminEmoji')
          ..add('id', id)
          ..add('shortcode', shortcode)
          ..add('imageUrl', imageUrl)
          ..add('width', width)
          ..add('height', height)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('name', name)
          ..add('category', category)
          ..add('license', license))
        .toString();
  }
}

class AdminEmojiBuilder implements Builder<AdminEmoji, AdminEmojiBuilder> {
  _$AdminEmoji? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _shortcode;
  String? get shortcode => _$this._shortcode;
  set shortcode(String? shortcode) => _$this._shortcode = shortcode;

  String? _imageUrl;
  String? get imageUrl => _$this._imageUrl;
  set imageUrl(String? imageUrl) => _$this._imageUrl = imageUrl;

  int? _width;
  int? get width => _$this._width;
  set width(int? width) => _$this._width = width;

  int? _height;
  int? get height => _$this._height;
  set height(int? height) => _$this._height = height;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _category;
  String? get category => _$this._category;
  set category(String? category) => _$this._category = category;

  String? _license;
  String? get license => _$this._license;
  set license(String? license) => _$this._license = license;

  AdminEmojiBuilder() {
    AdminEmoji._defaults(this);
  }

  AdminEmojiBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _shortcode = $v.shortcode;
      _imageUrl = $v.imageUrl;
      _width = $v.width;
      _height = $v.height;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _name = $v.name;
      _category = $v.category;
      _license = $v.license;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminEmoji other) {
    _$v = other as _$AdminEmoji;
  }

  @override
  void update(void Function(AdminEmojiBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminEmoji build() => _build();

  _$AdminEmoji _build() {
    final _$result = _$v ??
        _$AdminEmoji._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'AdminEmoji', 'id'),
          shortcode: BuiltValueNullFieldError.checkNotNull(
              shortcode, r'AdminEmoji', 'shortcode'),
          imageUrl: BuiltValueNullFieldError.checkNotNull(
              imageUrl, r'AdminEmoji', 'imageUrl'),
          width: BuiltValueNullFieldError.checkNotNull(
              width, r'AdminEmoji', 'width'),
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'AdminEmoji', 'height'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'AdminEmoji', 'createdAt'),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt, r'AdminEmoji', 'updatedAt'),
          name: name,
          category: category,
          license: license,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
