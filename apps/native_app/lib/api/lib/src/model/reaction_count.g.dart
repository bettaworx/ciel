// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reaction_count.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReactionCount extends ReactionCount {
  @override
  final String emoji;
  @override
  final int count;
  @override
  final bool reactedByCurrentUser;

  factory _$ReactionCount([void Function(ReactionCountBuilder)? updates]) =>
      (ReactionCountBuilder()..update(updates))._build();

  _$ReactionCount._(
      {required this.emoji,
      required this.count,
      required this.reactedByCurrentUser})
      : super._();
  @override
  ReactionCount rebuild(void Function(ReactionCountBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReactionCountBuilder toBuilder() => ReactionCountBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReactionCount &&
        emoji == other.emoji &&
        count == other.count &&
        reactedByCurrentUser == other.reactedByCurrentUser;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, emoji.hashCode);
    _$hash = $jc(_$hash, count.hashCode);
    _$hash = $jc(_$hash, reactedByCurrentUser.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReactionCount')
          ..add('emoji', emoji)
          ..add('count', count)
          ..add('reactedByCurrentUser', reactedByCurrentUser))
        .toString();
  }
}

class ReactionCountBuilder
    implements Builder<ReactionCount, ReactionCountBuilder> {
  _$ReactionCount? _$v;

  String? _emoji;
  String? get emoji => _$this._emoji;
  set emoji(String? emoji) => _$this._emoji = emoji;

  int? _count;
  int? get count => _$this._count;
  set count(int? count) => _$this._count = count;

  bool? _reactedByCurrentUser;
  bool? get reactedByCurrentUser => _$this._reactedByCurrentUser;
  set reactedByCurrentUser(bool? reactedByCurrentUser) =>
      _$this._reactedByCurrentUser = reactedByCurrentUser;

  ReactionCountBuilder() {
    ReactionCount._defaults(this);
  }

  ReactionCountBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _emoji = $v.emoji;
      _count = $v.count;
      _reactedByCurrentUser = $v.reactedByCurrentUser;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReactionCount other) {
    _$v = other as _$ReactionCount;
  }

  @override
  void update(void Function(ReactionCountBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReactionCount build() => _build();

  _$ReactionCount _build() {
    final _$result = _$v ??
        _$ReactionCount._(
          emoji: BuiltValueNullFieldError.checkNotNull(
              emoji, r'ReactionCount', 'emoji'),
          count: BuiltValueNullFieldError.checkNotNull(
              count, r'ReactionCount', 'count'),
          reactedByCurrentUser: BuiltValueNullFieldError.checkNotNull(
              reactedByCurrentUser, r'ReactionCount', 'reactedByCurrentUser'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
