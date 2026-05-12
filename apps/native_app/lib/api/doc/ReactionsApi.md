# ciel_api.api.ReactionsApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**postsPostIdReactionsDelete**](ReactionsApi.md#postspostidreactionsdelete) | **DELETE** /posts/{postId}/reactions | Remove a reaction
[**postsPostIdReactionsGet**](ReactionsApi.md#postspostidreactionsget) | **GET** /posts/{postId}/reactions | Get reaction counts for a post
[**postsPostIdReactionsPost**](ReactionsApi.md#postspostidreactionspost) | **POST** /posts/{postId}/reactions | Add a reaction
[**postsPostIdReactionsUsersGet**](ReactionsApi.md#postspostidreactionsusersget) | **GET** /posts/{postId}/reactions/users | Get users who reacted with an emoji


# **postsPostIdReactionsDelete**
> ReactionCounts postsPostIdReactionsDelete(postId, emoji)

Remove a reaction

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getReactionsApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final String emoji = emoji_example; // String | 

try {
    final response = api.postsPostIdReactionsDelete(postId, emoji);
    print(response);
} catch on DioException (e) {
    print('Exception when calling ReactionsApi->postsPostIdReactionsDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 
 **emoji** | **String**|  | 

### Return type

[**ReactionCounts**](ReactionCounts.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **postsPostIdReactionsGet**
> ReactionCounts postsPostIdReactionsGet(postId)

Get reaction counts for a post

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getReactionsApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.postsPostIdReactionsGet(postId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling ReactionsApi->postsPostIdReactionsGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 

### Return type

[**ReactionCounts**](ReactionCounts.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **postsPostIdReactionsPost**
> ReactionCounts postsPostIdReactionsPost(postId, reactRequest)

Add a reaction

One user can add a specific emoji once per post.

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getReactionsApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final ReactRequest reactRequest = ; // ReactRequest | 

try {
    final response = api.postsPostIdReactionsPost(postId, reactRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling ReactionsApi->postsPostIdReactionsPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 
 **reactRequest** | [**ReactRequest**](ReactRequest.md)|  | 

### Return type

[**ReactionCounts**](ReactionCounts.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **postsPostIdReactionsUsersGet**
> ReactionUsersPage postsPostIdReactionsUsersGet(postId, emoji, limit, cursor)

Get users who reacted with an emoji

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getReactionsApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final String emoji = emoji_example; // String | 
final int limit = 56; // int | 
final String cursor = cursor_example; // String | 

try {
    final response = api.postsPostIdReactionsUsersGet(postId, emoji, limit, cursor);
    print(response);
} catch on DioException (e) {
    print('Exception when calling ReactionsApi->postsPostIdReactionsUsersGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 
 **emoji** | **String**|  | 
 **limit** | **int**|  | [optional] [default to 24]
 **cursor** | **String**|  | [optional] 

### Return type

[**ReactionUsersPage**](ReactionUsersPage.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

