// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUserPage extends AdminUserPage {
  @override
  final BuiltList<AdminUser> items;
  @override
  final int total;

  factory _$AdminUserPage([void Function(AdminUserPageBuilder)? updates]) =>
      (AdminUserPageBuilder()..update(updates))._build();

  _$AdminUserPage._({required this.items, required this.total}) : super._();
  @override
  AdminUserPage rebuild(void Function(AdminUserPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUserPageBuilder toBuilder() => AdminUserPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUserPage &&
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
    return (newBuiltValueToStringHelper(r'AdminUserPage')
          ..add('items', items)
          ..add('total', total))
        .toString();
  }
}

class AdminUserPageBuilder
    implements Builder<AdminUserPage, AdminUserPageBuilder> {
  _$AdminUserPage? _$v;

  ListBuilder<AdminUser>? _items;
  ListBuilder<AdminUser> get items =>
      _$this._items ??= ListBuilder<AdminUser>();
  set items(ListBuilder<AdminUser>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  AdminUserPageBuilder() {
    AdminUserPage._defaults(this);
  }

  AdminUserPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUserPage other) {
    _$v = other as _$AdminUserPage;
  }

  @override
  void update(void Function(AdminUserPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUserPage build() => _build();

  _$AdminUserPage _build() {
    _$AdminUserPage _$result;
    try {
      _$result = _$v ??
          _$AdminUserPage._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'AdminUserPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AdminUserPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
