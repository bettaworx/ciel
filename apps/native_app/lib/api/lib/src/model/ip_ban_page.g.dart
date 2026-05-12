// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ip_ban_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$IPBanPage extends IPBanPage {
  @override
  final BuiltList<IPBan> items;
  @override
  final int total;

  factory _$IPBanPage([void Function(IPBanPageBuilder)? updates]) =>
      (IPBanPageBuilder()..update(updates))._build();

  _$IPBanPage._({required this.items, required this.total}) : super._();
  @override
  IPBanPage rebuild(void Function(IPBanPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  IPBanPageBuilder toBuilder() => IPBanPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is IPBanPage && items == other.items && total == other.total;
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
    return (newBuiltValueToStringHelper(r'IPBanPage')
          ..add('items', items)
          ..add('total', total))
        .toString();
  }
}

class IPBanPageBuilder implements Builder<IPBanPage, IPBanPageBuilder> {
  _$IPBanPage? _$v;

  ListBuilder<IPBan>? _items;
  ListBuilder<IPBan> get items => _$this._items ??= ListBuilder<IPBan>();
  set items(ListBuilder<IPBan>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  IPBanPageBuilder() {
    IPBanPage._defaults(this);
  }

  IPBanPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(IPBanPage other) {
    _$v = other as _$IPBanPage;
  }

  @override
  void update(void Function(IPBanPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  IPBanPage build() => _build();

  _$IPBanPage _build() {
    _$IPBanPage _$result;
    try {
      _$result = _$v ??
          _$IPBanPage._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'IPBanPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'IPBanPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
