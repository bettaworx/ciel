//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/user.dart';
import 'package:ciel_api/src/model/user_stats.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_user.g.dart';

/// AdminUser
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
/// * [stats]
@BuiltValue()
abstract class AdminUser implements User, Built<AdminUser, AdminUserBuilder> {
  @BuiltValueField(wireName: r'stats')
  UserStats? get stats;

  AdminUser._();

  factory AdminUser([void updates(AdminUserBuilder b)]) = _$AdminUser;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminUserBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminUser> get serializer => _$AdminUserSerializer();
}

class _$AdminUserSerializer implements PrimitiveSerializer<AdminUser> {
  @override
  final Iterable<Type> types = const [AdminUser, _$AdminUser];

  @override
  final String wireName = r'AdminUser';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminUser object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.avatarUrl != null) {
      yield r'avatarUrl';
      yield serializers.serialize(
        object.avatarUrl,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.privacyAcceptedAt != null) {
      yield r'privacyAcceptedAt';
      yield serializers.serialize(
        object.privacyAcceptedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    if (object.displayName != null) {
      yield r'displayName';
      yield serializers.serialize(
        object.displayName,
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
    if (object.bio != null) {
      yield r'bio';
      yield serializers.serialize(
        object.bio,
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
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.termsVersion != null) {
      yield r'termsVersion';
      yield serializers.serialize(
        object.termsVersion,
        specifiedType: const FullType(int),
      );
    }
    if (object.stats != null) {
      yield r'stats';
      yield serializers.serialize(
        object.stats,
        specifiedType: const FullType(UserStats),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    if (object.termsAcceptedAt != null) {
      yield r'termsAcceptedAt';
      yield serializers.serialize(
        object.termsAcceptedAt,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    yield r'username';
    yield serializers.serialize(
      object.username,
      specifiedType: const FullType(String),
    );
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
    AdminUser object, {
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
    required AdminUserBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'avatarUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.avatarUrl = valueDes;
          break;
        case r'privacyAcceptedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.privacyAcceptedAt = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.displayName = valueDes;
          break;
        case r'bannerUrl':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.bannerUrl = valueDes;
          break;
        case r'bio':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.bio = valueDes;
          break;
        case r'isAdmin':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isAdmin = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'termsVersion':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.termsVersion = valueDes;
          break;
        case r'stats':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserStats),
          ) as UserStats;
          result.stats.replace(valueDes);
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'termsAcceptedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.termsAcceptedAt = valueDes;
          break;
        case r'username':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.username = valueDes;
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
  AdminUser deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminUserBuilder();
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
