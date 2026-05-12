//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_settings.g.dart';

/// ServerSettings
///
/// Properties:
/// * [signupEnabled]
/// * [termsVersion] - Current version of Terms of Service
/// * [privacyVersion] - Current version of Privacy Policy
@BuiltValue()
abstract class ServerSettings
    implements Built<ServerSettings, ServerSettingsBuilder> {
  @BuiltValueField(wireName: r'signupEnabled')
  bool get signupEnabled;

  /// Current version of Terms of Service
  @BuiltValueField(wireName: r'termsVersion')
  int? get termsVersion;

  /// Current version of Privacy Policy
  @BuiltValueField(wireName: r'privacyVersion')
  int? get privacyVersion;

  ServerSettings._();

  factory ServerSettings([void updates(ServerSettingsBuilder b)]) =
      _$ServerSettings;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerSettingsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerSettings> get serializer =>
      _$ServerSettingsSerializer();
}

class _$ServerSettingsSerializer
    implements PrimitiveSerializer<ServerSettings> {
  @override
  final Iterable<Type> types = const [ServerSettings, _$ServerSettings];

  @override
  final String wireName = r'ServerSettings';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerSettings object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'signupEnabled';
    yield serializers.serialize(
      object.signupEnabled,
      specifiedType: const FullType(bool),
    );
    if (object.termsVersion != null) {
      yield r'termsVersion';
      yield serializers.serialize(
        object.termsVersion,
        specifiedType: const FullType(int),
      );
    }
    if (object.privacyVersion != null) {
      yield r'privacyVersion';
      yield serializers.serialize(
        object.privacyVersion,
        specifiedType: const FullType(int),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ServerSettings object, {
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
    required ServerSettingsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'signupEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.signupEnabled = valueDes;
          break;
        case r'termsVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.termsVersion = valueDes;
          break;
        case r'privacyVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.privacyVersion = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ServerSettings deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerSettingsBuilder();
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
