// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_emoji_list_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminEmojiListResponse extends AdminEmojiListResponse {
  @override
  final BuiltList<AdminEmoji> emojis;
  @override
  final int total;

  factory _$AdminEmojiListResponse(
          [void Function(AdminEmojiListResponseBuilder)? updates]) =>
      (AdminEmojiListResponseBuilder()..update(updates))._build();

  _$AdminEmojiListResponse._({required this.emojis, required this.total})
      : super._();
  @override
  AdminEmojiListResponse rebuild(
          void Function(AdminEmojiListResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminEmojiListResponseBuilder toBuilder() =>
      AdminEmojiListResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminEmojiListResponse &&
        emojis == other.emojis &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, emojis.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminEmojiListResponse')
          ..add('emojis', emojis)
          ..add('total', total))
        .toString();
  }
}

class AdminEmojiListResponseBuilder
    implements Builder<AdminEmojiListResponse, AdminEmojiListResponseBuilder> {
  _$AdminEmojiListResponse? _$v;

  ListBuilder<AdminEmoji>? _emojis;
  ListBuilder<AdminEmoji> get emojis =>
      _$this._emojis ??= ListBuilder<AdminEmoji>();
  set emojis(ListBuilder<AdminEmoji>? emojis) => _$this._emojis = emojis;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  AdminEmojiListResponseBuilder() {
    AdminEmojiListResponse._defaults(this);
  }

  AdminEmojiListResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _emojis = $v.emojis.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminEmojiListResponse other) {
    _$v = other as _$AdminEmojiListResponse;
  }

  @override
  void update(void Function(AdminEmojiListResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminEmojiListResponse build() => _build();

  _$AdminEmojiListResponse _build() {
    _$AdminEmojiListResponse _$result;
    try {
      _$result = _$v ??
          _$AdminEmojiListResponse._(
            emojis: emojis.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'AdminEmojiListResponse', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'emojis';
        emojis.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AdminEmojiListResponse', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
