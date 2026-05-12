// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'emoji_list_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$EmojiListResponse extends EmojiListResponse {
  @override
  final BuiltList<PublicEmoji> emojis;
  @override
  final int total;

  factory _$EmojiListResponse(
          [void Function(EmojiListResponseBuilder)? updates]) =>
      (EmojiListResponseBuilder()..update(updates))._build();

  _$EmojiListResponse._({required this.emojis, required this.total})
      : super._();
  @override
  EmojiListResponse rebuild(void Function(EmojiListResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  EmojiListResponseBuilder toBuilder() =>
      EmojiListResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is EmojiListResponse &&
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
    return (newBuiltValueToStringHelper(r'EmojiListResponse')
          ..add('emojis', emojis)
          ..add('total', total))
        .toString();
  }
}

class EmojiListResponseBuilder
    implements Builder<EmojiListResponse, EmojiListResponseBuilder> {
  _$EmojiListResponse? _$v;

  ListBuilder<PublicEmoji>? _emojis;
  ListBuilder<PublicEmoji> get emojis =>
      _$this._emojis ??= ListBuilder<PublicEmoji>();
  set emojis(ListBuilder<PublicEmoji>? emojis) => _$this._emojis = emojis;

  int? _total;
  int? get total => _$this._total;
  set total(int? total) => _$this._total = total;

  EmojiListResponseBuilder() {
    EmojiListResponse._defaults(this);
  }

  EmojiListResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _emojis = $v.emojis.toBuilder();
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(EmojiListResponse other) {
    _$v = other as _$EmojiListResponse;
  }

  @override
  void update(void Function(EmojiListResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  EmojiListResponse build() => _build();

  _$EmojiListResponse _build() {
    _$EmojiListResponse _$result;
    try {
      _$result = _$v ??
          _$EmojiListResponse._(
            emojis: emojis.build(),
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'EmojiListResponse', 'total'),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'emojis';
        emojis.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'EmojiListResponse', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
