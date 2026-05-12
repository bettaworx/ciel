// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'serializers.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializers _$serializers = (Serializers().toBuilder()
      ..add($InviteCode.serializer)
      ..add($Media.serializer)
      ..add($Post.serializer)
      ..add($User.serializer)
      ..add(AcceptAgreementsRequest.serializer)
      ..add(AdminAgreementsDocumentsDocumentIdDuplicatePostRequest.serializer)
      ..add(AdminEmoji.serializer)
      ..add(AdminEmojiListResponse.serializer)
      ..add(AdminMedia.serializer)
      ..add(AdminMediaPage.serializer)
      ..add(AdminPost.serializer)
      ..add(AdminPostPage.serializer)
      ..add(AdminUser.serializer)
      ..add(AdminUserNote.serializer)
      ..add(AdminUserPage.serializer)
      ..add(AgreementDocument.serializer)
      ..add(AgreementDocumentPage.serializer)
      ..add(AgreementDocumentStatus.serializer)
      ..add(AgreementLanguage.serializer)
      ..add(AgreementType.serializer)
      ..add(AgreementVersions.serializer)
      ..add(BanUserRequest.serializer)
      ..add(BannedImageHash.serializer)
      ..add(BannedWord.serializer)
      ..add(BannedWordAppliesTo.serializer)
      ..add(BannedWordSeverity.serializer)
      ..add(CreateAdminRequest.serializer)
      ..add(CreateAdminResponse.serializer)
      ..add(CreateAdminUserNoteRequest.serializer)
      ..add(CreateAgreementDocumentRequest.serializer)
      ..add(CreateBannedImageHashRequest.serializer)
      ..add(CreateBannedWordRequest.serializer)
      ..add(CreateIPBanRequest.serializer)
      ..add(CreateInviteCodeRequest.serializer)
      ..add(CreatePostRequest.serializer)
      ..add(CreateReportRequest.serializer)
      ..add(CreateRoleRequest.serializer)
      ..add(CreateUserMuteRequest.serializer)
      ..add(DashboardStats.serializer)
      ..add(DeleteMediaRequest.serializer)
      ..add(DeletePostRequest.serializer)
      ..add(EmojiListResponse.serializer)
      ..add(Error.serializer)
      ..add(IPBan.serializer)
      ..add(IPBanPage.serializer)
      ..add(ImageHashType.serializer)
      ..add(InviteCodeUse.serializer)
      ..add(InviteCodeWithCreator.serializer)
      ..add(InviteCodesListResponse.serializer)
      ..add(LoginFinishRequest.serializer)
      ..add(LoginFinishResponse.serializer)
      ..add(LoginFinishResponseTokenTypeEnum.serializer)
      ..add(LoginStartRequest.serializer)
      ..add(LoginStartResponse.serializer)
      ..add(MediaAvatarLimits.serializer)
      ..add(MediaBannerLimits.serializer)
      ..add(MediaBannerLimitsGif.serializer)
      ..add(MediaBannerLimitsStatic.serializer)
      ..add(MediaEmojiLimits.serializer)
      ..add(MediaEmojiLimitsGif.serializer)
      ..add(MediaEmojiLimitsStatic.serializer)
      ..add(MediaLimits.serializer)
      ..add(MediaPostLimits.serializer)
      ..add(MediaPostLimitsGif.serializer)
      ..add(MediaPostLimitsStatic.serializer)
      ..add(MediaServerIconLimits.serializer)
      ..add(MediaServerIconLimitsGif.serializer)
      ..add(MediaServerIconLimitsStatic.serializer)
      ..add(MediaType.serializer)
      ..add(MediaVideoLimits.serializer)
      ..add(ModerationAction.serializer)
      ..add(ModerationLog.serializer)
      ..add(ModerationLogPage.serializer)
      ..add(ModerationTargetType.serializer)
      ..add(MuteType.serializer)
      ..add(PasswordChangeRequest.serializer)
      ..add(PermissionEffect.serializer)
      ..add(PermissionOverride.serializer)
      ..add(PostCreatedEvent.serializer)
      ..add(PostCreatedEventTypeEnum.serializer)
      ..add(PostDeletedEvent.serializer)
      ..add(PostDeletedEventTypeEnum.serializer)
      ..add(PostMediaFilter.serializer)
      ..add(PostVisibility.serializer)
      ..add(PublicAgreementContent.serializer)
      ..add(PublicEmoji.serializer)
      ..add(ReactRequest.serializer)
      ..add(ReactionCount.serializer)
      ..add(ReactionCounts.serializer)
      ..add(ReactionUpdatedEvent.serializer)
      ..add(ReactionUpdatedEventTypeEnum.serializer)
      ..add(ReactionUsersPage.serializer)
      ..add(RealtimeEvent.serializer)
      ..add(RefreshResponse.serializer)
      ..add(RegisterRequest.serializer)
      ..add(Report.serializer)
      ..add(ReportPage.serializer)
      ..add(ReportStatus.serializer)
      ..add(ReportTargetType.serializer)
      ..add(Role.serializer)
      ..add(RolePermissions.serializer)
      ..add(RoleUser.serializer)
      ..add(RoleUsersPage.serializer)
      ..add(ServerConfig.serializer)
      ..add(ServerConfigUpdatedEvent.serializer)
      ..add(ServerConfigUpdatedEventTypeEnum.serializer)
      ..add(ServerInfo.serializer)
      ..add(ServerInfoUpdatedEvent.serializer)
      ..add(ServerInfoUpdatedEventTypeEnum.serializer)
      ..add(ServerSettings.serializer)
      ..add(ServerSetupRequest.serializer)
      ..add(ServerSetupResponse.serializer)
      ..add(ServerStats.serializer)
      ..add(SetupStatusResponse.serializer)
      ..add(StepupFinishRequest.serializer)
      ..add(StepupFinishResponse.serializer)
      ..add(StepupFinishResponseTokenTypeEnum.serializer)
      ..add(StepupStartRequest.serializer)
      ..add(StepupStartResponse.serializer)
      ..add(TimelinePage.serializer)
      ..add(UpdateAdminUserNoteRequest.serializer)
      ..add(UpdateAgreementDocumentRequest.serializer)
      ..add(UpdateAgreementVersionsRequest.serializer)
      ..add(UpdateInviteCodeRequest.serializer)
      ..add(UpdatePostVisibilityRequest.serializer)
      ..add(UpdateProfileRequest.serializer)
      ..add(UpdateReportRequest.serializer)
      ..add(UpdateRoleRequest.serializer)
      ..add(UpdateSignupEnabledRequest.serializer)
      ..add(UpdateUsernameRequest.serializer)
      ..add(UserDeletedEvent.serializer)
      ..add(UserDeletedEventTypeEnum.serializer)
      ..add(UserMute.serializer)
      ..add(UserPermissionOverrides.serializer)
      ..add(UserPostsPage.serializer)
      ..add(UserRegisteredEvent.serializer)
      ..add(UserRegisteredEventTypeEnum.serializer)
      ..add(UserRolesUpdateRequest.serializer)
      ..add(UserStats.serializer)
      ..add(VerifySetupPasswordRequest.serializer)
      ..add(VerifySetupPasswordResponse.serializer)
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AdminEmoji)]),
          () => ListBuilder<AdminEmoji>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AdminMedia)]),
          () => ListBuilder<AdminMedia>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AdminPost)]),
          () => ListBuilder<AdminPost>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AdminUser)]),
          () => ListBuilder<AdminUser>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(AgreementDocument)]),
          () => ListBuilder<AgreementDocument>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(IPBan)]),
          () => ListBuilder<IPBan>())
      ..addBuilderFactory(
          const FullType(
              BuiltList, const [const FullType(InviteCodeWithCreator)]),
          () => ListBuilder<InviteCodeWithCreator>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(Media)]),
          () => ListBuilder<Media>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(Media)]),
          () => ListBuilder<Media>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ModerationLog)]),
          () => ListBuilder<ModerationLog>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(PermissionOverride)]),
          () => ListBuilder<PermissionOverride>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(PermissionOverride)]),
          () => ListBuilder<PermissionOverride>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(Post)]),
          () => ListBuilder<Post>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(Post)]),
          () => ListBuilder<Post>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(PublicEmoji)]),
          () => ListBuilder<PublicEmoji>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(ReactionCount)]),
          () => ListBuilder<ReactionCount>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(Report)]),
          () => ListBuilder<Report>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(RoleUser)]),
          () => ListBuilder<RoleUser>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(String)]),
          () => ListBuilder<String>())
      ..addBuilderFactory(
          const FullType(BuiltList, const [const FullType(User)]),
          () => ListBuilder<User>()))
    .build();

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
