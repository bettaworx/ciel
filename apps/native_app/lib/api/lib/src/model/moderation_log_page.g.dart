// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'moderation_log_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ModerationLogPage extends ModerationLogPage {
  @override
  final BuiltList<ModerationLog> items;
  @override
  final int total;

  factory _$ModerationLogPage(
          [void Function(ModerationLogPageBuilder)? updates]) =>
      (ModerationLogPageBuilder()..update(updates))._build();

  _$ModerationLogPage._({required this.items, required this.total}) : super._();
  @override
  ModerationLogPage rebuild(void Function(ModerationLogPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ModerationLogPageBuilder toBuilder() =>
      ModerationLogPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ModerationLogPage &&
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
    return (newBuiltValueToStringHelper(r'ModerationLogPage')
          ..add('items', items)
          ..add('total', total))
        .toString();
  }
}

class ModerationLogPageBuilder
    implements Builder<ModerationLogPage, ModerationLogPageBuilder> {
  _$ModerationLogPage? _$v;

  ListBuilder<ModerationLog>? _items;
  ListBuilder<ModerationLog> get items =>
      _$this._items ??= ListBuilder<ModerationLog>();
  set items(ListBuilder<ModerationLog>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  ModerationLogPageBuilder() {
    ModerationLogPage._defaults(this);
  }

  ModerationLogPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ModerationLogPage other) {
    _$v = other as _$ModerationLogPage;
  }

  @override
  void update(void Function(ModerationLogPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ModerationLogPage build() => _build();

  _$ModerationLogPage _build() {
    _$ModerationLogPage _$result;
    try {
      _$result = _$v ??
          _$ModerationLogPage._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'ModerationLogPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ModerationLogPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
