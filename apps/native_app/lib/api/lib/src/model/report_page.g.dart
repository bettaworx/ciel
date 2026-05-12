// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'report_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReportPage extends ReportPage {
  @override
  final BuiltList<Report> items;
  @override
  final int total;

  factory _$ReportPage([void Function(ReportPageBuilder)? updates]) =>
      (ReportPageBuilder()..update(updates))._build();

  _$ReportPage._({required this.items, required this.total}) : super._();
  @override
  ReportPage rebuild(void Function(ReportPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReportPageBuilder toBuilder() => ReportPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReportPage && items == other.items && total == other.total;
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
    return (newBuiltValueToStringHelper(r'ReportPage')
          ..add('items', items)
          ..add('total', total))
        .toString();
  }
}

class ReportPageBuilder implements Builder<ReportPage, ReportPageBuilder> {
  _$ReportPage? _$v;

  ListBuilder<Report>? _items;
  ListBuilder<Report> get items => _$this._items ??= ListBuilder<Report>();
  set items(ListBuilder<Report>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  ReportPageBuilder() {
    ReportPage._defaults(this);
  }

  ReportPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReportPage other) {
    _$v = other as _$ReportPage;
  }

  @override
  void update(void Function(ReportPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReportPage build() => _build();

  _$ReportPage _build() {
    _$ReportPage _$result;
    try {
      _$result = _$v ??
          _$ReportPage._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'ReportPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReportPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
