//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'moderation_action.g.dart';

class ModerationAction extends EnumClass {
  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'ban_user')
  static const ModerationAction banUser = _$banUser;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'unban_user')
  static const ModerationAction unbanUser = _$unbanUser;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'mute_user')
  static const ModerationAction muteUser = _$muteUser;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'unmute_user')
  static const ModerationAction unmuteUser = _$unmuteUser;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_post')
  static const ModerationAction deletePost = _$deletePost;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'hide_post')
  static const ModerationAction hidePost = _$hidePost;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'unhide_post')
  static const ModerationAction unhidePost = _$unhidePost;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_media')
  static const ModerationAction deleteMedia = _$deleteMedia;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_user_avatar')
  static const ModerationAction deleteUserAvatar = _$deleteUserAvatar;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_user_display_name')
  static const ModerationAction deleteUserDisplayName = _$deleteUserDisplayName;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_user_bio')
  static const ModerationAction deleteUserBio = _$deleteUserBio;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'create_banned_word')
  static const ModerationAction createBannedWord = _$createBannedWord;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_banned_word')
  static const ModerationAction deleteBannedWord = _$deleteBannedWord;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'create_banned_image')
  static const ModerationAction createBannedImage = _$createBannedImage;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_banned_image')
  static const ModerationAction deleteBannedImage = _$deleteBannedImage;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'create_ip_ban')
  static const ModerationAction createIpBan = _$createIpBan;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'delete_ip_ban')
  static const ModerationAction deleteIpBan = _$deleteIpBan;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'resolve_report')
  static const ModerationAction resolveReport = _$resolveReport;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'dismiss_report')
  static const ModerationAction dismissReport = _$dismissReport;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'publish_agreement')
  static const ModerationAction publishAgreement = _$publishAgreement;

  /// Type of moderation action performed
  @BuiltValueEnumConst(wireName: r'other')
  static const ModerationAction other = _$other;

  static Serializer<ModerationAction> get serializer =>
      _$moderationActionSerializer;

  const ModerationAction._(String name) : super(name);

  static BuiltSet<ModerationAction> get values => _$values;
  static ModerationAction valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ModerationActionMixin = Object with _$ModerationActionMixin;
