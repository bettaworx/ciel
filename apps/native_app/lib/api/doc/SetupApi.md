# ciel_api.api.SetupApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**setupCompletePatch**](SetupApi.md#setupcompletepatch) | **PATCH** /setup/complete | Complete server setup
[**setupCreateAdminPost**](SetupApi.md#setupcreateadminpost) | **POST** /setup/create-admin | Create admin account
[**setupCreateInvitePost**](SetupApi.md#setupcreateinvitepost) | **POST** /setup/create-invite | Create invite code during setup
[**setupStatusGet**](SetupApi.md#setupstatusget) | **GET** /setup/status | Get server setup status
[**setupVerifyPasswordPost**](SetupApi.md#setupverifypasswordpost) | **POST** /setup/verify-password | Verify setup password


# **setupCompletePatch**
> ServerSetupResponse setupCompletePatch(serverSetupRequest)

Complete server setup

Finalize server setup with configuration

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getSetupApi();
final ServerSetupRequest serverSetupRequest = ; // ServerSetupRequest | 

try {
    final response = api.setupCompletePatch(serverSetupRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling SetupApi->setupCompletePatch: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **serverSetupRequest** | [**ServerSetupRequest**](ServerSetupRequest.md)|  | 

### Return type

[**ServerSetupResponse**](ServerSetupResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setupCreateAdminPost**
> CreateAdminResponse setupCreateAdminPost(createAdminRequest)

Create admin account

Create the initial admin account during server setup

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getSetupApi();
final CreateAdminRequest createAdminRequest = ; // CreateAdminRequest | 

try {
    final response = api.setupCreateAdminPost(createAdminRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling SetupApi->setupCreateAdminPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createAdminRequest** | [**CreateAdminRequest**](CreateAdminRequest.md)|  | 

### Return type

[**CreateAdminResponse**](CreateAdminResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setupCreateInvitePost**
> InviteCode setupCreateInvitePost(createInviteCodeRequest)

Create invite code during setup

Create the initial invite code during admin setup wizard

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getSetupApi();
final CreateInviteCodeRequest createInviteCodeRequest = ; // CreateInviteCodeRequest | 

try {
    final response = api.setupCreateInvitePost(createInviteCodeRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling SetupApi->setupCreateInvitePost: $e\n');
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

# **setupStatusGet**
> SetupStatusResponse setupStatusGet()

Get server setup status

Check if the initial server setup has been completed

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getSetupApi();

try {
    final response = api.setupStatusGet();
    print(response);
} catch on DioException (e) {
    print('Exception when calling SetupApi->setupStatusGet: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SetupStatusResponse**](SetupStatusResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setupVerifyPasswordPost**
> VerifySetupPasswordResponse setupVerifyPasswordPost(verifySetupPasswordRequest)

Verify setup password

Verify the initial setup password from environment variable

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getSetupApi();
final VerifySetupPasswordRequest verifySetupPasswordRequest = ; // VerifySetupPasswordRequest | 

try {
    final response = api.setupVerifyPasswordPost(verifySetupPasswordRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling SetupApi->setupVerifyPasswordPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **verifySetupPasswordRequest** | [**VerifySetupPasswordRequest**](VerifySetupPasswordRequest.md)|  | 

### Return type

[**VerifySetupPasswordResponse**](VerifySetupPasswordResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

