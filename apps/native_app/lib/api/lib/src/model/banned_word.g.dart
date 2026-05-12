// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'banned_word.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BannedWord extends BannedWord {
  @override
  final String id;
  @override
  final String pattern;
  @override
  final BannedWordAppliesTo appliesTo;
  @override
  final BannedWordSeverity severity;
  @override
  final String createdBy;
  @override
  final DateTime createdAt;

  factory _$BannedWord([void Function(BannedWordBuilder)? updates]) =>
      (BannedWordBuilder()..update(updates))._build();

  _$BannedWord._(
      {required this.id,
      required this.pattern,
      required this.appliesTo,
      required this.severity,
      required this.createdBy,
      required this.createdAt})
      : super._();
  @override
  BannedWord rebuild(void Function(BannedWordBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BannedWordBuilder toBuilder() => BannedWordBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BannedWord &&
        id == other.id &&
        pattern == other.pattern &&
        appliesTo == other.appliesTo &&
        severity == other.severity &&
        createdBy == other.createdBy &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, pattern.hashCode);
    _$hash = $jc(_$hash, appliesTo.hashCode);
    _$hash = $jc(_$hash, severity.hashCode);
    _$hash = $jc(_$hash, createdBy.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BannedWord')
          ..add('id', id)
          ..add('pattern', pattern)
          ..add('appliesTo', appliesTo)
          ..add('severity', severity)
          ..add('createdBy', createdBy)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class BannedWordBuilder implements Builder<BannedWord, BannedWordBuilder> {
  _$BannedWord? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

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

  String? _createdBy;
  String? get createdBy => _$this._createdBy;
  set createdBy(String? createdBy) => _$this._createdBy = createdBy;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  BannedWordBuilder() {
    BannedWord._defaults(this);
  }

  BannedWordBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _pattern = $v.pattern;
      _appliesTo = $v.appliesTo;
      _severity = $v.severity;
      _createdBy = $v.createdBy;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BannedWord other) {
    _$v = other as _$BannedWord;
  }

  @override
  void update(void Function(BannedWordBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BannedWord build() => _build();

  _$BannedWord _build() {
    final _$result = _$v ??
        _$BannedWord._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'BannedWord', 'id'),
          pattern: BuiltValueNullFieldError.checkNotNull(
              pattern, r'BannedWord', 'pattern'),
          appliesTo: BuiltValueNullFieldError.checkNotNull(
              appliesTo, r'BannedWord', 'appliesTo'),
          severity: BuiltValueNullFieldError.checkNotNull(
              severity, r'BannedWord', 'severity'),
          createdBy: BuiltValueNullFieldError.checkNotNull(
              createdBy, r'BannedWord', 'createdBy'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'BannedWord', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
