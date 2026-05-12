// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reaction_users_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReactionUsersPage extends ReactionUsersPage {
  @override
  final String postId;
  @override
  final String emoji;
  @override
  final BuiltList<User> users;
  @override
  final String? nextCursor;

  factory _$ReactionUsersPage(
          [void Function(ReactionUsersPageBuilder)? updates]) =>
      (ReactionUsersPageBuilder()..update(updates))._build();

  _$ReactionUsersPage._(
      {required this.postId,
      required this.emoji,
      required this.users,
      this.nextCursor})
      : super._();
  @override
  ReactionUsersPage rebuild(void Function(ReactionUsersPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReactionUsersPageBuilder toBuilder() =>
      ReactionUsersPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReactionUsersPage &&
        postId == other.postId &&
        emoji == other.emoji &&
        users == other.users &&
        nextCursor == other.nextCursor;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, postId.hashCode);
    _$hash = $jc(_$hash, emoji.hashCode);
    _$hash = $jc(_$hash, users.hashCode);
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReactionUsersPage')
          ..add('postId', postId)
          ..add('emoji', emoji)
          ..add('users', users)
          ..add('nextCursor', nextCursor))
        .toString();
  }
}

class ReactionUsersPageBuilder
    implements Builder<ReactionUsersPage, ReactionUsersPageBuilder> {
  _$ReactionUsersPage? _$v;

  String? _postId;
  String? get postId => _$this._postId;
  set postId(String? postId) => _$this._postId = postId;

  String? _emoji;
  String? get emoji => _$this._emoji;
  set emoji(String? emoji) => _$this._emoji = emoji;

  ListBuilder<User>? _users;
  ListBuilder<User> get users => _$this._users ??= ListBuilder<User>();
  set users(ListBuilder<User>? users) => _$this._users = users;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  ReactionUsersPageBuilder() {
    ReactionUsersPage._defaults(this);
  }

  ReactionUsersPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _postId = $v.postId;
      _emoji = $v.emoji;
      _users = $v.users.toBuilder();
      _nextCursor = $v.nextCursor;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReactionUsersPage other) {
    _$v = other as _$ReactionUsersPage;
  }

  @override
  void update(void Function(ReactionUsersPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReactionUsersPage build() => _build();

  _$ReactionUsersPage _build() {
    _$ReactionUsersPage _$result;
    try {
      _$result = _$v ??
          _$ReactionUsersPage._(
            postId: BuiltValueNullFieldError.checkNotNull(
                postId, r'ReactionUsersPage', 'postId'),
            emoji: BuiltValueNullFieldError.checkNotNull(
                emoji, r'ReactionUsersPage', 'emoji'),
            users: users.build(),
            nextCursor: nextCursor,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'users';
        users.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReactionUsersPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
