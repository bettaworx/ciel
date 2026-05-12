// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'react_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReactRequest extends ReactRequest {
  @override
  final String emoji;

  factory _$ReactRequest([void Function(ReactRequestBuilder)? updates]) =>
      (ReactRequestBuilder()..update(updates))._build();

  _$ReactRequest._({required this.emoji}) : super._();
  @override
  ReactRequest rebuild(void Function(ReactRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReactRequestBuilder toBuilder() => ReactRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReactRequest && emoji == other.emoji;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, emoji.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReactRequest')..add('emoji', emoji))
        .toString();
  }
}

class ReactRequestBuilder
    implements Builder<ReactRequest, ReactRequestBuilder> {
  _$ReactRequest? _$v;

  String? _emoji;
  String? get emoji => _$this._emoji;
  set emoji(String? emoji) => _$this._emoji = emoji;

  ReactRequestBuilder() {
    ReactRequest._defaults(this);
  }

  ReactRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _emoji = $v.emoji;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReactRequest other) {
    _$v = other as _$ReactRequest;
  }

  @override
  void update(void Function(ReactRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReactRequest build() => _build();

  _$ReactRequest _build() {
    final _$result = _$v ??
        _$ReactRequest._(
          emoji: BuiltValueNullFieldError.checkNotNull(
              emoji, r'ReactRequest', 'emoji'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
