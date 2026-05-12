// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agreement_document_page.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AgreementDocumentPage extends AgreementDocumentPage {
  @override
  final BuiltList<AgreementDocument> items;
  @override
  final int total;

  factory _$AgreementDocumentPage(
          [void Function(AgreementDocumentPageBuilder)? updates]) =>
      (AgreementDocumentPageBuilder()..update(updates))._build();

  _$AgreementDocumentPage._({required this.items, required this.total})
      : super._();
  @override
  AgreementDocumentPage rebuild(
          void Function(AgreementDocumentPageBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AgreementDocumentPageBuilder toBuilder() =>
      AgreementDocumentPageBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AgreementDocumentPage &&
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
    return (newBuiltValueToStringHelper(r'AgreementDocumentPage')
          ..add('items', items)
          ..add('total', total))
        .toString();
  }
}

class AgreementDocumentPageBuilder
    implements Builder<AgreementDocumentPage, AgreementDocumentPageBuilder> {
  _$AgreementDocumentPage? _$v;

  ListBuilder<AgreementDocument>? _items;
  ListBuilder<AgreementDocument> get items =>
      _$this._items ??= ListBuilder<AgreementDocument>();
  set items(ListBuilder<AgreementDocument>? items) => _$this._items = items;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  AgreementDocumentPageBuilder() {
    AgreementDocumentPage._defaults(this);
  }

  AgreementDocumentPageBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AgreementDocumentPage other) {
    _$v = other as _$AgreementDocumentPage;
  }

  @override
  void update(void Function(AgreementDocumentPageBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AgreementDocumentPage build() => _build();

  _$AgreementDocumentPage _build() {
    _$AgreementDocumentPage _$result;
    try {
      _$result = _$v ??
          _$AgreementDocumentPage._(
            items: items.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'AgreementDocumentPage', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AgreementDocumentPage', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
