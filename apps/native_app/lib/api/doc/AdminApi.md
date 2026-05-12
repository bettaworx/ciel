# ciel_api.api.AdminApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**adminAgreementsDocumentsDocumentIdDelete**](AdminApi.md#adminagreementsdocumentsdocumentiddelete) | **DELETE** /admin/agreements/documents/{documentId} | Delete agreement document draft
[**adminAgreementsDocumentsDocumentIdDuplicatePost**](AdminApi.md#adminagreementsdocumentsdocumentidduplicatepost) | **POST** /admin/agreements/documents/{documentId}/duplicate | Duplicate agreement document
[**adminAgreementsDocumentsDocumentIdGet**](AdminApi.md#adminagreementsdocumentsdocumentidget) | **GET** /admin/agreements/documents/{documentId} | Get agreement document
[**adminAgreementsDocumentsDocumentIdPatch**](AdminApi.md#adminagreementsdocumentsdocumentidpatch) | **PATCH** /admin/agreements/documents/{documentId} | Update agreement document draft
[**adminAgreementsDocumentsDocumentIdPublishPost**](AdminApi.md#adminagreementsdocumentsdocumentidpublishpost) | **POST** /admin/agreements/documents/{documentId}/publish | Publish agreement document
[**adminAgreementsDocumentsGet**](AdminApi.md#adminagreementsdocumentsget) | **GET** /admin/agreements/documents | List agreement documents
[**adminAgreementsDocumentsHistoryGet**](AdminApi.md#adminagreementsdocumentshistoryget) | **GET** /admin/agreements/documents/history | Get agreement version history
[**adminAgreementsDocumentsPost**](AdminApi.md#adminagreementsdocumentspost) | **POST** /admin/agreements/documents | Create agreement document draft
[**adminBannedImagesGet**](AdminApi.md#adminbannedimagesget) | **GET** /admin/banned-images | List banned image hashes
[**adminBannedImagesHashIdDelete**](AdminApi.md#adminbannedimageshashiddelete) | **DELETE** /admin/banned-images/{hashId} | Delete banned image hash
[**adminBannedImagesHashIdGet**](AdminApi.md#adminbannedimageshashidget) | **GET** /admin/banned-images/{hashId} | Get banned image hash
[**adminBannedImagesPost**](AdminApi.md#adminbannedimagespost) | **POST** /admin/banned-images | Add banned image hash
[**adminBannedWordsGet**](AdminApi.md#adminbannedwordsget) | **GET** /admin/banned-words | List banned words
[**adminBannedWordsPost**](AdminApi.md#adminbannedwordspost) | **POST** /admin/banned-words | Add banned word pattern
[**adminBannedWordsWordIdDelete**](AdminApi.md#adminbannedwordswordiddelete) | **DELETE** /admin/banned-words/{wordId} | Delete banned word
[**adminBannedWordsWordIdGet**](AdminApi.md#adminbannedwordswordidget) | **GET** /admin/banned-words/{wordId} | Get banned word
[**adminEmojisEmojiIdDelete**](AdminApi.md#adminemojisemojiiddelete) | **DELETE** /admin/emojis/{emojiId} | Delete a custom emoji
[**adminEmojisEmojiIdPut**](AdminApi.md#adminemojisemojiidput) | **PUT** /admin/emojis/{emojiId} | Update a custom emoji
[**adminEmojisGet**](AdminApi.md#adminemojisget) | **GET** /admin/emojis | List custom emojis (admin view)
[**adminEmojisPost**](AdminApi.md#adminemojispost) | **POST** /admin/emojis | Create a custom emoji
[**adminInvitesGet**](AdminApi.md#admininvitesget) | **GET** /admin/invites | List invite codes
[**adminInvitesInviteIdDelete**](AdminApi.md#admininvitesinviteiddelete) | **DELETE** /admin/invites/{inviteId} | Delete invite code
[**adminInvitesInviteIdDisablePatch**](AdminApi.md#admininvitesinviteiddisablepatch) | **PATCH** /admin/invites/{inviteId}/disable | Disable invite code
[**adminInvitesInviteIdGet**](AdminApi.md#admininvitesinviteidget) | **GET** /admin/invites/{inviteId} | Get invite code details
[**adminInvitesInviteIdPatch**](AdminApi.md#admininvitesinviteidpatch) | **PATCH** /admin/invites/{inviteId} | Update invite code
[**adminInvitesInviteIdUsesGet**](AdminApi.md#admininvitesinviteidusesget) | **GET** /admin/invites/{inviteId}/uses | Get invite code usage history
[**adminInvitesPost**](AdminApi.md#admininvitespost) | **POST** /admin/invites | Create invite code
[**adminIpBansBanIdDelete**](AdminApi.md#adminipbansbaniddelete) | **DELETE** /admin/ip-bans/{banId} | Delete IP ban by ID
[**adminIpBansDelete**](AdminApi.md#adminipbansdelete) | **DELETE** /admin/ip-bans | Delete IP ban by address
[**adminIpBansGet**](AdminApi.md#adminipbansget) | **GET** /admin/ip-bans | List IP bans
[**adminIpBansPost**](AdminApi.md#adminipbanspost) | **POST** /admin/ip-bans | Create IP ban
[**adminMediaGet**](AdminApi.md#adminmediaget) | **GET** /admin/media | List media (admin view)
[**adminMediaMediaIdDelete**](AdminApi.md#adminmediamediaiddelete) | **DELETE** /admin/media/{mediaId} | Delete media (admin)
[**adminModerationLogsGet**](AdminApi.md#adminmoderationlogsget) | **GET** /admin/moderation-logs | List moderation logs
[**adminPermissionsGet**](AdminApi.md#adminpermissionsget) | **GET** /admin/permissions | List permissions
[**adminPostsGet**](AdminApi.md#adminpostsget) | **GET** /admin/posts | List posts (admin view)
[**adminPostsPostIdDelete**](AdminApi.md#adminpostspostiddelete) | **DELETE** /admin/posts/{postId} | Delete post (admin)
[**adminPostsPostIdVisibilityPatch**](AdminApi.md#adminpostspostidvisibilitypatch) | **PATCH** /admin/posts/{postId}/visibility | Update post visibility
[**adminReportsGet**](AdminApi.md#adminreportsget) | **GET** /admin/reports | List all reports
[**adminReportsReportIdGet**](AdminApi.md#adminreportsreportidget) | **GET** /admin/reports/{reportId} | Get specific report
[**adminReportsReportIdPatch**](AdminApi.md#adminreportsreportidpatch) | **PATCH** /admin/reports/{reportId} | Update report status
[**adminRolesGet**](AdminApi.md#adminrolesget) | **GET** /admin/roles | List roles
[**adminRolesPost**](AdminApi.md#adminrolespost) | **POST** /admin/roles | Create role
[**adminRolesRoleIdDelete**](AdminApi.md#adminrolesroleiddelete) | **DELETE** /admin/roles/{roleId} | Delete role
[**adminRolesRoleIdGet**](AdminApi.md#adminrolesroleidget) | **GET** /admin/roles/{roleId} | Get role details
[**adminRolesRoleIdPatch**](AdminApi.md#adminrolesroleidpatch) | **PATCH** /admin/roles/{roleId} | Update role
[**adminRolesRoleIdPermissionsGet**](AdminApi.md#adminrolesroleidpermissionsget) | **GET** /admin/roles/{roleId}/permissions | Get role permissions
[**adminRolesRoleIdPermissionsPut**](AdminApi.md#adminrolesroleidpermissionsput) | **PUT** /admin/roles/{roleId}/permissions | Update role permissions
[**adminRolesRoleIdUsersGet**](AdminApi.md#adminrolesroleidusersget) | **GET** /admin/roles/{roleId}/users | Get users with role
[**adminSettingsAgreementsPatch**](AdminApi.md#adminsettingsagreementspatch) | **PATCH** /admin/settings/agreements | Update agreement versions
[**adminSettingsGet**](AdminApi.md#adminsettingsget) | **GET** /admin/settings | Get server settings
[**adminSettingsSignupPatch**](AdminApi.md#adminsettingssignuppatch) | **PATCH** /admin/settings/signup | Update signup enabled
[**adminUsersGet**](AdminApi.md#adminusersget) | **GET** /admin/users | Search users
[**adminUsersUserIdAvatarDelete**](AdminApi.md#adminusersuseridavatardelete) | **DELETE** /admin/users/{userId}/avatar | Delete user avatar
[**adminUsersUserIdBanDelete**](AdminApi.md#adminusersuseridbandelete) | **DELETE** /admin/users/{userId}/ban | Unban user
[**adminUsersUserIdBanPost**](AdminApi.md#adminusersuseridbanpost) | **POST** /admin/users/{userId}/ban | Ban user
[**adminUsersUserIdBioDelete**](AdminApi.md#adminusersuseridbiodelete) | **DELETE** /admin/users/{userId}/bio | Delete user bio
[**adminUsersUserIdDisplayNameDelete**](AdminApi.md#adminusersuseriddisplaynamedelete) | **DELETE** /admin/users/{userId}/display-name | Delete user display name
[**adminUsersUserIdModerationLogsGet**](AdminApi.md#adminusersuseridmoderationlogsget) | **GET** /admin/users/{userId}/moderation-logs | Get moderation logs for specific user
[**adminUsersUserIdMutesDelete**](AdminApi.md#adminusersuseridmutesdelete) | **DELETE** /admin/users/{userId}/mutes | Remove all user mutes
[**adminUsersUserIdMutesGet**](AdminApi.md#adminusersuseridmutesget) | **GET** /admin/users/{userId}/mutes | List user mutes
[**adminUsersUserIdMutesMuteTypeDelete**](AdminApi.md#adminusersuseridmutesmutetypedelete) | **DELETE** /admin/users/{userId}/mutes/{muteType} | Remove specific user mute type
[**adminUsersUserIdMutesPost**](AdminApi.md#adminusersuseridmutespost) | **POST** /admin/users/{userId}/mutes | Create user mute
[**adminUsersUserIdNoteDelete**](AdminApi.md#adminusersuseridnotedelete) | **DELETE** /admin/users/{userId}/note | Delete admin note for user
[**adminUsersUserIdNoteGet**](AdminApi.md#adminusersuseridnoteget) | **GET** /admin/users/{userId}/note | Get admin note for user
[**adminUsersUserIdNotePut**](AdminApi.md#adminusersuseridnoteput) | **PUT** /admin/users/{userId}/note | Create or update admin note for user
[**adminUsersUserIdPermissionsGet**](AdminApi.md#adminusersuseridpermissionsget) | **GET** /admin/users/{userId}/permissions | Get user permission overrides
[**adminUsersUserIdPermissionsPut**](AdminApi.md#adminusersuseridpermissionsput) | **PUT** /admin/users/{userId}/permissions | Replace user permission overrides
[**adminUsersUserIdRolesGet**](AdminApi.md#adminusersuseridrolesget) | **GET** /admin/users/{userId}/roles | Get user roles
[**adminUsersUserIdRolesPut**](AdminApi.md#adminusersuseridrolesput) | **PUT** /admin/users/{userId}/roles | Replace user roles
[**adminUsersUserIdStatsGet**](AdminApi.md#adminusersuseridstatsget) | **GET** /admin/users/{userId}/stats | Get user statistics
[**getAdminDashboardStats**](AdminApi.md#getadmindashboardstats) | **GET** /admin/dashboard/stats | Get dashboard statistics


# **adminAgreementsDocumentsDocumentIdDelete**
> adminAgreementsDocumentsDocumentIdDelete(documentId)

Delete agreement document draft

Delete a draft agreement document (published documents cannot be deleted)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String documentId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminAgreementsDocumentsDocumentIdDelete(documentId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsDocumentIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **documentId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminAgreementsDocumentsDocumentIdDuplicatePost**
> AgreementDocument adminAgreementsDocumentsDocumentIdDuplicatePost(documentId, adminAgreementsDocumentsDocumentIdDuplicatePostRequest)

Duplicate agreement document

Create a new draft by duplicating an existing document

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String documentId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final AdminAgreementsDocumentsDocumentIdDuplicatePostRequest adminAgreementsDocumentsDocumentIdDuplicatePostRequest = ; // AdminAgreementsDocumentsDocumentIdDuplicatePostRequest | 

try {
    final response = api.adminAgreementsDocumentsDocumentIdDuplicatePost(documentId, adminAgreementsDocumentsDocumentIdDuplicatePostRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsDocumentIdDuplicatePost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **documentId** | **String**|  | 
 **adminAgreementsDocumentsDocumentIdDuplicatePostRequest** | [**AdminAgreementsDocumentsDocumentIdDuplicatePostRequest**](AdminAgreementsDocumentsDocumentIdDuplicatePostRequest.md)|  | 

### Return type

[**AgreementDocument**](AgreementDocument.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminAgreementsDocumentsDocumentIdGet**
> AgreementDocument adminAgreementsDocumentsDocumentIdGet(documentId)

Get agreement document

Retrieve a specific agreement document

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String documentId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminAgreementsDocumentsDocumentIdGet(documentId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsDocumentIdGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **documentId** | **String**|  | 

### Return type

[**AgreementDocument**](AgreementDocument.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminAgreementsDocumentsDocumentIdPatch**
> AgreementDocument adminAgreementsDocumentsDocumentIdPatch(documentId, updateAgreementDocumentRequest)

Update agreement document draft

Update a draft agreement document (published documents cannot be edited)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String documentId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final UpdateAgreementDocumentRequest updateAgreementDocumentRequest = ; // UpdateAgreementDocumentRequest | 

try {
    final response = api.adminAgreementsDocumentsDocumentIdPatch(documentId, updateAgreementDocumentRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsDocumentIdPatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **documentId** | **String**|  | 
 **updateAgreementDocumentRequest** | [**UpdateAgreementDocumentRequest**](UpdateAgreementDocumentRequest.md)|  | 

### Return type

[**AgreementDocument**](AgreementDocument.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminAgreementsDocumentsDocumentIdPublishPost**
> AgreementDocument adminAgreementsDocumentsDocumentIdPublishPost(documentId)

Publish agreement document

Publish a draft agreement document (makes it immutable and public)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String documentId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminAgreementsDocumentsDocumentIdPublishPost(documentId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsDocumentIdPublishPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **documentId** | **String**|  | 

### Return type

[**AgreementDocument**](AgreementDocument.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminAgreementsDocumentsGet**
> AgreementDocumentPage adminAgreementsDocumentsGet(limit, offset, status, language, type)

List agreement documents

List all agreement documents (drafts and published) with filters

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 
final AgreementDocumentStatus status = ; // AgreementDocumentStatus | Filter by publication status
final AgreementLanguage language = ; // AgreementLanguage | Filter by language
final AgreementType type = ; // AgreementType | Filter by agreement type

try {
    final response = api.adminAgreementsDocumentsGet(limit, offset, status, language, type);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]
 **status** | [**AgreementDocumentStatus**](.md)| Filter by publication status | [optional] 
 **language** | [**AgreementLanguage**](.md)| Filter by language | [optional] 
 **type** | [**AgreementType**](.md)| Filter by agreement type | [optional] 

### Return type

[**AgreementDocumentPage**](AgreementDocumentPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminAgreementsDocumentsHistoryGet**
> BuiltList<AgreementDocument> adminAgreementsDocumentsHistoryGet(type, language)

Get agreement version history

Get all published versions of an agreement type and language

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final AgreementType type = ; // AgreementType | 
final AgreementLanguage language = ; // AgreementLanguage | 

try {
    final response = api.adminAgreementsDocumentsHistoryGet(type, language);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsHistoryGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**AgreementType**](.md)|  | 
 **language** | [**AgreementLanguage**](.md)|  | 

### Return type

[**BuiltList&lt;AgreementDocument&gt;**](AgreementDocument.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminAgreementsDocumentsPost**
> AgreementDocument adminAgreementsDocumentsPost(createAgreementDocumentRequest)

Create agreement document draft

Create a new agreement document draft

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final CreateAgreementDocumentRequest createAgreementDocumentRequest = ; // CreateAgreementDocumentRequest | 

try {
    final response = api.adminAgreementsDocumentsPost(createAgreementDocumentRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminAgreementsDocumentsPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createAgreementDocumentRequest** | [**CreateAgreementDocumentRequest**](CreateAgreementDocumentRequest.md)|  | 

### Return type

[**AgreementDocument**](AgreementDocument.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedImagesGet**
> BuiltList<BannedImageHash> adminBannedImagesGet()

List banned image hashes

List all banned image hashes

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();

try {
    final response = api.adminBannedImagesGet();
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedImagesGet: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**BuiltList&lt;BannedImageHash&gt;**](BannedImageHash.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedImagesHashIdDelete**
> adminBannedImagesHashIdDelete(hashId)

Delete banned image hash

Remove a banned image hash

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String hashId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminBannedImagesHashIdDelete(hashId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedImagesHashIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **hashId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedImagesHashIdGet**
> BannedImageHash adminBannedImagesHashIdGet(hashId)

Get banned image hash

Retrieve a specific banned image hash

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String hashId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminBannedImagesHashIdGet(hashId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedImagesHashIdGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **hashId** | **String**|  | 

### Return type

[**BannedImageHash**](BannedImageHash.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedImagesPost**
> BannedImageHash adminBannedImagesPost(createBannedImageHashRequest)

Add banned image hash

Create a new banned image hash

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final CreateBannedImageHashRequest createBannedImageHashRequest = ; // CreateBannedImageHashRequest | 

try {
    final response = api.adminBannedImagesPost(createBannedImageHashRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedImagesPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createBannedImageHashRequest** | [**CreateBannedImageHashRequest**](CreateBannedImageHashRequest.md)|  | 

### Return type

[**BannedImageHash**](BannedImageHash.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedWordsGet**
> BuiltList<BannedWord> adminBannedWordsGet(appliesTo)

List banned words

List all banned word patterns

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final BannedWordAppliesTo appliesTo = ; // BannedWordAppliesTo | Filter by where the pattern applies

try {
    final response = api.adminBannedWordsGet(appliesTo);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedWordsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **appliesTo** | [**BannedWordAppliesTo**](.md)| Filter by where the pattern applies | [optional] 

### Return type

[**BuiltList&lt;BannedWord&gt;**](BannedWord.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedWordsPost**
> BannedWord adminBannedWordsPost(createBannedWordRequest)

Add banned word pattern

Create a new banned word pattern

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final CreateBannedWordRequest createBannedWordRequest = ; // CreateBannedWordRequest | 

try {
    final response = api.adminBannedWordsPost(createBannedWordRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedWordsPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createBannedWordRequest** | [**CreateBannedWordRequest**](CreateBannedWordRequest.md)|  | 

### Return type

[**BannedWord**](BannedWord.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedWordsWordIdDelete**
> adminBannedWordsWordIdDelete(wordId)

Delete banned word

Remove a banned word pattern

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String wordId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminBannedWordsWordIdDelete(wordId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedWordsWordIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wordId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminBannedWordsWordIdGet**
> BannedWord adminBannedWordsWordIdGet(wordId)

Get banned word

Retrieve a specific banned word pattern

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String wordId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminBannedWordsWordIdGet(wordId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminBannedWordsWordIdGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wordId** | **String**|  | 

### Return type

[**BannedWord**](BannedWord.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminEmojisEmojiIdDelete**
> adminEmojisEmojiIdDelete(emojiId)

Delete a custom emoji

Permanently deletes the emoji and its image file.

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String emojiId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminEmojisEmojiIdDelete(emojiId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminEmojisEmojiIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **emojiId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminEmojisEmojiIdPut**
> AdminEmoji adminEmojisEmojiIdPut(emojiId, shortcode, name, setName, category, setCategory, license, setLicense, image)

Update a custom emoji

Update shortcode, name, category, license, and/or image of an existing emoji.

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String emojiId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final String shortcode = shortcode_example; // String | Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible).
final String name = name_example; // String | Display name. Send empty string to clear.
final bool setName = true; // bool | Must be true to update the name field (including clearing it).
final String category = category_example; // String | Category. Send empty string to clear.
final bool setCategory = true; // bool | Must be true to update the category field.
final String license = license_example; // String | License. Send empty string to clear.
final bool setLicense = true; // bool | Must be true to update the license field.
final MultipartFile image = BINARY_DATA_HERE; // MultipartFile | New emoji image (optional). Replaces the existing image.

try {
    final response = api.adminEmojisEmojiIdPut(emojiId, shortcode, name, setName, category, setCategory, license, setLicense, image);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminEmojisEmojiIdPut: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **emojiId** | **String**|  | 
 **shortcode** | **String**| Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible). | [optional] 
 **name** | **String**| Display name. Send empty string to clear. | [optional] 
 **setName** | **bool**| Must be true to update the name field (including clearing it). | [optional] 
 **category** | **String**| Category. Send empty string to clear. | [optional] 
 **setCategory** | **bool**| Must be true to update the category field. | [optional] 
 **license** | **String**| License. Send empty string to clear. | [optional] 
 **setLicense** | **bool**| Must be true to update the license field. | [optional] 
 **image** | **MultipartFile**| New emoji image (optional). Replaces the existing image. | [optional] 

### Return type

[**AdminEmoji**](AdminEmoji.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminEmojisGet**
> AdminEmojiListResponse adminEmojisGet(limit, offset)

List custom emojis (admin view)

Returns all custom emojis including admin-only fields (id, createdAt, updatedAt, width, height).

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 

try {
    final response = api.adminEmojisGet(limit, offset);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminEmojisGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 50]
 **offset** | **int**|  | [optional] [default to 0]

### Return type

[**AdminEmojiListResponse**](AdminEmojiListResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminEmojisPost**
> AdminEmoji adminEmojisPost(shortcode, image, name, category, license)

Create a custom emoji

Upload an image and create a new custom emoji. Image is resized to configured height (default 128px) and converted to WebP.

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String shortcode = shortcode_example; // String | Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible).
final MultipartFile image = BINARY_DATA_HERE; // MultipartFile | Emoji image file (png, jpg, jpeg, webp, gif). Max 15 MiB, max 2048x2048.
final String name = name_example; // String | Optional display name.
final String category = category_example; // String | Optional category for grouping emojis.
final String license = license_example; // String | Optional license information for the emoji image.

try {
    final response = api.adminEmojisPost(shortcode, image, name, category, license);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminEmojisPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **shortcode** | **String**| Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible). | 
 **image** | **MultipartFile**| Emoji image file (png, jpg, jpeg, webp, gif). Max 15 MiB, max 2048x2048. | 
 **name** | **String**| Optional display name. | [optional] 
 **category** | **String**| Optional category for grouping emojis. | [optional] 
 **license** | **String**| Optional license information for the emoji image. | [optional] 

### Return type

[**AdminEmoji**](AdminEmoji.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminInvitesGet**
> InviteCodesListResponse adminInvitesGet(limit, offset)

List invite codes

Get paginated list of invite codes with usage information

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 

try {
    final response = api.adminInvitesGet(limit, offset);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminInvitesGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 50]
 **offset** | **int**|  | [optional] [default to 0]

### Return type

[**InviteCodesListResponse**](InviteCodesListResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminInvitesInviteIdDelete**
> adminInvitesInviteIdDelete(inviteId)

Delete invite code

Permanently delete an invite code

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String inviteId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminInvitesInviteIdDelete(inviteId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminInvitesInviteIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inviteId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminInvitesInviteIdDisablePatch**
> adminInvitesInviteIdDisablePatch(inviteId)

Disable invite code

Soft-delete an invite code by marking it as disabled

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String inviteId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminInvitesInviteIdDisablePatch(inviteId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminInvitesInviteIdDisablePatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inviteId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminInvitesInviteIdGet**
> InviteCode adminInvitesInviteIdGet(inviteId)

Get invite code details

Get detailed information about a specific invite code

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String inviteId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminInvitesInviteIdGet(inviteId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminInvitesInviteIdGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inviteId** | **String**|  | 

### Return type

[**InviteCode**](InviteCode.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminInvitesInviteIdPatch**
> InviteCode adminInvitesInviteIdPatch(inviteId, updateInviteCodeRequest)

Update invite code

Update invite code properties (code, maxUses, expiresAt, note)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String inviteId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final UpdateInviteCodeRequest updateInviteCodeRequest = ; // UpdateInviteCodeRequest | 

try {
    final response = api.adminInvitesInviteIdPatch(inviteId, updateInviteCodeRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminInvitesInviteIdPatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inviteId** | **String**|  | 
 **updateInviteCodeRequest** | [**UpdateInviteCodeRequest**](UpdateInviteCodeRequest.md)|  | 

### Return type

[**InviteCode**](InviteCode.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminInvitesInviteIdUsesGet**
> BuiltList<InviteCodeUse> adminInvitesInviteIdUsesGet(inviteId)

Get invite code usage history

Get list of users who used this invite code

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String inviteId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminInvitesInviteIdUsesGet(inviteId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminInvitesInviteIdUsesGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inviteId** | **String**|  | 

### Return type

[**BuiltList&lt;InviteCodeUse&gt;**](InviteCodeUse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminInvitesPost**
> InviteCode adminInvitesPost(createInviteCodeRequest)

Create invite code

Create a new invite code with optional usage limits and expiration

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final CreateInviteCodeRequest createInviteCodeRequest = ; // CreateInviteCodeRequest | 

try {
    final response = api.adminInvitesPost(createInviteCodeRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminInvitesPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createInviteCodeRequest** | [**CreateInviteCodeRequest**](CreateInviteCodeRequest.md)|  | 

### Return type

[**InviteCode**](InviteCode.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminIpBansBanIdDelete**
> adminIpBansBanIdDelete(banId)

Delete IP ban by ID

Remove an IP ban by its ID

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String banId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminIpBansBanIdDelete(banId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminIpBansBanIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **banId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminIpBansDelete**
> adminIpBansDelete(ipAddress)

Delete IP ban by address

Remove an IP ban by IP address (query parameter)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String ipAddress = ipAddress_example; // String | IP address to unban

try {
    api.adminIpBansDelete(ipAddress);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminIpBansDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **ipAddress** | **String**| IP address to unban | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminIpBansGet**
> IPBanPage adminIpBansGet(limit, offset)

List IP bans

List all active IP bans

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 

try {
    final response = api.adminIpBansGet(limit, offset);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminIpBansGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]

### Return type

[**IPBanPage**](IPBanPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminIpBansPost**
> IPBan adminIpBansPost(createIPBanRequest)

Create IP ban

Ban an IP address

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final CreateIPBanRequest createIPBanRequest = ; // CreateIPBanRequest | 

try {
    final response = api.adminIpBansPost(createIPBanRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminIpBansPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createIPBanRequest** | [**CreateIPBanRequest**](CreateIPBanRequest.md)|  | 

### Return type

[**IPBan**](IPBan.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminMediaGet**
> AdminMediaPage adminMediaGet(limit, offset, userId, deleted)

List media (admin view)

List all media with filtering and admin-only fields

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Filter by user ID
final bool deleted = true; // bool | Filter by deletion status

try {
    final response = api.adminMediaGet(limit, offset, userId, deleted);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminMediaGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]
 **userId** | **String**| Filter by user ID | [optional] 
 **deleted** | **bool**| Filter by deletion status | [optional] 

### Return type

[**AdminMediaPage**](AdminMediaPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminMediaMediaIdDelete**
> adminMediaMediaIdDelete(mediaId, deleteMediaRequest)

Delete media (admin)

Permanently delete media with optional reason

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String mediaId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final DeleteMediaRequest deleteMediaRequest = ; // DeleteMediaRequest | 

try {
    api.adminMediaMediaIdDelete(mediaId, deleteMediaRequest);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminMediaMediaIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **mediaId** | **String**|  | 
 **deleteMediaRequest** | [**DeleteMediaRequest**](DeleteMediaRequest.md)|  | [optional] 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminModerationLogsGet**
> ModerationLogPage adminModerationLogsGet(limit, offset, adminUserId, action, targetType, targetId)

List moderation logs

List all moderation logs with optional filters

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 
final String adminUserId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Filter by admin user ID
final ModerationAction action = ; // ModerationAction | Filter by action type
final ModerationTargetType targetType = ; // ModerationTargetType | Filter by target type
final String targetId = targetId_example; // String | Filter by target ID

try {
    final response = api.adminModerationLogsGet(limit, offset, adminUserId, action, targetType, targetId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminModerationLogsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]
 **adminUserId** | **String**| Filter by admin user ID | [optional] 
 **action** | [**ModerationAction**](.md)| Filter by action type | [optional] 
 **targetType** | [**ModerationTargetType**](.md)| Filter by target type | [optional] 
 **targetId** | **String**| Filter by target ID | [optional] 

### Return type

[**ModerationLogPage**](ModerationLogPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminPermissionsGet**
> BuiltList<String> adminPermissionsGet()

List permissions

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();

try {
    final response = api.adminPermissionsGet();
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminPermissionsGet: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

**BuiltList&lt;String&gt;**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminPostsGet**
> AdminPostPage adminPostsGet(limit, offset, userId, visibility)

List posts (admin view)

List all posts with filtering and admin-only fields

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Filter by user ID
final PostVisibility visibility = ; // PostVisibility | Filter by visibility status

try {
    final response = api.adminPostsGet(limit, offset, userId, visibility);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminPostsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]
 **userId** | **String**| Filter by user ID | [optional] 
 **visibility** | [**PostVisibility**](.md)| Filter by visibility status | [optional] 

### Return type

[**AdminPostPage**](AdminPostPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminPostsPostIdDelete**
> adminPostsPostIdDelete(postId, deletePostRequest)

Delete post (admin)

Permanently delete a post with optional reason

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final DeletePostRequest deletePostRequest = ; // DeletePostRequest | 

try {
    api.adminPostsPostIdDelete(postId, deletePostRequest);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminPostsPostIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 
 **deletePostRequest** | [**DeletePostRequest**](DeletePostRequest.md)|  | [optional] 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminPostsPostIdVisibilityPatch**
> AdminPost adminPostsPostIdVisibilityPatch(postId, updatePostVisibilityRequest)

Update post visibility

Change post visibility (public/hidden/deleted)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final UpdatePostVisibilityRequest updatePostVisibilityRequest = ; // UpdatePostVisibilityRequest | 

try {
    final response = api.adminPostsPostIdVisibilityPatch(postId, updatePostVisibilityRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminPostsPostIdVisibilityPatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 
 **updatePostVisibilityRequest** | [**UpdatePostVisibilityRequest**](UpdatePostVisibilityRequest.md)|  | 

### Return type

[**AdminPost**](AdminPost.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminReportsGet**
> ReportPage adminReportsGet(limit, offset, status, targetType)

List all reports

List all reports with optional filters

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 
final ReportStatus status = ; // ReportStatus | Filter by report status
final ReportTargetType targetType = ; // ReportTargetType | Filter by target type

try {
    final response = api.adminReportsGet(limit, offset, status, targetType);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminReportsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]
 **status** | [**ReportStatus**](.md)| Filter by report status | [optional] 
 **targetType** | [**ReportTargetType**](.md)| Filter by target type | [optional] 

### Return type

[**ReportPage**](ReportPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminReportsReportIdGet**
> Report adminReportsReportIdGet(reportId)

Get specific report

Retrieve details of a specific report

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String reportId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminReportsReportIdGet(reportId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminReportsReportIdGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **reportId** | **String**|  | 

### Return type

[**Report**](Report.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminReportsReportIdPatch**
> Report adminReportsReportIdPatch(reportId, updateReportRequest)

Update report status

Review, resolve, or dismiss a report

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String reportId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final UpdateReportRequest updateReportRequest = ; // UpdateReportRequest | 

try {
    final response = api.adminReportsReportIdPatch(reportId, updateReportRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminReportsReportIdPatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **reportId** | **String**|  | 
 **updateReportRequest** | [**UpdateReportRequest**](UpdateReportRequest.md)|  | 

### Return type

[**Report**](Report.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesGet**
> BuiltList<String> adminRolesGet()

List roles

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();

try {
    final response = api.adminRolesGet();
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesGet: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

**BuiltList&lt;String&gt;**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesPost**
> Role adminRolesPost(createRoleRequest)

Create role

Create a new role

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final CreateRoleRequest createRoleRequest = ; // CreateRoleRequest | 

try {
    final response = api.adminRolesPost(createRoleRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createRoleRequest** | [**CreateRoleRequest**](CreateRoleRequest.md)|  | 

### Return type

[**Role**](Role.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesRoleIdDelete**
> adminRolesRoleIdDelete(roleId)

Delete role

Delete a role (cascade deletes user assignments)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String roleId = roleId_example; // String | 

try {
    api.adminRolesRoleIdDelete(roleId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesRoleIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **roleId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesRoleIdGet**
> Role adminRolesRoleIdGet(roleId)

Get role details

Retrieve details of a specific role

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String roleId = roleId_example; // String | 

try {
    final response = api.adminRolesRoleIdGet(roleId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesRoleIdGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **roleId** | **String**|  | 

### Return type

[**Role**](Role.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesRoleIdPatch**
> Role adminRolesRoleIdPatch(roleId, updateRoleRequest)

Update role

Update role name and description

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String roleId = roleId_example; // String | 
final UpdateRoleRequest updateRoleRequest = ; // UpdateRoleRequest | 

try {
    final response = api.adminRolesRoleIdPatch(roleId, updateRoleRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesRoleIdPatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **roleId** | **String**|  | 
 **updateRoleRequest** | [**UpdateRoleRequest**](UpdateRoleRequest.md)|  | 

### Return type

[**Role**](Role.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesRoleIdPermissionsGet**
> RolePermissions adminRolesRoleIdPermissionsGet(roleId)

Get role permissions

Get all permissions assigned to a role

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String roleId = roleId_example; // String | 

try {
    final response = api.adminRolesRoleIdPermissionsGet(roleId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesRoleIdPermissionsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **roleId** | **String**|  | 

### Return type

[**RolePermissions**](RolePermissions.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesRoleIdPermissionsPut**
> RolePermissions adminRolesRoleIdPermissionsPut(roleId, rolePermissions)

Update role permissions

Replace all permissions for a role

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String roleId = roleId_example; // String | 
final RolePermissions rolePermissions = ; // RolePermissions | 

try {
    final response = api.adminRolesRoleIdPermissionsPut(roleId, rolePermissions);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesRoleIdPermissionsPut: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **roleId** | **String**|  | 
 **rolePermissions** | [**RolePermissions**](RolePermissions.md)|  | 

### Return type

[**RolePermissions**](RolePermissions.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminRolesRoleIdUsersGet**
> RoleUsersPage adminRolesRoleIdUsersGet(roleId, limit, offset)

Get users with role

Get all users that have been assigned this role

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String roleId = roleId_example; // String | 
final int limit = 56; // int | 
final int offset = 56; // int | 

try {
    final response = api.adminRolesRoleIdUsersGet(roleId, limit, offset);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminRolesRoleIdUsersGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **roleId** | **String**|  | 
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]

### Return type

[**RoleUsersPage**](RoleUsersPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminSettingsAgreementsPatch**
> AgreementVersions adminSettingsAgreementsPatch(updateAgreementVersionsRequest)

Update agreement versions

Update Terms of Service and/or Privacy Policy versions (admin only)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final UpdateAgreementVersionsRequest updateAgreementVersionsRequest = ; // UpdateAgreementVersionsRequest | 

try {
    final response = api.adminSettingsAgreementsPatch(updateAgreementVersionsRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminSettingsAgreementsPatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateAgreementVersionsRequest** | [**UpdateAgreementVersionsRequest**](UpdateAgreementVersionsRequest.md)|  | 

### Return type

[**AgreementVersions**](AgreementVersions.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminSettingsGet**
> ServerSettings adminSettingsGet()

Get server settings

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();

try {
    final response = api.adminSettingsGet();
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminSettingsGet: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerSettings**](ServerSettings.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminSettingsSignupPatch**
> ServerSettings adminSettingsSignupPatch(updateSignupEnabledRequest)

Update signup enabled

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final UpdateSignupEnabledRequest updateSignupEnabledRequest = ; // UpdateSignupEnabledRequest | 

try {
    final response = api.adminSettingsSignupPatch(updateSignupEnabledRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminSettingsSignupPatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateSignupEnabledRequest** | [**UpdateSignupEnabledRequest**](UpdateSignupEnabledRequest.md)|  | 

### Return type

[**ServerSettings**](ServerSettings.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersGet**
> AdminUserPage adminUsersGet(limit, offset, search, sort)

Search users

Search and list users with filters, pagination, and stats

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final int limit = 56; // int | 
final int offset = 56; // int | 
final String search = search_example; // String | Search by username or display name
final String sort = sort_example; // String | Sort order

try {
    final response = api.adminUsersGet(limit, offset, search, sort);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]
 **search** | **String**| Search by username or display name | [optional] 
 **sort** | **String**| Sort order | [optional] [default to 'created_desc']

### Return type

[**AdminUserPage**](AdminUserPage.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdAvatarDelete**
> adminUsersUserIdAvatarDelete(userId)

Delete user avatar

Remove user's avatar image

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminUsersUserIdAvatarDelete(userId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdAvatarDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdBanDelete**
> adminUsersUserIdBanDelete(userId)

Unban user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminUsersUserIdBanDelete(userId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdBanDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdBanPost**
> adminUsersUserIdBanPost(userId, banUserRequest)

Ban user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final BanUserRequest banUserRequest = ; // BanUserRequest | 

try {
    api.adminUsersUserIdBanPost(userId, banUserRequest);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdBanPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 
 **banUserRequest** | [**BanUserRequest**](BanUserRequest.md)|  | [optional] 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdBioDelete**
> adminUsersUserIdBioDelete(userId)

Delete user bio

Remove user's bio

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminUsersUserIdBioDelete(userId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdBioDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdDisplayNameDelete**
> adminUsersUserIdDisplayNameDelete(userId)

Delete user display name

Remove user's display name

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminUsersUserIdDisplayNameDelete(userId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdDisplayNameDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdModerationLogsGet**
> BuiltList<ModerationLog> adminUsersUserIdModerationLogsGet(userId, limit, offset)

Get moderation logs for specific user

Retrieve moderation logs where the user is the target

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final int limit = 56; // int | 
final int offset = 56; // int | 

try {
    final response = api.adminUsersUserIdModerationLogsGet(userId, limit, offset);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdModerationLogsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 
 **limit** | **int**|  | [optional] [default to 20]
 **offset** | **int**|  | [optional] [default to 0]

### Return type

[**BuiltList&lt;ModerationLog&gt;**](ModerationLog.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdMutesDelete**
> adminUsersUserIdMutesDelete(userId)

Remove all user mutes

Remove all active mutes for a user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminUsersUserIdMutesDelete(userId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdMutesDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdMutesGet**
> BuiltList<UserMute> adminUsersUserIdMutesGet(userId)

List user mutes

List all active mutes for a user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminUsersUserIdMutesGet(userId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdMutesGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

[**BuiltList&lt;UserMute&gt;**](UserMute.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdMutesMuteTypeDelete**
> adminUsersUserIdMutesMuteTypeDelete(userId, muteType)

Remove specific user mute type

Remove a specific mute type for a user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final MuteType muteType = ; // MuteType | 

try {
    api.adminUsersUserIdMutesMuteTypeDelete(userId, muteType);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdMutesMuteTypeDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 
 **muteType** | [**MuteType**](.md)|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdMutesPost**
> UserMute adminUsersUserIdMutesPost(userId, createUserMuteRequest)

Create user mute

Create a new mute for a user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final CreateUserMuteRequest createUserMuteRequest = ; // CreateUserMuteRequest | 

try {
    final response = api.adminUsersUserIdMutesPost(userId, createUserMuteRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdMutesPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 
 **createUserMuteRequest** | [**CreateUserMuteRequest**](CreateUserMuteRequest.md)|  | 

### Return type

[**UserMute**](UserMute.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdNoteDelete**
> adminUsersUserIdNoteDelete(userId)

Delete admin note for user

Delete admin notes for a specific user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.adminUsersUserIdNoteDelete(userId);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdNoteDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdNoteGet**
> AdminUserNote adminUsersUserIdNoteGet(userId)

Get admin note for user

Retrieve admin notes for a specific user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminUsersUserIdNoteGet(userId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdNoteGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

[**AdminUserNote**](AdminUserNote.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdNotePut**
> AdminUserNote adminUsersUserIdNotePut(userId, createAdminUserNoteRequest)

Create or update admin note for user

Create or update admin notes for a specific user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final CreateAdminUserNoteRequest createAdminUserNoteRequest = ; // CreateAdminUserNoteRequest | 

try {
    final response = api.adminUsersUserIdNotePut(userId, createAdminUserNoteRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdNotePut: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 
 **createAdminUserNoteRequest** | [**CreateAdminUserNoteRequest**](CreateAdminUserNoteRequest.md)|  | 

### Return type

[**AdminUserNote**](AdminUserNote.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdPermissionsGet**
> UserPermissionOverrides adminUsersUserIdPermissionsGet(userId)

Get user permission overrides

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminUsersUserIdPermissionsGet(userId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdPermissionsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

[**UserPermissionOverrides**](UserPermissionOverrides.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdPermissionsPut**
> UserPermissionOverrides adminUsersUserIdPermissionsPut(userId, userPermissionOverrides)

Replace user permission overrides

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final UserPermissionOverrides userPermissionOverrides = ; // UserPermissionOverrides | 

try {
    final response = api.adminUsersUserIdPermissionsPut(userId, userPermissionOverrides);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdPermissionsPut: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 
 **userPermissionOverrides** | [**UserPermissionOverrides**](UserPermissionOverrides.md)|  | 

### Return type

[**UserPermissionOverrides**](UserPermissionOverrides.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdRolesGet**
> BuiltList<String> adminUsersUserIdRolesGet(userId)

Get user roles

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminUsersUserIdRolesGet(userId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdRolesGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

**BuiltList&lt;String&gt;**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdRolesPut**
> BuiltList<String> adminUsersUserIdRolesPut(userId, userRolesUpdateRequest)

Replace user roles

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final UserRolesUpdateRequest userRolesUpdateRequest = ; // UserRolesUpdateRequest | 

try {
    final response = api.adminUsersUserIdRolesPut(userId, userRolesUpdateRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdRolesPut: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 
 **userRolesUpdateRequest** | [**UserRolesUpdateRequest**](UserRolesUpdateRequest.md)|  | 

### Return type

**BuiltList&lt;String&gt;**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminUsersUserIdStatsGet**
> UserStats adminUsersUserIdStatsGet(userId)

Get user statistics

Retrieve detailed statistics for a specific user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();
final String userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.adminUsersUserIdStatsGet(userId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->adminUsersUserIdStatsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **userId** | **String**|  | 

### Return type

[**UserStats**](UserStats.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAdminDashboardStats**
> DashboardStats getAdminDashboardStats()

Get dashboard statistics

Retrieve system-wide statistics for the admin dashboard

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAdminApi();

try {
    final response = api.getAdminDashboardStats();
    print(response);
} catch on DioException (e) {
    print('Exception when calling AdminApi->getAdminDashboardStats: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**DashboardStats**](DashboardStats.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

