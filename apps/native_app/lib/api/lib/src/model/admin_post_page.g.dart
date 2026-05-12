// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_post_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminPostPage extends AdminPostPage {
  @override
  final BuiltList<AdminPost> items;
  @override
  final int total;

  factory _$AdminPostPage([void Function(AdminPostPageBuilder)? updates]) =>
      (AdminPostPageBuilder()..update(updates))._build();

  _$AdminPostPage._({required this.items, required this.total}) : super._();
  @override
  AdminPostPage rebuild(void Function(AdminPostPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminPostPageBuilder toBuilder() => AdminPostPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminPostPage &&
        items == other.items &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminPostPage')
          ..add('items', items)
          ..add('total', total))
        .toString();
  }
}

class AdminPostPageBuilder
    implements Builder<AdminPostPage, AdminPostPageBuilder> {
  _$AdminPostPage? _$v;

  ListBuilder<AdminPost>? _items;
  ListBuilder<AdminPost> get items =>
      _$this._items ??= ListBuilder<AdminPost>();
  set items(ListBuilder<AdminPost>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  AdminPostPageBuilder() {
    AdminPostPage._defaults(this);
  }

  AdminPostPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminPostPage other) {
    _$v = other as _$AdminPostPage;
  }

  @override
  void update(void Function(AdminPostPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminPostPage build() => _build();

  _$AdminPostPage _build() {
    _$AdminPostPage _$result;
    try {
      _$result = _$v ??
          _$AdminPostPage._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'AdminPostPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AdminPostPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
