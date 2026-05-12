# ciel_api.api.EmojisApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**emojisGet**](EmojisApi.md#emojisget) | **GET** /emojis | List custom emojis
[**emojisShortcodeGet**](EmojisApi.md#emojisshortcodeget) | **GET** /emojis/{shortcode} | Get a custom emoji by shortcode


# **emojisGet**
> EmojiListResponse emojisGet(limit, offset)

List custom emojis

Returns the list of custom emojis available on this server.

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getEmojisApi();
final int limit = 56; // int | 
final int offset = 56; // int | 

try {
    final response = api.emojisGet(limit, offset);
    print(response);
} catch on DioException (e) {
    print('Exception when calling EmojisApi->emojisGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 50]
 **offset** | **int**|  | [optional] [default to 0]

### Return type

[**EmojiListResponse**](EmojiListResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **emojisShortcodeGet**
> PublicEmoji emojisShortcodeGet(shortcode)

Get a custom emoji by shortcode

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getEmojisApi();
final String shortcode = shortcode_example; // String | 

try {
    final response = api.emojisShortcodeGet(shortcode);
    print(response);
} catch on DioException (e) {
    print('Exception when calling EmojisApi->emojisShortcodeGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **shortcode** | **String**|  | 

### Return type

[**PublicEmoji**](PublicEmoji.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

