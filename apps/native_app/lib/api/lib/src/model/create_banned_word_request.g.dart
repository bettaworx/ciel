// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_banned_word_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateBannedWordRequest extends CreateBannedWordRequest {
  @override
  final String pattern;
  @override
  final BannedWordAppliesTo appliesTo;
  @override
  final BannedWordSeverity severity;

  factory _$CreateBannedWordRequest(
          [void Function(CreateBannedWordRequestBuilder)? updates]) =>
      (CreateBannedWordRequestBuilder()..update(updates))._build();

  _$CreateBannedWordRequest._(
      {required this.pattern, required this.appliesTo, required this.severity})
      : super._();
  @override
  CreateBannedWordRequest rebuild(
          void Function(CreateBannedWordRequestBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateBannedWordRequestBuilder toBuilder() =>
      CreateBannedWordRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateBannedWordRequest &&
        pattern == other.pattern &&
        appliesTo == other.appliesTo &&
        severity == other.severity;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, pattern.hashCode);
    _$hash = $jc(_$hash, appliesTo.hashCode);
    _$hash = $jc(_$hash, severity.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateBannedWordRequest')
          ..add('pattern', pattern)
          ..add('appliesTo', appliesTo)
          ..add('severity', severity))
        .toString();
  }
}

class CreateBannedWordRequestBuilder
    implements
        Builder<CreateBannedWordRequest, CreateBannedWordRequestBuilder> {
  _$CreateBannedWordRequest? _$v;

  String? _pattern;
  String? get pattern => _$this._pattern;
  set pattern(String? pattern) => _$this._pattern = pattern;

  BannedWordAppliesTo? _appliesTo;
  BannedWordAppliesTo? get appliesTo => _$this._appliesTo;
  set appliesTo(BannedWordAppliesTo? appliesTo) =>
      _$this._appliesTo = appliesTo;

  BannedWordSeverity? _severity;
  BannedWordSeverity? get severity => _$this._severity;
  set severity(BannedWordSeverity? severity) => _$this._severity = severity;

  CreateBannedWordRequestBuilder() {
    CreateBannedWordRequest._defaults(this);
  }

  CreateBannedWordRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _pattern = $v.pattern;
      _appliesTo = $v.appliesTo;
      _severity = $v.severity;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateBannedWordRequest other) {
    _$v = other as _$CreateBannedWordRequest;
  }

  @override
  void update(void Function(CreateBannedWordRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateBannedWordRequest build() => _build();

  _$CreateBannedWordRequest _build() {
    final _$result = _$v ??
        _$CreateBannedWordRequest._(
          pattern: BuiltValueNullFieldError.checkNotNull(
              pattern, r'CreateBannedWordRequest', 'pattern'),
          appliesTo: BuiltValueNullFieldError.checkNotNull(
              appliesTo, r'CreateBannedWordRequest', 'appliesTo'),
          severity: BuiltValueNullFieldError.checkNotNull(
              severity, r'CreateBannedWordRequest', 'severity'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
