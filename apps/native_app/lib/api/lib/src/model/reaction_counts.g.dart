// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reaction_counts.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReactionCounts extends ReactionCounts {
  @override
  final String postId;
  @override
  final BuiltList<ReactionCount> reactions;

  factory _$ReactionCounts([void Function(ReactionCountsBuilder)? updates]) =>
      (ReactionCountsBuilder()..update(updates))._build();

  _$ReactionCounts._({required this.postId, required this.reactions})
      : super._();
  @override
  ReactionCounts rebuild(void Function(ReactionCountsBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReactionCountsBuilder toBuilder() => ReactionCountsBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReactionCounts &&
        postId == other.postId &&
        reactions == other.reactions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, postId.hashCode);
    _$hash = $jc(_$hash, reactions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReactionCounts')
          ..add('postId', postId)
          ..add('reactions', reactions))
        .toString();
  }
}

class ReactionCountsBuilder
    implements Builder<ReactionCounts, ReactionCountsBuilder> {
  _$ReactionCounts? _$v;

  String? _postId;
  String? get postId => _$this._postId;
  set postId(String? postId) => _$this._postId = postId;

  ListBuilder<ReactionCount>? _reactions;
  ListBuilder<ReactionCount> get reactions =>
      _$this._reactions ??= ListBuilder<ReactionCount>();
  set reactions(ListBuilder<ReactionCount>? reactions) =>
      _$this._reactions = reactions;

  ReactionCountsBuilder() {
    ReactionCounts._defaults(this);
  }

  ReactionCountsBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _postId = $v.postId;
      _reactions = $v.reactions.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReactionCounts other) {
    _$v = other as _$ReactionCounts;
  }

  @override
  void update(void Function(ReactionCountsBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReactionCounts build() => _build();

  _$ReactionCounts _build() {
    _$ReactionCounts _$result;
    try {
      _$result = _$v ??
          _$ReactionCounts._(
            postId: BuiltValueNullFieldError.checkNotNull(
                postId, r'ReactionCounts', 'postId'),
            reactions: reactions.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'reactions';
        reactions.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReactionCounts', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
