# ciel_api.api.SystemApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**healthGet**](SystemApi.md#healthget) | **GET** /health | Health Check


# **healthGet**
> healthGet()

Health Check

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getSystemApi();

try {
    api.healthGet();
} catch on DioException (e) {
    print('Exception when calling SystemApi->healthGet: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

