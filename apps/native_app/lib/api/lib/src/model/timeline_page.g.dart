// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'timeline_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TimelinePage extends TimelinePage {
  @override
  final BuiltList<Post> items;
  @override
  final String? nextCursor;

  factory _$TimelinePage([void Function(TimelinePageBuilder)? updates]) =>
      (TimelinePageBuilder()..update(updates))._build();

  _$TimelinePage._({required this.items, this.nextCursor}) : super._();
  @override
  TimelinePage rebuild(void Function(TimelinePageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TimelinePageBuilder toBuilder() => TimelinePageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TimelinePage &&
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
    return (newBuiltValueToStringHelper(r'TimelinePage')
          ..add('items', items)
          ..add('nextCursor', nextCursor))
        .toString();
  }
}

class TimelinePageBuilder
    implements Builder<TimelinePage, TimelinePageBuilder> {
  _$TimelinePage? _$v;

  ListBuilder<Post>? _items;
  ListBuilder<Post> get items => _$this._items ??= ListBuilder<Post>();
  set items(ListBuilder<Post>? items) => _$this._items = items;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  TimelinePageBuilder() {
    TimelinePage._defaults(this);
  }

  TimelinePageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _nextCursor = $v.nextCursor;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TimelinePage other) {
    _$v = other as _$TimelinePage;
  }

  @override
  void update(void Function(TimelinePageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TimelinePage build() => _build();

  _$TimelinePage _build() {
    _$TimelinePage _$result;
    try {
      _$result = _$v ??
          _$TimelinePage._(
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
            r'TimelinePage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
