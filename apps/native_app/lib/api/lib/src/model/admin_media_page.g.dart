// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_media_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminMediaPage extends AdminMediaPage {
  @override
  final BuiltList<AdminMedia> items;
  @override
  final int total;

  factory _$AdminMediaPage([void Function(AdminMediaPageBuilder)? updates]) =>
      (AdminMediaPageBuilder()..update(updates))._build();

  _$AdminMediaPage._({required this.items, required this.total}) : super._();
  @override
  AdminMediaPage rebuild(void Function(AdminMediaPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminMediaPageBuilder toBuilder() => AdminMediaPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminMediaPage &&
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
    return (newBuiltValueToStringHelper(r'AdminMediaPage')
          ..add('items', items)
          ..add('total', total))
        .toString();
  }
}

class AdminMediaPageBuilder
    implements Builder<AdminMediaPage, AdminMediaPageBuilder> {
  _$AdminMediaPage? _$v;

  ListBuilder<AdminMedia>? _items;
  ListBuilder<AdminMedia> get items =>
      _$this._items ??= ListBuilder<AdminMedia>();
  set items(ListBuilder<AdminMedia>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  AdminMediaPageBuilder() {
    AdminMediaPage._defaults(this);
  }

  AdminMediaPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminMediaPage other) {
    _$v = other as _$AdminMediaPage;
  }

  @override
  void update(void Function(AdminMediaPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminMediaPage build() => _build();

  _$AdminMediaPage _build() {
    _$AdminMediaPage _$result;
    try {
      _$result = _$v ??
          _$AdminMediaPage._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'AdminMediaPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AdminMediaPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
