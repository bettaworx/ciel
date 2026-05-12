// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_created_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const PostCreatedEventTypeEnum _$postCreatedEventTypeEnum_postCreated =
    const PostCreatedEventTypeEnum._('postCreated');

PostCreatedEventTypeEnum _$postCreatedEventTypeEnumValueOf(String name) {
  switch (name) {
    case 'postCreated':
      return _$postCreatedEventTypeEnum_postCreated;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<PostCreatedEventTypeEnum> _$postCreatedEventTypeEnumValues =
    BuiltSet<PostCreatedEventTypeEnum>(const <PostCreatedEventTypeEnum>[
  _$postCreatedEventTypeEnum_postCreated,
]);

Serializer<PostCreatedEventTypeEnum> _$postCreatedEventTypeEnumSerializer =
    _$PostCreatedEventTypeEnumSerializer();

class _$PostCreatedEventTypeEnumSerializer
    implements PrimitiveSerializer<PostCreatedEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'postCreated': 'post_created',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'post_created': 'postCreated',
  };

  @override
  final Iterable<Type> types = const <Type>[PostCreatedEventTypeEnum];
  @override
  final String wireName = 'PostCreatedEventTypeEnum';

  @override
  Object serialize(Serializers serializers, PostCreatedEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  PostCreatedEventTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      PostCreatedEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$PostCreatedEvent extends PostCreatedEvent {
  @override
  final PostCreatedEventTypeEnum type;
  @override
  final Post post;

  factory _$PostCreatedEvent(
          [void Function(PostCreatedEventBuilder)? updates]) =>
      (PostCreatedEventBuilder()..update(updates))._build();

  _$PostCreatedEvent._({required this.type, required this.post}) : super._();
  @override
  PostCreatedEvent rebuild(void Function(PostCreatedEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PostCreatedEventBuilder toBuilder() =>
      PostCreatedEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PostCreatedEvent &&
        type == other.type &&
        post == other.post;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, post.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PostCreatedEvent')
          ..add('type', type)
          ..add('post', post))
        .toString();
  }
}

class PostCreatedEventBuilder
    implements Builder<PostCreatedEvent, PostCreatedEventBuilder> {
  _$PostCreatedEvent? _$v;

  PostCreatedEventTypeEnum? _type;
  PostCreatedEventTypeEnum? get type => _$this._type;
  set type(PostCreatedEventTypeEnum? type) => _$this._type = type;

  Post? _post;
  Post? get post => _$this._post;
  set post(Post? post) => _$this._post = post;

  PostCreatedEventBuilder() {
    PostCreatedEvent._defaults(this);
  }

  PostCreatedEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _post = $v.post;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PostCreatedEvent other) {
    _$v = other as _$PostCreatedEvent;
  }

  @override
  void update(void Function(PostCreatedEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PostCreatedEvent build() => _build();

  _$PostCreatedEvent _build() {
    final _$result = _$v ??
        _$PostCreatedEvent._(
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'PostCreatedEvent', 'type'),
          post: BuiltValueNullFieldError.checkNotNull(
              post, r'PostCreatedEvent', 'post'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
