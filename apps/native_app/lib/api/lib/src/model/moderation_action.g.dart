// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'moderation_action.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ModerationAction _$banUser = const ModerationAction._('banUser');
const ModerationAction _$unbanUser = const ModerationAction._('unbanUser');
const ModerationAction _$muteUser = const ModerationAction._('muteUser');
const ModerationAction _$unmuteUser = const ModerationAction._('unmuteUser');
const ModerationAction _$deletePost = const ModerationAction._('deletePost');
const ModerationAction _$hidePost = const ModerationAction._('hidePost');
const ModerationAction _$unhidePost = const ModerationAction._('unhidePost');
const ModerationAction _$deleteMedia = const ModerationAction._('deleteMedia');
const ModerationAction _$deleteUserAvatar =
    const ModerationAction._('deleteUserAvatar');
const ModerationAction _$deleteUserDisplayName =
    const ModerationAction._('deleteUserDisplayName');
const ModerationAction _$deleteUserBio =
    const ModerationAction._('deleteUserBio');
const ModerationAction _$createBannedWord =
    const ModerationAction._('createBannedWord');
const ModerationAction _$deleteBannedWord =
    const ModerationAction._('deleteBannedWord');
const ModerationAction _$createBannedImage =
    const ModerationAction._('createBannedImage');
const ModerationAction _$deleteBannedImage =
    const ModerationAction._('deleteBannedImage');
const ModerationAction _$createIpBan = const ModerationAction._('createIpBan');
const ModerationAction _$deleteIpBan = const ModerationAction._('deleteIpBan');
const ModerationAction _$resolveReport =
    const ModerationAction._('resolveReport');
const ModerationAction _$dismissReport =
    const ModerationAction._('dismissReport');
const ModerationAction _$publishAgreement =
    const ModerationAction._('publishAgreement');
const ModerationAction _$other = const ModerationAction._('other');

ModerationAction _$valueOf(String name) {
  switch (name) {
    case 'banUser':
      return _$banUser;
    case 'unbanUser':
      return _$unbanUser;
    case 'muteUser':
      return _$muteUser;
    case 'unmuteUser':
      return _$unmuteUser;
    case 'deletePost':
      return _$deletePost;
    case 'hidePost':
      return _$hidePost;
    case 'unhidePost':
      return _$unhidePost;
    case 'deleteMedia':
      return _$deleteMedia;
    case 'deleteUserAvatar':
      return _$deleteUserAvatar;
    case 'deleteUserDisplayName':
      return _$deleteUserDisplayName;
    case 'deleteUserBio':
      return _$deleteUserBio;
    case 'createBannedWord':
      return _$createBannedWord;
    case 'deleteBannedWord':
      return _$deleteBannedWord;
    case 'createBannedImage':
      return _$createBannedImage;
    case 'deleteBannedImage':
      return _$deleteBannedImage;
    case 'createIpBan':
      return _$createIpBan;
    case 'deleteIpBan':
      return _$deleteIpBan;
    case 'resolveReport':
      return _$resolveReport;
    case 'dismissReport':
      return _$dismissReport;
    case 'publishAgreement':
      return _$publishAgreement;
    case 'other':
      return _$other;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ModerationAction> _$values =
    BuiltSet<ModerationAction>(const <ModerationAction>[
  _$banUser,
  _$unbanUser,
  _$muteUser,
  _$unmuteUser,
  _$deletePost,
  _$hidePost,
  _$unhidePost,
  _$deleteMedia,
  _$deleteUserAvatar,
  _$deleteUserDisplayName,
  _$deleteUserBio,
  _$createBannedWord,
  _$deleteBannedWord,
  _$createBannedImage,
  _$deleteBannedImage,
  _$createIpBan,
  _$deleteIpBan,
  _$resolveReport,
  _$dismissReport,
  _$publishAgreement,
  _$other,
]);

class _$ModerationActionMeta {
  const _$ModerationActionMeta();
  ModerationAction get banUser => _$banUser;
  ModerationAction get unbanUser => _$unbanUser;
  ModerationAction get muteUser => _$muteUser;
  ModerationAction get unmuteUser => _$unmuteUser;
  ModerationAction get deletePost => _$deletePost;
  ModerationAction get hidePost => _$hidePost;
  ModerationAction get unhidePost => _$unhidePost;
  ModerationAction get deleteMedia => _$deleteMedia;
  ModerationAction get deleteUserAvatar => _$deleteUserAvatar;
  ModerationAction get deleteUserDisplayName => _$deleteUserDisplayName;
  ModerationAction get deleteUserBio => _$deleteUserBio;
  ModerationAction get createBannedWord => _$createBannedWord;
  ModerationAction get deleteBannedWord => _$deleteBannedWord;
  ModerationAction get createBannedImage => _$createBannedImage;
  ModerationAction get deleteBannedImage => _$deleteBannedImage;
  ModerationAction get createIpBan => _$createIpBan;
  ModerationAction get deleteIpBan => _$deleteIpBan;
  ModerationAction get resolveReport => _$resolveReport;
  ModerationAction get dismissReport => _$dismissReport;
  ModerationAction get publishAgreement => _$publishAgreement;
  ModerationAction get other => _$other;
  ModerationAction valueOf(String name) => _$valueOf(name);
  BuiltSet<ModerationAction> get values => _$values;
}

abstract class _$ModerationActionMixin {
  // ignore: non_constant_identifier_names
  _$ModerationActionMeta get ModerationAction => const _$ModerationActionMeta();
}

Serializer<ModerationAction> _$moderationActionSerializer =
    _$ModerationActionSerializer();

class _$ModerationActionSerializer
    implements PrimitiveSerializer<ModerationAction> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'banUser': 'ban_user',
    'unbanUser': 'unban_user',
    'muteUser': 'mute_user',
    'unmuteUser': 'unmute_user',
    'deletePost': 'delete_post',
    'hidePost': 'hide_post',
    'unhidePost': 'unhide_post',
    'deleteMedia': 'delete_media',
    'deleteUserAvatar': 'delete_user_avatar',
    'deleteUserDisplayName': 'delete_user_display_name',
    'deleteUserBio': 'delete_user_bio',
    'createBannedWord': 'create_banned_word',
    'deleteBannedWord': 'delete_banned_word',
    'createBannedImage': 'create_banned_image',
    'deleteBannedImage': 'delete_banned_image',
    'createIpBan': 'create_ip_ban',
    'deleteIpBan': 'delete_ip_ban',
    'resolveReport': 'resolve_report',
    'dismissReport': 'dismiss_report',
    'publishAgreement': 'publish_agreement',
    'other': 'other',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ban_user': 'banUser',
    'unban_user': 'unbanUser',
    'mute_user': 'muteUser',
    'unmute_user': 'unmuteUser',
    'delete_post': 'deletePost',
    'hide_post': 'hidePost',
    'unhide_post': 'unhidePost',
    'delete_media': 'deleteMedia',
    'delete_user_avatar': 'deleteUserAvatar',
    'delete_user_display_name': 'deleteUserDisplayName',
    'delete_user_bio': 'deleteUserBio',
    'create_banned_word': 'createBannedWord',
    'delete_banned_word': 'deleteBannedWord',
    'create_banned_image': 'createBannedImage',
    'delete_banned_image': 'deleteBannedImage',
    'create_ip_ban': 'createIpBan',
    'delete_ip_ban': 'deleteIpBan',
    'resolve_report': 'resolveReport',
    'dismiss_report': 'dismissReport',
    'publish_agreement': 'publishAgreement',
    'other': 'other',
  };

  @override
  final Iterable<Type> types = const <Type>[ModerationAction];
  @override
  final String wireName = 'ModerationAction';

  @override
  Object serialize(Serializers serializers, ModerationAction object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ModerationAction deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ModerationAction.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
