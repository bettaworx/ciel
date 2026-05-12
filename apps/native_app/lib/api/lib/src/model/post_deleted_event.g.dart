// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_deleted_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const PostDeletedEventTypeEnum _$postDeletedEventTypeEnum_postDeleted =
    const PostDeletedEventTypeEnum._('postDeleted');

PostDeletedEventTypeEnum _$postDeletedEventTypeEnumValueOf(String name) {
  switch (name) {
    case 'postDeleted':
      return _$postDeletedEventTypeEnum_postDeleted;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<PostDeletedEventTypeEnum> _$postDeletedEventTypeEnumValues =
    BuiltSet<PostDeletedEventTypeEnum>(const <PostDeletedEventTypeEnum>[
  _$postDeletedEventTypeEnum_postDeleted,
]);

Serializer<PostDeletedEventTypeEnum> _$postDeletedEventTypeEnumSerializer =
    _$PostDeletedEventTypeEnumSerializer();

class _$PostDeletedEventTypeEnumSerializer
    implements PrimitiveSerializer<PostDeletedEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'postDeleted': 'post_deleted',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'post_deleted': 'postDeleted',
  };

  @override
  final Iterable<Type> types = const <Type>[PostDeletedEventTypeEnum];
  @override
  final String wireName = 'PostDeletedEventTypeEnum';

  @override
  Object serialize(Serializers serializers, PostDeletedEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  PostDeletedEventTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      PostDeletedEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$PostDeletedEvent extends PostDeletedEvent {
  @override
  final PostDeletedEventTypeEnum type;
  @override
  final String postId;

  factory _$PostDeletedEvent(
          [void Function(PostDeletedEventBuilder)? updates]) =>
      (PostDeletedEventBuilder()..update(updates))._build();

  _$PostDeletedEvent._({required this.type, required this.postId}) : super._();
  @override
  PostDeletedEvent rebuild(void Function(PostDeletedEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PostDeletedEventBuilder toBuilder() =>
      PostDeletedEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PostDeletedEvent &&
        type == other.type &&
        postId == other.postId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, postId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PostDeletedEvent')
          ..add('type', type)
          ..add('postId', postId))
        .toString();
  }
}

class PostDeletedEventBuilder
    implements Builder<PostDeletedEvent, PostDeletedEventBuilder> {
  _$PostDeletedEvent? _$v;

  PostDeletedEventTypeEnum? _type;
  PostDeletedEventTypeEnum? get type => _$this._type;
  set type(PostDeletedEventTypeEnum? type) => _$this._type = type;

  String? _postId;
  String? get postId => _$this._postId;
  set postId(String? postId) => _$this._postId = postId;

  PostDeletedEventBuilder() {
    PostDeletedEvent._defaults(this);
  }

  PostDeletedEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _postId = $v.postId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PostDeletedEvent other) {
    _$v = other as _$PostDeletedEvent;
  }

  @override
  void update(void Function(PostDeletedEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PostDeletedEvent build() => _build();

  _$PostDeletedEvent _build() {
    final _$result = _$v ??
        _$PostDeletedEvent._(
          type: BuiltValueNullFieldError.checkNotNull(
              type, r'PostDeletedEvent', 'type'),
          postId: BuiltValueNullFieldError.checkNotNull(
              postId, r'PostDeletedEvent', 'postId'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
