# ciel_api.api.AuthApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**authLoginFinishPost**](AuthApi.md#authloginfinishpost) | **POST** /auth/login/finish | Finish challenge-response login
[**authLoginStartPost**](AuthApi.md#authloginstartpost) | **POST** /auth/login/start | Start challenge-response login
[**authLogoutPost**](AuthApi.md#authlogoutpost) | **POST** /auth/logout | Logout
[**authPasswordChangePost**](AuthApi.md#authpasswordchangepost) | **POST** /auth/password/change | Change password (step-up required)
[**authRefreshPost**](AuthApi.md#authrefreshpost) | **POST** /auth/refresh | Refresh access token
[**authRegisterPost**](AuthApi.md#authregisterpost) | **POST** /auth/register | Register a new user
[**authStepupFinishPost**](AuthApi.md#authstepupfinishpost) | **POST** /auth/stepup/finish | Finish step-up authentication
[**authStepupStartPost**](AuthApi.md#authstepupstartpost) | **POST** /auth/stepup/start | Start step-up authentication


# **authLoginFinishPost**
> LoginFinishResponse authLoginFinishPost(loginFinishRequest)

Finish challenge-response login

Verifies `clientProof` for the one-time challenge. On success returns an access token. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();
final LoginFinishRequest loginFinishRequest = ; // LoginFinishRequest | 

try {
    final response = api.authLoginFinishPost(loginFinishRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AuthApi->authLoginFinishPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **loginFinishRequest** | [**LoginFinishRequest**](LoginFinishRequest.md)|  | 

### Return type

[**LoginFinishResponse**](LoginFinishResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authLoginStartPost**
> LoginStartResponse authLoginStartPost(loginStartRequest)

Start challenge-response login

Starts a SCRAM-like login flow.  Client generates `clientNonce` and sends it. Server responds with per-user salt/iterations and `serverNonce`. Client then computes `clientProof` and calls /auth/login/finish. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();
final LoginStartRequest loginStartRequest = ; // LoginStartRequest | 

try {
    final response = api.authLoginStartPost(loginStartRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AuthApi->authLoginStartPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **loginStartRequest** | [**LoginStartRequest**](LoginStartRequest.md)|  | 

### Return type

[**LoginStartResponse**](LoginStartResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authLogoutPost**
> authLogoutPost()

Logout

Stateless JWT logout is typically handled on the client. If you later add token revocation/blacklist, implement it here. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();

try {
    api.authLogoutPost();
} catch on DioException (e) {
    print('Exception when calling AuthApi->authLogoutPost: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authPasswordChangePost**
> LoginFinishResponse authPasswordChangePost(passwordChangeRequest, xStepupToken)

Change password (step-up required)

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();
final PasswordChangeRequest passwordChangeRequest = ; // PasswordChangeRequest | 
final String xStepupToken = xStepupToken_example; // String | Short-lived step-up token.

try {
    final response = api.authPasswordChangePost(passwordChangeRequest, xStepupToken);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AuthApi->authPasswordChangePost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **passwordChangeRequest** | [**PasswordChangeRequest**](PasswordChangeRequest.md)|  | 
 **xStepupToken** | **String**| Short-lived step-up token. | [optional] 

### Return type

[**LoginFinishResponse**](LoginFinishResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authRefreshPost**
> RefreshResponse authRefreshPost()

Refresh access token

Consumes the `ciel_refresh` HttpOnly cookie and issues a new access token cookie (`ciel_auth`) and a rotated refresh token cookie (`ciel_refresh`). Both cookies are set in the response. The refresh token is rotated on every use. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();

try {
    final response = api.authRefreshPost();
    print(response);
} catch on DioException (e) {
    print('Exception when calling AuthApi->authRefreshPost: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**RefreshResponse**](RefreshResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authRegisterPost**
> User authRegisterPost(registerRequest)

Register a new user

Minimal registration. In production, require HTTPS.  The server will generate `salt` and `iterations` and store verifier keys derived from the password (SCRAM-style storedKey/serverKey). 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();
final RegisterRequest registerRequest = ; // RegisterRequest | 

try {
    final response = api.authRegisterPost(registerRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AuthApi->authRegisterPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **registerRequest** | [**RegisterRequest**](RegisterRequest.md)|  | 

### Return type

[**User**](User.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authStepupFinishPost**
> StepupFinishResponse authStepupFinishPost(stepupFinishRequest)

Finish step-up authentication

Verifies `clientProof` for the step-up challenge and returns a short-lived token. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();
final StepupFinishRequest stepupFinishRequest = ; // StepupFinishRequest | 

try {
    final response = api.authStepupFinishPost(stepupFinishRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AuthApi->authStepupFinishPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stepupFinishRequest** | [**StepupFinishRequest**](StepupFinishRequest.md)|  | 

### Return type

[**StepupFinishResponse**](StepupFinishResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authStepupStartPost**
> StepupStartResponse authStepupStartPost(stepupStartRequest)

Start step-up authentication

Starts a SCRAM-like step-up flow bound to the authenticated user. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getAuthApi();
final StepupStartRequest stepupStartRequest = ; // StepupStartRequest | 

try {
    final response = api.authStepupStartPost(stepupStartRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling AuthApi->authStepupStartPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **stepupStartRequest** | [**StepupStartRequest**](StepupStartRequest.md)|  | 

### Return type

[**StepupStartResponse**](StepupStartResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

