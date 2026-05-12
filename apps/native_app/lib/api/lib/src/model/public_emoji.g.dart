// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'public_emoji.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PublicEmoji extends PublicEmoji {
  @override
  final String shortcode;
  @override
  final String imageUrl;
  @override
  final String? name;
  @override
  final String? category;
  @override
  final String? license;

  factory _$PublicEmoji([void Function(PublicEmojiBuilder)? updates]) =>
      (PublicEmojiBuilder()..update(updates))._build();

  _$PublicEmoji._(
      {required this.shortcode,
      required this.imageUrl,
      this.name,
      this.category,
      this.license})
      : super._();
  @override
  PublicEmoji rebuild(void Function(PublicEmojiBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PublicEmojiBuilder toBuilder() => PublicEmojiBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PublicEmoji &&
        shortcode == other.shortcode &&
        imageUrl == other.imageUrl &&
        name == other.name &&
        category == other.category &&
        license == other.license;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, shortcode.hashCode);
    _$hash = $jc(_$hash, imageUrl.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, category.hashCode);
    _$hash = $jc(_$hash, license.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PublicEmoji')
          ..add('shortcode', shortcode)
          ..add('imageUrl', imageUrl)
          ..add('name', name)
          ..add('category', category)
          ..add('license', license))
        .toString();
  }
}

class PublicEmojiBuilder implements Builder<PublicEmoji, PublicEmojiBuilder> {
  _$PublicEmoji? _$v;

  String? _shortcode;
  String? get shortcode => _$this._shortcode;
  set shortcode(String? shortcode) => _$this._shortcode = shortcode;

  String? _imageUrl;
  String? get imageUrl => _$this._imageUrl;
  set imageUrl(String? imageUrl) => _$this._imageUrl = imageUrl;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _category;
  String? get category => _$this._category;
  set category(String? category) => _$this._category = category;

  String? _license;
  String? get license => _$this._license;
  set license(String? license) => _$this._license = license;

  PublicEmojiBuilder() {
    PublicEmoji._defaults(this);
  }

  PublicEmojiBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _shortcode = $v.shortcode;
      _imageUrl = $v.imageUrl;
      _name = $v.name;
      _category = $v.category;
      _license = $v.license;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PublicEmoji other) {
    _$v = other as _$PublicEmoji;
  }

  @override
  void update(void Function(PublicEmojiBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PublicEmoji build() => _build();

  _$PublicEmoji _build() {
    final _$result = _$v ??
        _$PublicEmoji._(
          shortcode: BuiltValueNullFieldError.checkNotNull(
              shortcode, r'PublicEmoji', 'shortcode'),
          imageUrl: BuiltValueNullFieldError.checkNotNull(
              imageUrl, r'PublicEmoji', 'imageUrl'),
          name: name,
          category: category,
          license: license,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
