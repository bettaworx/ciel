//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user.g.dart';

/// User
///
/// Properties:
/// * [id]
/// * [username]
/// * [createdAt]
/// * [displayName]
/// * [bio]
/// * [avatarUrl]
/// * [bannerUrl]
/// * [isAdmin] - Whether user has admin.all permission
/// * [termsVersion] - Version of Terms of Service accepted by user (0 = not accepted)
/// * [privacyVersion] - Version of Privacy Policy accepted by user (0 = not accepted)
/// * [termsAcceptedAt] - When user accepted Terms of Service
/// * [privacyAcceptedAt] - When user accepted Privacy Policy
@BuiltValue(instantiable: false)
abstract class User {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'username')
  String get username;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'displayName')
  String? get displayName;

  @BuiltValueField(wireName: r'bio')
  String? get bio;

  @BuiltValueField(wireName: r'avatarUrl')
  String? get avatarUrl;

  @BuiltValueField(wireName: r'bannerUrl')
  String? get bannerUrl;

  /// Whether user has admin.all permission
  @BuiltValueField(wireName: r'isAdmin')
  bool? get isAdmin;

  /// Version of Terms of Service accepted by user (0 = not accepted)
  @BuiltValueField(wireName: r'termsVersion')
  int? get termsVersion;

  /// Version of Privacy Policy accepted by user (0 = not accepted)
  @BuiltValueField(wireName: r'privacyVersion')
  int? get privacyVersion;

  /// When user accepted Terms of Service
  @BuiltValueField(wireName: r'termsAcceptedAt')
  DateTime? get termsAcceptedAt;

  /// When user accepted Privacy Policy
  @BuiltValueField(wireName: r'privacyAcceptedAt')
  DateTime? get privacyAcceptedAt;

  @BuiltValueSerializer(custom: true)
  static Serializer<User> get serializer => _$UserSerializer();
}

class _$UserSerializer implements PrimitiveSerializer<User> {
  @override
  final Iterable<Type> types = const [User];

  @override
  final String wireName = r'User';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    User object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'username';
    yield serializers.serialize(
      object.username,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.displayName != null) {
      yield r'displayName';
      yield serializers.serialize(
        object.displayName,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.bio != null) {
      yield r'bio';
      yield serializers.serialize(
        object.bio,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.avatarUrl != null) {
      yield r'avatarUrl';
      yield serializers.serialize(
        object.avatarUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.bannerUrl != null) {
      yield r'bannerUrl';
      yield serializers.serialize(
        object.bannerUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.isAdmin != null) {
      yield r'isAdmin';
      yield serializers.serialize(
        object.isAdmin,
        specifiedType: const FullType(bool),
      );
    }
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
    if (object.termsAcceptedAt != null) {
      yield r'termsAcceptedAt';
      yield serializers.serialize(
        object.termsAcceptedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    if (object.privacyAcceptedAt != null) {
      yield r'privacyAcceptedAt';
      yield serializers.serialize(
        object.privacyAcceptedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    User object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  @override
  User deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.deserialize(serialized, specifiedType: FullType($User))
        as $User;
  }
}

/// a concrete implementation of [User], since [User] is not instantiable
@BuiltValue(instantiable: true)
abstract class $User implements User, Built<$User, $UserBuilder> {
  $User._();

  factory $User([void Function($UserBuilder)? updates]) = _$$User;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults($UserBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<$User> get serializer => _$$UserSerializer();
}

class _$$UserSerializer implements PrimitiveSerializer<$User> {
  @override
  final Iterable<Type> types = const [$User, _$$User];

  @override
  final String wireName = r'$User';

  @override
  Object serialize(
    Serializers serializers,
    $User object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return serializers.serialize(object, specifiedType: FullType(User))!;
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'username':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.username = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.displayName = valueDes;
          break;
        case r'bio':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.bio = valueDes;
          break;
        case r'avatarUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.avatarUrl = valueDes;
          break;
        case r'bannerUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.bannerUrl = valueDes;
          break;
        case r'isAdmin':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isAdmin = valueDes;
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
        case r'termsAcceptedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.termsAcceptedAt = valueDes;
          break;
        case r'privacyAcceptedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.privacyAcceptedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  $User deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = $UserBuilder();
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
