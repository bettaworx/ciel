# ciel_api.api.ServerApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**agreementsTypeLatestGet**](ServerApi.md#agreementstypelatestget) | **GET** /agreements/{type}/latest | Get latest agreement content
[**agreementsTypeVersionGet**](ServerApi.md#agreementstypeversionget) | **GET** /agreements/{type}/{version} | Get agreement content by version
[**getAgreementVersions**](ServerApi.md#getagreementversions) | **GET** /agreements/current | Get current agreement versions
[**getServerConfig**](ServerApi.md#getserverconfig) | **GET** /server/config | Get public server configuration
[**getServerInfo**](ServerApi.md#getserverinfo) | **GET** /server/info | Get public server information


# **agreementsTypeLatestGet**
> PublicAgreementContent agreementsTypeLatestGet(type, language)

Get latest agreement content

Public endpoint to retrieve the latest published agreement document content. No authentication required. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getServerApi();
final AgreementType type = ; // AgreementType | 
final AgreementLanguage language = ; // AgreementLanguage | Language preference (defaults to 'en')

try {
    final response = api.agreementsTypeLatestGet(type, language);
    print(response);
} catch on DioException (e) {
    print('Exception when calling ServerApi->agreementsTypeLatestGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**AgreementType**](.md)|  | 
 **language** | [**AgreementLanguage**](.md)| Language preference (defaults to 'en') | [optional] 

### Return type

[**PublicAgreementContent**](PublicAgreementContent.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **agreementsTypeVersionGet**
> PublicAgreementContent agreementsTypeVersionGet(type, version, language)

Get agreement content by version

Public endpoint to retrieve agreement document content for a specific version. No authentication required. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getServerApi();
final AgreementType type = ; // AgreementType | 
final int version = 56; // int | 
final AgreementLanguage language = ; // AgreementLanguage | Language preference (defaults to 'en')

try {
    final response = api.agreementsTypeVersionGet(type, version, language);
    print(response);
} catch on DioException (e) {
    print('Exception when calling ServerApi->agreementsTypeVersionGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**AgreementType**](.md)|  | 
 **version** | **int**|  | 
 **language** | [**AgreementLanguage**](.md)| Language preference (defaults to 'en') | [optional] 

### Return type

[**PublicAgreementContent**](PublicAgreementContent.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAgreementVersions**
> AgreementVersions getAgreementVersions()

Get current agreement versions

Public endpoint to retrieve current Terms of Service and Privacy Policy versions. No authentication required. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getServerApi();

try {
    final response = api.getAgreementVersions();
    print(response);
} catch on DioException (e) {
    print('Exception when calling ServerApi->getAgreementVersions: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AgreementVersions**](AgreementVersions.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerConfig**
> ServerConfig getServerConfig()

Get public server configuration

Public endpoint to retrieve server configuration including signup settings and media limits. No authentication required. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getServerApi();

try {
    final response = api.getServerConfig();
    print(response);
} catch on DioException (e) {
    print('Exception when calling ServerApi->getServerConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerConfig**](ServerConfig.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerInfo**
> ServerInfo getServerInfo()

Get public server information

Public endpoint to retrieve server metadata including name, description, icon, and stats. No authentication required. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getServerApi();

try {
    final response = api.getServerInfo();
    print(response);
} catch on DioException (e) {
    print('Exception when calling ServerApi->getServerInfo: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerInfo**](ServerInfo.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

