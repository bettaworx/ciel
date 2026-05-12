# ciel_api.api.UsersApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**meAgreementsPost**](UsersApi.md#meagreementspost) | **POST** /me/agreements | Accept agreements
[**meAvatarPost**](UsersApi.md#meavatarpost) | **POST** /me/avatar | Update current user avatar
[**meBannerPost**](UsersApi.md#mebannerpost) | **POST** /me/banner | Update current user banner
[**meDelete**](UsersApi.md#medelete) | **DELETE** /me | Delete current user (step-up required)
[**meGet**](UsersApi.md#meget) | **GET** /me | Get current user
[**meProfilePatch**](UsersApi.md#meprofilepatch) | **PATCH** /me/profile | Update current user profile
[**meUsernamePatch**](UsersApi.md#meusernamepatch) | **PATCH** /me/username | Change username (step-up required)
[**usersUsernameGet**](UsersApi.md#usersusernameget) | **GET** /users/{username} | Get user by username
[**usersUsernamePostsGet**](UsersApi.md#usersusernamepostsget) | **GET** /users/{username}/posts | List posts by user


# **meAgreementsPost**
> meAgreementsPost(acceptAgreementsRequest)

Accept agreements

Record user acceptance of Terms of Service and/or Privacy Policy

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final AcceptAgreementsRequest acceptAgreementsRequest = ; // AcceptAgreementsRequest | 

try {
    api.meAgreementsPost(acceptAgreementsRequest);
} catch on DioException (e) {
    print('Exception when calling UsersApi->meAgreementsPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **acceptAgreementsRequest** | [**AcceptAgreementsRequest**](AcceptAgreementsRequest.md)|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **meAvatarPost**
> User meAvatarPost(file)

Update current user avatar

Upload an avatar image for the current user.  **Allowed formats:** PNG, JPG, JPEG, WebP, GIF   **File size limit:** 15 MiB (increased from 12 MiB) **Input dimension limits:** 16384x16384 pixels, 100 megapixels total   **Output resolution:** 400x400px (square, center-cropped)   **Quality:** 50 (optimized for file size)  **Processing:** - Images scaled to cover 400x400 - Center-cropped to square aspect ratio - Metadata stripped (EXIF/XMP/GPS) - Converted to static WebP format  **GIF handling:** - Animated GIFs accepted as input - Only the first frame is used (static output) - Final result is a 400x400px static WebP image  **Auto-cleanup:** - Previous avatar automatically deleted after successful upload 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final MultipartFile file = BINARY_DATA_HERE; // MultipartFile | Image file (PNG/JPG/WebP/GIF)

try {
    final response = api.meAvatarPost(file);
    print(response);
} catch on DioException (e) {
    print('Exception when calling UsersApi->meAvatarPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file** | **MultipartFile**| Image file (PNG/JPG/WebP/GIF) | 

### Return type

[**User**](User.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **meBannerPost**
> User meBannerPost(file)

Update current user banner

Upload a profile banner image for the current user.  **Allowed formats:** PNG, JPG, JPEG, WebP, GIF   **File size limit:** 15 MiB   **Input dimension limits:** 16384x16384 pixels, 100 megapixels total   **Output resolution:** 1500x500px (center-cropped)   **Quality:** Configurable via `media.banner` in config.yaml  **Processing:** - Images scaled to cover 1500x500 - Center-cropped to 3:1 aspect ratio - Metadata stripped (EXIF/XMP/GPS) - Converted to WebP format  **GIF handling:** - Animated GIFs accepted as input - Converted to animated WebP - All frames preserved  **Auto-cleanup:** - Previous banner automatically deleted after successful upload 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final MultipartFile file = BINARY_DATA_HERE; // MultipartFile | Banner image file (PNG/JPG/WebP/GIF)

try {
    final response = api.meBannerPost(file);
    print(response);
} catch on DioException (e) {
    print('Exception when calling UsersApi->meBannerPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file** | **MultipartFile**| Banner image file (PNG/JPG/WebP/GIF) | 

### Return type

[**User**](User.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **meDelete**
> meDelete(xStepupToken)

Delete current user (step-up required)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final String xStepupToken = xStepupToken_example; // String | Short-lived step-up token.

try {
    api.meDelete(xStepupToken);
} catch on DioException (e) {
    print('Exception when calling UsersApi->meDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **xStepupToken** | **String**| Short-lived step-up token. | [optional] 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **meGet**
> User meGet()

Get current user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();

try {
    final response = api.meGet();
    print(response);
} catch on DioException (e) {
    print('Exception when calling UsersApi->meGet: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**User**](User.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **meProfilePatch**
> User meProfilePatch(updateProfileRequest)

Update current user profile

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final UpdateProfileRequest updateProfileRequest = ; // UpdateProfileRequest | 

try {
    final response = api.meProfilePatch(updateProfileRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling UsersApi->meProfilePatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateProfileRequest** | [**UpdateProfileRequest**](UpdateProfileRequest.md)|  | 

### Return type

[**User**](User.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **meUsernamePatch**
> LoginFinishResponse meUsernamePatch(updateUsernameRequest, xStepupToken)

Change username (step-up required)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final UpdateUsernameRequest updateUsernameRequest = ; // UpdateUsernameRequest | 
final String xStepupToken = xStepupToken_example; // String | Short-lived step-up token.

try {
    final response = api.meUsernamePatch(updateUsernameRequest, xStepupToken);
    print(response);
} catch on DioException (e) {
    print('Exception when calling UsersApi->meUsernamePatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateUsernameRequest** | [**UpdateUsernameRequest**](UpdateUsernameRequest.md)|  | 
 **xStepupToken** | **String**| Short-lived step-up token. | [optional] 

### Return type

[**LoginFinishResponse**](LoginFinishResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersUsernameGet**
> User usersUsernameGet(username)

Get user by username

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final String username = username_example; // String | 

try {
    final response = api.usersUsernameGet(username);
    print(response);
} catch on DioException (e) {
    print('Exception when calling UsersApi->usersUsernameGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **username** | **String**|  | 

### Return type

[**User**](User.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **usersUsernamePostsGet**
> UserPostsPage usersUsernamePostsGet(username, limit, cursor, mediaType)

List posts by user

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getUsersApi();
final String username = username_example; // String | 
final int limit = 56; // int | 
final String cursor = cursor_example; // String | Cursor returned by previous call.
final PostMediaFilter mediaType = ; // PostMediaFilter | Filter posts by attached media type.

try {
    final response = api.usersUsernamePostsGet(username, limit, cursor, mediaType);
    print(response);
} catch on DioException (e) {
    print('Exception when calling UsersApi->usersUsernamePostsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **username** | **String**|  | 
 **limit** | **int**|  | [optional] 
 **cursor** | **String**| Cursor returned by previous call. | [optional] 
 **mediaType** | [**PostMediaFilter**](.md)| Filter posts by attached media type. | [optional] 

### Return type

[**UserPostsPage**](UserPostsPage.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

