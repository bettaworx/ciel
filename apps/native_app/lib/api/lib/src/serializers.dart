//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_import

import 'package:one_of_serializer/any_of_serializer.dart';
import 'package:one_of_serializer/one_of_serializer.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:built_value/standard_json_plugin.dart';
import 'package:built_value/iso_8601_date_time_serializer.dart';
import 'package:ciel_api/src/date_serializer.dart';
import 'package:ciel_api/src/model/date.dart';

import 'package:ciel_api/src/model/accept_agreements_request.dart';
import 'package:ciel_api/src/model/admin_agreements_documents_document_id_duplicate_post_request.dart';
import 'package:ciel_api/src/model/admin_emoji.dart';
import 'package:ciel_api/src/model/admin_emoji_list_response.dart';
import 'package:ciel_api/src/model/admin_media.dart';
import 'package:ciel_api/src/model/admin_media_page.dart';
import 'package:ciel_api/src/model/admin_post.dart';
import 'package:ciel_api/src/model/admin_post_page.dart';
import 'package:ciel_api/src/model/admin_user.dart';
import 'package:ciel_api/src/model/admin_user_note.dart';
import 'package:ciel_api/src/model/admin_user_page.dart';
import 'package:ciel_api/src/model/agreement_document.dart';
import 'package:ciel_api/src/model/agreement_document_page.dart';
import 'package:ciel_api/src/model/agreement_document_status.dart';
import 'package:ciel_api/src/model/agreement_language.dart';
import 'package:ciel_api/src/model/agreement_type.dart';
import 'package:ciel_api/src/model/agreement_versions.dart';
import 'package:ciel_api/src/model/ban_user_request.dart';
import 'package:ciel_api/src/model/banned_image_hash.dart';
import 'package:ciel_api/src/model/banned_word.dart';
import 'package:ciel_api/src/model/banned_word_applies_to.dart';
import 'package:ciel_api/src/model/banned_word_severity.dart';
import 'package:ciel_api/src/model/create_admin_request.dart';
import 'package:ciel_api/src/model/create_admin_response.dart';
import 'package:ciel_api/src/model/create_admin_user_note_request.dart';
import 'package:ciel_api/src/model/create_agreement_document_request.dart';
import 'package:ciel_api/src/model/create_banned_image_hash_request.dart';
import 'package:ciel_api/src/model/create_banned_word_request.dart';
import 'package:ciel_api/src/model/create_ip_ban_request.dart';
import 'package:ciel_api/src/model/create_invite_code_request.dart';
import 'package:ciel_api/src/model/create_post_request.dart';
import 'package:ciel_api/src/model/create_report_request.dart';
import 'package:ciel_api/src/model/create_role_request.dart';
import 'package:ciel_api/src/model/create_user_mute_request.dart';
import 'package:ciel_api/src/model/dashboard_stats.dart';
import 'package:ciel_api/src/model/delete_media_request.dart';
import 'package:ciel_api/src/model/delete_post_request.dart';
import 'package:ciel_api/src/model/emoji_list_response.dart';
import 'package:ciel_api/src/model/error.dart';
import 'package:ciel_api/src/model/ip_ban.dart';
import 'package:ciel_api/src/model/ip_ban_page.dart';
import 'package:ciel_api/src/model/image_hash_type.dart';
import 'package:ciel_api/src/model/invite_code.dart';
import 'package:ciel_api/src/model/invite_code_use.dart';
import 'package:ciel_api/src/model/invite_code_with_creator.dart';
import 'package:ciel_api/src/model/invite_codes_list_response.dart';
import 'package:ciel_api/src/model/login_finish_request.dart';
import 'package:ciel_api/src/model/login_finish_response.dart';
import 'package:ciel_api/src/model/login_start_request.dart';
import 'package:ciel_api/src/model/login_start_response.dart';
import 'package:ciel_api/src/model/media.dart';
import 'package:ciel_api/src/model/media_avatar_limits.dart';
import 'package:ciel_api/src/model/media_banner_limits.dart';
import 'package:ciel_api/src/model/media_banner_limits_gif.dart';
import 'package:ciel_api/src/model/media_banner_limits_static.dart';
import 'package:ciel_api/src/model/media_emoji_limits.dart';
import 'package:ciel_api/src/model/media_emoji_limits_gif.dart';
import 'package:ciel_api/src/model/media_emoji_limits_static.dart';
import 'package:ciel_api/src/model/media_limits.dart';
import 'package:ciel_api/src/model/media_post_limits.dart';
import 'package:ciel_api/src/model/media_post_limits_gif.dart';
import 'package:ciel_api/src/model/media_post_limits_static.dart';
import 'package:ciel_api/src/model/media_server_icon_limits.dart';
import 'package:ciel_api/src/model/media_server_icon_limits_gif.dart';
import 'package:ciel_api/src/model/media_server_icon_limits_static.dart';
import 'package:ciel_api/src/model/media_type.dart';
import 'package:ciel_api/src/model/media_video_limits.dart';
import 'package:ciel_api/src/model/moderation_action.dart';
import 'package:ciel_api/src/model/moderation_log.dart';
import 'package:ciel_api/src/model/moderation_log_page.dart';
import 'package:ciel_api/src/model/moderation_target_type.dart';
import 'package:ciel_api/src/model/mute_type.dart';
import 'package:ciel_api/src/model/password_change_request.dart';
import 'package:ciel_api/src/model/permission_effect.dart';
import 'package:ciel_api/src/model/permission_override.dart';
import 'package:ciel_api/src/model/post.dart';
import 'package:ciel_api/src/model/post_created_event.dart';
import 'package:ciel_api/src/model/post_deleted_event.dart';
import 'package:ciel_api/src/model/post_media_filter.dart';
import 'package:ciel_api/src/model/post_visibility.dart';
import 'package:ciel_api/src/model/public_agreement_content.dart';
import 'package:ciel_api/src/model/public_emoji.dart';
import 'package:ciel_api/src/model/react_request.dart';
import 'package:ciel_api/src/model/reaction_count.dart';
import 'package:ciel_api/src/model/reaction_counts.dart';
import 'package:ciel_api/src/model/reaction_updated_event.dart';
import 'package:ciel_api/src/model/reaction_users_page.dart';
import 'package:ciel_api/src/model/realtime_event.dart';
import 'package:ciel_api/src/model/refresh_response.dart';
import 'package:ciel_api/src/model/register_request.dart';
import 'package:ciel_api/src/model/report.dart';
import 'package:ciel_api/src/model/report_page.dart';
import 'package:ciel_api/src/model/report_status.dart';
import 'package:ciel_api/src/model/report_target_type.dart';
import 'package:ciel_api/src/model/role.dart';
import 'package:ciel_api/src/model/role_permissions.dart';
import 'package:ciel_api/src/model/role_user.dart';
import 'package:ciel_api/src/model/role_users_page.dart';
import 'package:ciel_api/src/model/server_config.dart';
import 'package:ciel_api/src/model/server_config_updated_event.dart';
import 'package:ciel_api/src/model/server_info.dart';
import 'package:ciel_api/src/model/server_info_updated_event.dart';
import 'package:ciel_api/src/model/server_settings.dart';
import 'package:ciel_api/src/model/server_setup_request.dart';
import 'package:ciel_api/src/model/server_setup_response.dart';
import 'package:ciel_api/src/model/server_stats.dart';
import 'package:ciel_api/src/model/setup_status_response.dart';
import 'package:ciel_api/src/model/stepup_finish_request.dart';
import 'package:ciel_api/src/model/stepup_finish_response.dart';
import 'package:ciel_api/src/model/stepup_start_request.dart';
import 'package:ciel_api/src/model/stepup_start_response.dart';
import 'package:ciel_api/src/model/timeline_page.dart';
import 'package:ciel_api/src/model/update_admin_user_note_request.dart';
import 'package:ciel_api/src/model/update_agreement_document_request.dart';
import 'package:ciel_api/src/model/update_agreement_versions_request.dart';
import 'package:ciel_api/src/model/update_invite_code_request.dart';
import 'package:ciel_api/src/model/update_post_visibility_request.dart';
import 'package:ciel_api/src/model/update_profile_request.dart';
import 'package:ciel_api/src/model/update_report_request.dart';
import 'package:ciel_api/src/model/update_role_request.dart';
import 'package:ciel_api/src/model/update_signup_enabled_request.dart';
import 'package:ciel_api/src/model/update_username_request.dart';
import 'package:ciel_api/src/model/user.dart';
import 'package:ciel_api/src/model/user_deleted_event.dart';
import 'package:ciel_api/src/model/user_mute.dart';
import 'package:ciel_api/src/model/user_permission_overrides.dart';
import 'package:ciel_api/src/model/user_posts_page.dart';
import 'package:ciel_api/src/model/user_registered_event.dart';
import 'package:ciel_api/src/model/user_roles_update_request.dart';
import 'package:ciel_api/src/model/user_stats.dart';
import 'package:ciel_api/src/model/verify_setup_password_request.dart';
import 'package:ciel_api/src/model/verify_setup_password_response.dart';

part 'serializers.g.dart';

@SerializersFor([
  AcceptAgreementsRequest,
  AdminAgreementsDocumentsDocumentIdDuplicatePostRequest,
  AdminEmoji,
  AdminEmojiListResponse,
  AdminMedia,
  AdminMediaPage,
  AdminPost,
  AdminPostPage,
  AdminUser,
  AdminUserNote,
  AdminUserPage,
  AgreementDocument,
  AgreementDocumentPage,
  AgreementDocumentStatus,
  AgreementLanguage,
  AgreementType,
  AgreementVersions,
  BanUserRequest,
  BannedImageHash,
  BannedWord,
  BannedWordAppliesTo,
  BannedWordSeverity,
  CreateAdminRequest,
  CreateAdminResponse,
  CreateAdminUserNoteRequest,
  CreateAgreementDocumentRequest,
  CreateBannedImageHashRequest,
  CreateBannedWordRequest,
  CreateIPBanRequest,
  CreateInviteCodeRequest,
  CreatePostRequest,
  CreateReportRequest,
  CreateRoleRequest,
  CreateUserMuteRequest,
  DashboardStats,
  DeleteMediaRequest,
  DeletePostRequest,
  EmojiListResponse,
  Error,
  IPBan,
  IPBanPage,
  ImageHashType,
  InviteCode,
  $InviteCode,
  InviteCodeUse,
  InviteCodeWithCreator,
  InviteCodesListResponse,
  LoginFinishRequest,
  LoginFinishResponse,
  LoginStartRequest,
  LoginStartResponse,
  Media,
  $Media,
  MediaAvatarLimits,
  MediaBannerLimits,
  MediaBannerLimitsGif,
  MediaBannerLimitsStatic,
  MediaEmojiLimits,
  MediaEmojiLimitsGif,
  MediaEmojiLimitsStatic,
  MediaLimits,
  MediaPostLimits,
  MediaPostLimitsGif,
  MediaPostLimitsStatic,
  MediaServerIconLimits,
  MediaServerIconLimitsGif,
  MediaServerIconLimitsStatic,
  MediaType,
  MediaVideoLimits,
  ModerationAction,
  ModerationLog,
  ModerationLogPage,
  ModerationTargetType,
  MuteType,
  PasswordChangeRequest,
  PermissionEffect,
  PermissionOverride,
  Post,
  $Post,
  PostCreatedEvent,
  PostDeletedEvent,
  PostMediaFilter,
  PostVisibility,
  PublicAgreementContent,
  PublicEmoji,
  ReactRequest,
  ReactionCount,
  ReactionCounts,
  ReactionUpdatedEvent,
  ReactionUsersPage,
  RealtimeEvent,
  RefreshResponse,
  RegisterRequest,
  Report,
  ReportPage,
  ReportStatus,
  ReportTargetType,
  Role,
  RolePermissions,
  RoleUser,
  RoleUsersPage,
  ServerConfig,
  ServerConfigUpdatedEvent,
  ServerInfo,
  ServerInfoUpdatedEvent,
  ServerSettings,
  ServerSetupRequest,
  ServerSetupResponse,
  ServerStats,
  SetupStatusResponse,
  StepupFinishRequest,
  StepupFinishResponse,
  StepupStartRequest,
  StepupStartResponse,
  TimelinePage,
  UpdateAdminUserNoteRequest,
  UpdateAgreementDocumentRequest,
  UpdateAgreementVersionsRequest,
  UpdateInviteCodeRequest,
  UpdatePostVisibilityRequest,
  UpdateProfileRequest,
  UpdateReportRequest,
  UpdateRoleRequest,
  UpdateSignupEnabledRequest,
  UpdateUsernameRequest,
  User,
  $User,
  UserDeletedEvent,
  UserMute,
  UserPermissionOverrides,
  UserPostsPage,
  UserRegisteredEvent,
  UserRolesUpdateRequest,
  UserStats,
  VerifySetupPasswordRequest,
  VerifySetupPasswordResponse,
])
Serializers serializers = (_$serializers.toBuilder()
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(ModerationLog)]),
        () => ListBuilder<ModerationLog>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(AgreementDocument)]),
        () => ListBuilder<AgreementDocument>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(InviteCodeUse)]),
        () => ListBuilder<InviteCodeUse>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(BannedImageHash)]),
        () => ListBuilder<BannedImageHash>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(BannedWord)]),
        () => ListBuilder<BannedWord>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(String)]),
        () => ListBuilder<String>(),
      )
      ..addBuilderFactory(
        const FullType(BuiltList, [FullType(UserMute)]),
        () => ListBuilder<UserMute>(),
      )
      ..add(InviteCode.serializer)
      ..add(Media.serializer)
      ..add(Post.serializer)
      ..add(User.serializer)
      ..add(const OneOfSerializer())
      ..add(const AnyOfSerializer())
      ..add(const DateSerializer())
      ..add(Iso8601DateTimeSerializer()))
    .build();

Serializers standardSerializers =
    (serializers.toBuilder()..addPlugin(StandardJsonPlugin())).build();
