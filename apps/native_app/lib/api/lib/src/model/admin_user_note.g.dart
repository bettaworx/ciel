// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user_note.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUserNote extends AdminUserNote {
  @override
  final String id;
  @override
  final String userId;
  @override
  final String content;
  @override
  final String createdBy;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final String? updatedBy;

  factory _$AdminUserNote([void Function(AdminUserNoteBuilder)? updates]) =>
      (AdminUserNoteBuilder()..update(updates))._build();

  _$AdminUserNote._(
      {required this.id,
      required this.userId,
      required this.content,
      required this.createdBy,
      required this.createdAt,
      required this.updatedAt,
      this.updatedBy})
      : super._();
  @override
  AdminUserNote rebuild(void Function(AdminUserNoteBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUserNoteBuilder toBuilder() => AdminUserNoteBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUserNote &&
        id == other.id &&
        userId == other.userId &&
        content == other.content &&
        createdBy == other.createdBy &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        updatedBy == other.updatedBy;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, userId.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jc(_$hash, createdBy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, updatedBy.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminUserNote')
          ..add('id', id)
          ..add('userId', userId)
          ..add('content', content)
          ..add('createdBy', createdBy)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('updatedBy', updatedBy))
        .toString();
  }
}

class AdminUserNoteBuilder
    implements Builder<AdminUserNote, AdminUserNoteBuilder> {
  _$AdminUserNote? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _userId;
  String? get userId => _$this._userId;
  set userId(String? userId) => _$this._userId = userId;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  String? _createdBy;
  String? get createdBy => _$this._createdBy;
  set createdBy(String? createdBy) => _$this._createdBy = createdBy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  String? _updatedBy;
  String? get updatedBy => _$this._updatedBy;
  set updatedBy(String? updatedBy) => _$this._updatedBy = updatedBy;

  AdminUserNoteBuilder() {
    AdminUserNote._defaults(this);
  }

  AdminUserNoteBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _userId = $v.userId;
      _content = $v.content;
      _createdBy = $v.createdBy;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _updatedBy = $v.updatedBy;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUserNote other) {
    _$v = other as _$AdminUserNote;
  }

  @override
  void update(void Function(AdminUserNoteBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUserNote build() => _build();

  _$AdminUserNote _build() {
    final _$result = _$v ??
        _$AdminUserNote._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'AdminUserNote', 'id'),
          userId: BuiltValueNullFieldError.checkNotNull(
              userId, r'AdminUserNote', 'userId'),
          content: BuiltValueNullFieldError.checkNotNull(
              content, r'AdminUserNote', 'content'),
          createdBy: BuiltValueNullFieldError.checkNotNull(
              createdBy, r'AdminUserNote', 'createdBy'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'AdminUserNote', 'createdAt'),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt, r'AdminUserNote', 'updatedAt'),
          updatedBy: updatedBy,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
