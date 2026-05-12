// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_posts_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UserPostsPage extends UserPostsPage {
  @override
  final BuiltList<Post> items;
  @override
  final String? nextCursor;

  factory _$UserPostsPage([void Function(UserPostsPageBuilder)? updates]) =>
      (UserPostsPageBuilder()..update(updates))._build();

  _$UserPostsPage._({required this.items, this.nextCursor}) : super._();
  @override
  UserPostsPage rebuild(void Function(UserPostsPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserPostsPageBuilder toBuilder() => UserPostsPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserPostsPage &&
        items == other.items &&
        nextCursor == other.nextCursor;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserPostsPage')
          ..add('items', items)
          ..add('nextCursor', nextCursor))
        .toString();
  }
}

class UserPostsPageBuilder
    implements Builder<UserPostsPage, UserPostsPageBuilder> {
  _$UserPostsPage? _$v;

  ListBuilder<Post>? _items;
  ListBuilder<Post> get items => _$this._items ??= ListBuilder<Post>();
  set items(ListBuilder<Post>? items) => _$this._items = items;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  UserPostsPageBuilder() {
    UserPostsPage._defaults(this);
  }

  UserPostsPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _nextCursor = $v.nextCursor;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserPostsPage other) {
    _$v = other as _$UserPostsPage;
  }

  @override
  void update(void Function(UserPostsPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserPostsPage build() => _build();

  _$UserPostsPage _build() {
    _$UserPostsPage _$result;
    try {
      _$result = _$v ??
          _$UserPostsPage._(
            items: items.build(),
            nextCursor: nextCursor,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UserPostsPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
