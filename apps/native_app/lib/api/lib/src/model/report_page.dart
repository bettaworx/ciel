//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/report.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'report_page.g.dart';

/// ReportPage
///
/// Properties:
/// * [items]
/// * [total] - Total number of reports matching the filters
@BuiltValue()
abstract class ReportPage implements Built<ReportPage, ReportPageBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<Report> get items;

  /// Total number of reports matching the filters
  @BuiltValueField(wireName: r'total')
  int get total;

  ReportPage._();

  factory ReportPage([void updates(ReportPageBuilder b)]) = _$ReportPage;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReportPageBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReportPage> get serializer => _$ReportPageSerializer();
}

class _$ReportPageSerializer implements PrimitiveSerializer<ReportPage> {
  @override
  final Iterable<Type> types = const [ReportPage, _$ReportPage];

  @override
  final String wireName = r'ReportPage';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReportPage object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(Report)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReportPage object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReportPageBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(Report)]),
          ) as BuiltList<Report>;
          result.items.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReportPage deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReportPageBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}
