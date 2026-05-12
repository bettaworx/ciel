import 'package:test/test.dart';
import 'package:ciel_api/ciel_api.dart';

/// tests for AdminApi
void main() {
  final instance = CielApi().getAdminApi();

  group(AdminApi, () {
    // Delete agreement document draft
    //
    // Delete a draft agreement document (published documents cannot be deleted)
    //
    //Future adminAgreementsDocumentsDocumentIdDelete(String documentId) async
    test('test adminAgreementsDocumentsDocumentIdDelete', () async {
      // TODO
    });

    // Duplicate agreement document
    //
    // Create a new draft by duplicating an existing document
    //
    //Future<AgreementDocument> adminAgreementsDocumentsDocumentIdDuplicatePost(String documentId, AdminAgreementsDocumentsDocumentIdDuplicatePostRequest adminAgreementsDocumentsDocumentIdDuplicatePostRequest) async
    test('test adminAgreementsDocumentsDocumentIdDuplicatePost', () async {
      // TODO
    });

    // Get agreement document
    //
    // Retrieve a specific agreement document
    //
    //Future<AgreementDocument> adminAgreementsDocumentsDocumentIdGet(String documentId) async
    test('test adminAgreementsDocumentsDocumentIdGet', () async {
      // TODO
    });

    // Update agreement document draft
    //
    // Update a draft agreement document (published documents cannot be edited)
    //
    //Future<AgreementDocument> adminAgreementsDocumentsDocumentIdPatch(String documentId, UpdateAgreementDocumentRequest updateAgreementDocumentRequest) async
    test('test adminAgreementsDocumentsDocumentIdPatch', () async {
      // TODO
    });

    // Publish agreement document
    //
    // Publish a draft agreement document (makes it immutable and public)
    //
    //Future<AgreementDocument> adminAgreementsDocumentsDocumentIdPublishPost(String documentId) async
    test('test adminAgreementsDocumentsDocumentIdPublishPost', () async {
      // TODO
    });

    // List agreement documents
    //
    // List all agreement documents (drafts and published) with filters
    //
    //Future<AgreementDocumentPage> adminAgreementsDocumentsGet({ int limit, int offset, AgreementDocumentStatus status, AgreementLanguage language, AgreementType type }) async
    test('test adminAgreementsDocumentsGet', () async {
      // TODO
    });

    // Get agreement version history
    //
    // Get all published versions of an agreement type and language
    //
    //Future<BuiltList<AgreementDocument>> adminAgreementsDocumentsHistoryGet(AgreementType type, AgreementLanguage language) async
    test('test adminAgreementsDocumentsHistoryGet', () async {
      // TODO
    });

    // Create agreement document draft
    //
    // Create a new agreement document draft
    //
    //Future<AgreementDocument> adminAgreementsDocumentsPost(CreateAgreementDocumentRequest createAgreementDocumentRequest) async
    test('test adminAgreementsDocumentsPost', () async {
      // TODO
    });

    // List banned image hashes
    //
    // List all banned image hashes
    //
    //Future<BuiltList<BannedImageHash>> adminBannedImagesGet() async
    test('test adminBannedImagesGet', () async {
      // TODO
    });

    // Delete banned image hash
    //
    // Remove a banned image hash
    //
    //Future adminBannedImagesHashIdDelete(String hashId) async
    test('test adminBannedImagesHashIdDelete', () async {
      // TODO
    });

    // Get banned image hash
    //
    // Retrieve a specific banned image hash
    //
    //Future<BannedImageHash> adminBannedImagesHashIdGet(String hashId) async
    test('test adminBannedImagesHashIdGet', () async {
      // TODO
    });

    // Add banned image hash
    //
    // Create a new banned image hash
    //
    //Future<BannedImageHash> adminBannedImagesPost(CreateBannedImageHashRequest createBannedImageHashRequest) async
    test('test adminBannedImagesPost', () async {
      // TODO
    });

    // List banned words
    //
    // List all banned word patterns
    //
    //Future<BuiltList<BannedWord>> adminBannedWordsGet({ BannedWordAppliesTo appliesTo }) async
    test('test adminBannedWordsGet', () async {
      // TODO
    });

    // Add banned word pattern
    //
    // Create a new banned word pattern
    //
    //Future<BannedWord> adminBannedWordsPost(CreateBannedWordRequest createBannedWordRequest) async
    test('test adminBannedWordsPost', () async {
      // TODO
    });

    // Delete banned word
    //
    // Remove a banned word pattern
    //
    //Future adminBannedWordsWordIdDelete(String wordId) async
    test('test adminBannedWordsWordIdDelete', () async {
      // TODO
    });

    // Get banned word
    //
    // Retrieve a specific banned word pattern
    //
    //Future<BannedWord> adminBannedWordsWordIdGet(String wordId) async
    test('test adminBannedWordsWordIdGet', () async {
      // TODO
    });

    // Delete a custom emoji
    //
    // Permanently deletes the emoji and its image file.
    //
    //Future adminEmojisEmojiIdDelete(String emojiId) async
    test('test adminEmojisEmojiIdDelete', () async {
      // TODO
    });

    // Update a custom emoji
    //
    // Update shortcode, name, category, license, and/or image of an existing emoji.
    //
    //Future<AdminEmoji> adminEmojisEmojiIdPut(String emojiId, { String shortcode, String name, bool setName, String category, bool setCategory, String license, bool setLicense, MultipartFile image }) async
    test('test adminEmojisEmojiIdPut', () async {
      // TODO
    });

    // List custom emojis (admin view)
    //
    // Returns all custom emojis including admin-only fields (id, createdAt, updatedAt, width, height).
    //
    //Future<AdminEmojiListResponse> adminEmojisGet({ int limit, int offset }) async
    test('test adminEmojisGet', () async {
      // TODO
    });

    // Create a custom emoji
    //
    // Upload an image and create a new custom emoji. Image is resized to configured height (default 128px) and converted to WebP.
    //
    //Future<AdminEmoji> adminEmojisPost(String shortcode, MultipartFile image, { String name, String category, String license }) async
    test('test adminEmojisPost', () async {
      // TODO
    });

    // List invite codes
    //
    // Get paginated list of invite codes with usage information
    //
    //Future<InviteCodesListResponse> adminInvitesGet({ int limit, int offset }) async
    test('test adminInvitesGet', () async {
      // TODO
    });

    // Delete invite code
    //
    // Permanently delete an invite code
    //
    //Future adminInvitesInviteIdDelete(String inviteId) async
    test('test adminInvitesInviteIdDelete', () async {
      // TODO
    });

    // Disable invite code
    //
    // Soft-delete an invite code by marking it as disabled
    //
    //Future adminInvitesInviteIdDisablePatch(String inviteId) async
    test('test adminInvitesInviteIdDisablePatch', () async {
      // TODO
    });

    // Get invite code details
    //
    // Get detailed information about a specific invite code
    //
    //Future<InviteCode> adminInvitesInviteIdGet(String inviteId) async
    test('test adminInvitesInviteIdGet', () async {
      // TODO
    });

    // Update invite code
    //
    // Update invite code properties (code, maxUses, expiresAt, note)
    //
    //Future<InviteCode> adminInvitesInviteIdPatch(String inviteId, UpdateInviteCodeRequest updateInviteCodeRequest) async
    test('test adminInvitesInviteIdPatch', () async {
      // TODO
    });

    // Get invite code usage history
    //
    // Get list of users who used this invite code
    //
    //Future<BuiltList<InviteCodeUse>> adminInvitesInviteIdUsesGet(String inviteId) async
    test('test adminInvitesInviteIdUsesGet', () async {
      // TODO
    });

    // Create invite code
    //
    // Create a new invite code with optional usage limits and expiration
    //
    //Future<InviteCode> adminInvitesPost(CreateInviteCodeRequest createInviteCodeRequest) async
    test('test adminInvitesPost', () async {
      // TODO
    });

    // Delete IP ban by ID
    //
    // Remove an IP ban by its ID
    //
    //Future adminIpBansBanIdDelete(String banId) async
    test('test adminIpBansBanIdDelete', () async {
      // TODO
    });

    // Delete IP ban by address
    //
    // Remove an IP ban by IP address (query parameter)
    //
    //Future adminIpBansDelete(String ipAddress) async
    test('test adminIpBansDelete', () async {
      // TODO
    });

    // List IP bans
    //
    // List all active IP bans
    //
    //Future<IPBanPage> adminIpBansGet({ int limit, int offset }) async
    test('test adminIpBansGet', () async {
      // TODO
    });

    // Create IP ban
    //
    // Ban an IP address
    //
    //Future<IPBan> adminIpBansPost(CreateIPBanRequest createIPBanRequest) async
    test('test adminIpBansPost', () async {
      // TODO
    });

    // List media (admin view)
    //
    // List all media with filtering and admin-only fields
    //
    //Future<AdminMediaPage> adminMediaGet({ int limit, int offset, String userId, bool deleted }) async
    test('test adminMediaGet', () async {
      // TODO
    });

    // Delete media (admin)
    //
    // Permanently delete media with optional reason
    //
    //Future adminMediaMediaIdDelete(String mediaId, { DeleteMediaRequest deleteMediaRequest }) async
    test('test adminMediaMediaIdDelete', () async {
      // TODO
    });

    // List moderation logs
    //
    // List all moderation logs with optional filters
    //
    //Future<ModerationLogPage> adminModerationLogsGet({ int limit, int offset, String adminUserId, ModerationAction action, ModerationTargetType targetType, String targetId }) async
    test('test adminModerationLogsGet', () async {
      // TODO
    });

    // List permissions
    //
    //Future<BuiltList<String>> adminPermissionsGet() async
    test('test adminPermissionsGet', () async {
      // TODO
    });

    // List posts (admin view)
    //
    // List all posts with filtering and admin-only fields
    //
    //Future<AdminPostPage> adminPostsGet({ int limit, int offset, String userId, PostVisibility visibility }) async
    test('test adminPostsGet', () async {
      // TODO
    });

    // Delete post (admin)
    //
    // Permanently delete a post with optional reason
    //
    //Future adminPostsPostIdDelete(String postId, { DeletePostRequest deletePostRequest }) async
    test('test adminPostsPostIdDelete', () async {
      // TODO
    });

    // Update post visibility
    //
    // Change post visibility (public/hidden/deleted)
    //
    //Future<AdminPost> adminPostsPostIdVisibilityPatch(String postId, UpdatePostVisibilityRequest updatePostVisibilityRequest) async
    test('test adminPostsPostIdVisibilityPatch', () async {
      // TODO
    });

    // List all reports
    //
    // List all reports with optional filters
    //
    //Future<ReportPage> adminReportsGet({ int limit, int offset, ReportStatus status, ReportTargetType targetType }) async
    test('test adminReportsGet', () async {
      // TODO
    });

    // Get specific report
    //
    // Retrieve details of a specific report
    //
    //Future<Report> adminReportsReportIdGet(String reportId) async
    test('test adminReportsReportIdGet', () async {
      // TODO
    });

    // Update report status
    //
    // Review, resolve, or dismiss a report
    //
    //Future<Report> adminReportsReportIdPatch(String reportId, UpdateReportRequest updateReportRequest) async
    test('test adminReportsReportIdPatch', () async {
      // TODO
    });

    // List roles
    //
    //Future<BuiltList<String>> adminRolesGet() async
    test('test adminRolesGet', () async {
      // TODO
    });

    // Create role
    //
    // Create a new role
    //
    //Future<Role> adminRolesPost(CreateRoleRequest createRoleRequest) async
    test('test adminRolesPost', () async {
      // TODO
    });

    // Delete role
    //
    // Delete a role (cascade deletes user assignments)
    //
    //Future adminRolesRoleIdDelete(String roleId) async
    test('test adminRolesRoleIdDelete', () async {
      // TODO
    });

    // Get role details
    //
    // Retrieve details of a specific role
    //
    //Future<Role> adminRolesRoleIdGet(String roleId) async
    test('test adminRolesRoleIdGet', () async {
      // TODO
    });

    // Update role
    //
    // Update role name and description
    //
    //Future<Role> adminRolesRoleIdPatch(String roleId, UpdateRoleRequest updateRoleRequest) async
    test('test adminRolesRoleIdPatch', () async {
      // TODO
    });

    // Get role permissions
    //
    // Get all permissions assigned to a role
    //
    //Future<RolePermissions> adminRolesRoleIdPermissionsGet(String roleId) async
    test('test adminRolesRoleIdPermissionsGet', () async {
      // TODO
    });

    // Update role permissions
    //
    // Replace all permissions for a role
    //
    //Future<RolePermissions> adminRolesRoleIdPermissionsPut(String roleId, RolePermissions rolePermissions) async
    test('test adminRolesRoleIdPermissionsPut', () async {
      // TODO
    });

    // Get users with role
    //
    // Get all users that have been assigned this role
    //
    //Future<RoleUsersPage> adminRolesRoleIdUsersGet(String roleId, { int limit, int offset }) async
    test('test adminRolesRoleIdUsersGet', () async {
      // TODO
    });

    // Update agreement versions
    //
    // Update Terms of Service and/or Privacy Policy versions (admin only)
    //
    //Future<AgreementVersions> adminSettingsAgreementsPatch(UpdateAgreementVersionsRequest updateAgreementVersionsRequest) async
    test('test adminSettingsAgreementsPatch', () async {
      // TODO
    });

    // Get server settings
    //
    //Future<ServerSettings> adminSettingsGet() async
    test('test adminSettingsGet', () async {
      // TODO
    });

    // Update signup enabled
    //
    //Future<ServerSettings> adminSettingsSignupPatch(UpdateSignupEnabledRequest updateSignupEnabledRequest) async
    test('test adminSettingsSignupPatch', () async {
      // TODO
    });

    // Search users
    //
    // Search and list users with filters, pagination, and stats
    //
    //Future<AdminUserPage> adminUsersGet({ int limit, int offset, String search, String sort }) async
    test('test adminUsersGet', () async {
      // TODO
    });

    // Delete user avatar
    //
    // Remove user's avatar image
    //
    //Future adminUsersUserIdAvatarDelete(String userId) async
    test('test adminUsersUserIdAvatarDelete', () async {
      // TODO
    });

    // Unban user
    //
    //Future adminUsersUserIdBanDelete(String userId) async
    test('test adminUsersUserIdBanDelete', () async {
      // TODO
    });

    // Ban user
    //
    //Future adminUsersUserIdBanPost(String userId, { BanUserRequest banUserRequest }) async
    test('test adminUsersUserIdBanPost', () async {
      // TODO
    });

    // Delete user bio
    //
    // Remove user's bio
    //
    //Future adminUsersUserIdBioDelete(String userId) async
    test('test adminUsersUserIdBioDelete', () async {
      // TODO
    });

    // Delete user display name
    //
    // Remove user's display name
    //
    //Future adminUsersUserIdDisplayNameDelete(String userId) async
    test('test adminUsersUserIdDisplayNameDelete', () async {
      // TODO
    });

    // Get moderation logs for specific user
    //
    // Retrieve moderation logs where the user is the target
    //
    //Future<BuiltList<ModerationLog>> adminUsersUserIdModerationLogsGet(String userId, { int limit, int offset }) async
    test('test adminUsersUserIdModerationLogsGet', () async {
      // TODO
    });

    // Remove all user mutes
    //
    // Remove all active mutes for a user
    //
    //Future adminUsersUserIdMutesDelete(String userId) async
    test('test adminUsersUserIdMutesDelete', () async {
      // TODO
    });

    // List user mutes
    //
    // List all active mutes for a user
    //
    //Future<BuiltList<UserMute>> adminUsersUserIdMutesGet(String userId) async
    test('test adminUsersUserIdMutesGet', () async {
      // TODO
    });

    // Remove specific user mute type
    //
    // Remove a specific mute type for a user
    //
    //Future adminUsersUserIdMutesMuteTypeDelete(String userId, MuteType muteType) async
    test('test adminUsersUserIdMutesMuteTypeDelete', () async {
      // TODO
    });

    // Create user mute
    //
    // Create a new mute for a user
    //
    //Future<UserMute> adminUsersUserIdMutesPost(String userId, CreateUserMuteRequest createUserMuteRequest) async
    test('test adminUsersUserIdMutesPost', () async {
      // TODO
    });

    // Delete admin note for user
    //
    // Delete admin notes for a specific user
    //
    //Future adminUsersUserIdNoteDelete(String userId) async
    test('test adminUsersUserIdNoteDelete', () async {
      // TODO
    });

    // Get admin note for user
    //
    // Retrieve admin notes for a specific user
    //
    //Future<AdminUserNote> adminUsersUserIdNoteGet(String userId) async
    test('test adminUsersUserIdNoteGet', () async {
      // TODO
    });

    // Create or update admin note for user
    //
    // Create or update admin notes for a specific user
    //
    //Future<AdminUserNote> adminUsersUserIdNotePut(String userId, CreateAdminUserNoteRequest createAdminUserNoteRequest) async
    test('test adminUsersUserIdNotePut', () async {
      // TODO
    });

    // Get user permission overrides
    //
    //Future<UserPermissionOverrides> adminUsersUserIdPermissionsGet(String userId) async
    test('test adminUsersUserIdPermissionsGet', () async {
      // TODO
    });

    // Replace user permission overrides
    //
    //Future<UserPermissionOverrides> adminUsersUserIdPermissionsPut(String userId, UserPermissionOverrides userPermissionOverrides) async
    test('test adminUsersUserIdPermissionsPut', () async {
      // TODO
    });

    // Get user roles
    //
    //Future<BuiltList<String>> adminUsersUserIdRolesGet(String userId) async
    test('test adminUsersUserIdRolesGet', () async {
      // TODO
    });

    // Replace user roles
    //
    //Future<BuiltList<String>> adminUsersUserIdRolesPut(String userId, UserRolesUpdateRequest userRolesUpdateRequest) async
    test('test adminUsersUserIdRolesPut', () async {
      // TODO
    });

    // Get user statistics
    //
    // Retrieve detailed statistics for a specific user
    //
    //Future<UserStats> adminUsersUserIdStatsGet(String userId) async
    test('test adminUsersUserIdStatsGet', () async {
      // TODO
    });

    // Get dashboard statistics
    //
    // Retrieve system-wide statistics for the admin dashboard
    //
    //Future<DashboardStats> getAdminDashboardStats() async
    test('test getAdminDashboardStats', () async {
      // TODO
    });
  });
}
