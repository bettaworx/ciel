// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

abstract class MediaBuilder {
  void replace(Media other);
  void update(void Function(MediaBuilder) updates);
  String? get id;
  set id(String? id);

  MediaType? get type;
  set type(MediaType? type);

  String? get url;
  set url(String? url);

  int? get width;
  set width(int? width);

  int? get height;
  set height(int? height);

  DateTime? get createdAt;
  set createdAt(DateTime? createdAt);

  double? get duration;
  set duration(double? duration);

  String? get thumbnailUrl;
  set thumbnailUrl(String? thumbnailUrl);
}

class _$$Media extends $Media {
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

  factory _$$Media([void Function($MediaBuilder)? updates]) =>
      ($MediaBuilder()..update(updates))._build();

  _$$Media._(
      {required this.id,
      required this.type,
      required this.url,
      required this.width,
      required this.height,
      required this.createdAt,
      this.duration,
      this.thumbnailUrl})
      : super._();
  @override
  $Media rebuild(void Function($MediaBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  $MediaBuilder toBuilder() => $MediaBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is $Media &&
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
    return (newBuiltValueToStringHelper(r'$Media')
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

class $MediaBuilder implements Builder<$Media, $MediaBuilder>, MediaBuilder {
  _$$Media? _$v;

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

  $MediaBuilder() {
    $Media._defaults(this);
  }

  $MediaBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
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
  void replace(covariant $Media other) {
    _$v = other as _$$Media;
  }

  @override
  void update(void Function($MediaBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  $Media build() => _build();

  _$$Media _build() {
    final _$result = _$v ??
        _$$Media._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'$Media', 'id'),
          type: BuiltValueNullFieldError.checkNotNull(type, r'$Media', 'type'),
          url: BuiltValueNullFieldError.checkNotNull(url, r'$Media', 'url'),
          width:
              BuiltValueNullFieldError.checkNotNull(width, r'$Media', 'width'),
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'$Media', 'height'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'$Media', 'createdAt'),
          duration: duration,
          thumbnailUrl: thumbnailUrl,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
