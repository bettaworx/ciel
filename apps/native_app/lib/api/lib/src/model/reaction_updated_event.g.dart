// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reaction_updated_event.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ReactionUpdatedEventTypeEnum
    _$reactionUpdatedEventTypeEnum_reactionUpdated =
    const ReactionUpdatedEventTypeEnum._('reactionUpdated');

ReactionUpdatedEventTypeEnum _$reactionUpdatedEventTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'reactionUpdated':
      return _$reactionUpdatedEventTypeEnum_reactionUpdated;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ReactionUpdatedEventTypeEnum>
    _$reactionUpdatedEventTypeEnumValues =
    BuiltSet<ReactionUpdatedEventTypeEnum>(const <ReactionUpdatedEventTypeEnum>[
  _$reactionUpdatedEventTypeEnum_reactionUpdated,
]);

Serializer<ReactionUpdatedEventTypeEnum>
    _$reactionUpdatedEventTypeEnumSerializer =
    _$ReactionUpdatedEventTypeEnumSerializer();

class _$ReactionUpdatedEventTypeEnumSerializer
    implements PrimitiveSerializer<ReactionUpdatedEventTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'reactionUpdated': 'reaction_updated',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'reaction_updated': 'reactionUpdated',
  };

  @override
  final Iterable<Type> types = const <Type>[ReactionUpdatedEventTypeEnum];
  @override
  final String wireName = 'ReactionUpdatedEventTypeEnum';

  @override
  Object serialize(Serializers serializers, ReactionUpdatedEventTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ReactionUpdatedEventTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ReactionUpdatedEventTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ReactionUpdatedEvent extends ReactionUpdatedEvent {
  @override
  final ReactionUpdatedEventTypeEnum type;
  @override
  final ReactionCounts reactionCounts;

  factory _$ReactionUpdatedEvent(
          [void Function(ReactionUpdatedEventBuilder)? updates]) =>
      (ReactionUpdatedEventBuilder()..update(updates))._build();

  _$ReactionUpdatedEvent._({required this.type, required this.reactionCounts})
      : super._();
  @override
  ReactionUpdatedEvent rebuild(
          void Function(ReactionUpdatedEventBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReactionUpdatedEventBuilder toBuilder() =>
      ReactionUpdatedEventBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReactionUpdatedEvent &&
        type == other.type &&
        reactionCounts == other.reactionCounts;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, reactionCounts.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReactionUpdatedEvent')
          ..add('type', type)
          ..add('reactionCounts', reactionCounts))
        .toString();
  }
}

class ReactionUpdatedEventBuilder
    implements Builder<ReactionUpdatedEvent, ReactionUpdatedEventBuilder> {
  _$ReactionUpdatedEvent? _$v;

  ReactionUpdatedEventTypeEnum? _type;
  ReactionUpdatedEventTypeEnum? get type => _$this._type;
  set type(ReactionUpdatedEventTypeEnum? type) => _$this._type = type;

  ReactionCountsBuilder? _reactionCounts;
  ReactionCountsBuilder get reactionCounts =>
      _$this._reactionCounts ??= ReactionCountsBuilder();
  set reactionCounts(ReactionCountsBuilder? reactionCounts) =>
      _$this._reactionCounts = reactionCounts;

  ReactionUpdatedEventBuilder() {
    ReactionUpdatedEvent._defaults(this);
  }

  ReactionUpdatedEventBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _reactionCounts = $v.reactionCounts.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReactionUpdatedEvent other) {
    _$v = other as _$ReactionUpdatedEvent;
  }

  @override
  void update(void Function(ReactionUpdatedEventBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReactionUpdatedEvent build() => _build();

  _$ReactionUpdatedEvent _build() {
    _$ReactionUpdatedEvent _$result;
    try {
      _$result = _$v ??
          _$ReactionUpdatedEvent._(
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'ReactionUpdatedEvent', 'type'),
            reactionCounts: reactionCounts.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'reactionCounts';
        reactionCounts.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReactionUpdatedEvent', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
