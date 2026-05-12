# ciel_api.api.ReportsApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**reportsPost**](ReportsApi.md#reportspost) | **POST** /reports | Create a report


# **reportsPost**
> Report reportsPost(createReportRequest)

Create a report

Submit a report for a user, post, or media item

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getReportsApi();
final CreateReportRequest createReportRequest = ; // CreateReportRequest | 

try {
    final response = api.reportsPost(createReportRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling ReportsApi->reportsPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createReportRequest** | [**CreateReportRequest**](CreateReportRequest.md)|  | 

### Return type

[**Report**](Report.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

