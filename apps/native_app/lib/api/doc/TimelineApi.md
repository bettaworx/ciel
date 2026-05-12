# ciel_api.api.TimelineApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**timelineGet**](TimelineApi.md#timelineget) | **GET** /timeline | Get timeline (paginated)


# **timelineGet**
> TimelinePage timelineGet(limit, cursor)

Get timeline (paginated)

Returns a paginated timeline.  Implementation note: can be backed by Redis (e.g., ZSET of postIds), and should remove deleted posts from cache. 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getTimelineApi();
final int limit = 56; // int | 
final String cursor = cursor_example; // String | Cursor returned by previous call.

try {
    final response = api.timelineGet(limit, cursor);
    print(response);
} catch on DioException (e) {
    print('Exception when calling TimelineApi->timelineGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 30]
 **cursor** | **String**| Cursor returned by previous call. | [optional] 

### Return type

[**TimelinePage**](TimelinePage.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

