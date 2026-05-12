# ciel_api.api.PostsApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**postsPost**](PostsApi.md#postspost) | **POST** /posts | Create a post
[**postsPostIdDelete**](PostsApi.md#postspostiddelete) | **DELETE** /posts/{postId} | Delete a post
[**postsPostIdGet**](PostsApi.md#postspostidget) | **GET** /posts/{postId} | Get a post


# **postsPost**
> Post postsPost(createPostRequest)

Create a post

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getPostsApi();
final CreatePostRequest createPostRequest = ; // CreatePostRequest | 

try {
    final response = api.postsPost(createPostRequest);
    print(response);
} catch on DioException (e) {
    print('Exception when calling PostsApi->postsPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createPostRequest** | [**CreatePostRequest**](CreatePostRequest.md)|  | 

### Return type

[**Post**](Post.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **postsPostIdDelete**
> postsPostIdDelete(postId)

Delete a post

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getPostsApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api.postsPostIdDelete(postId);
} catch on DioException (e) {
    print('Exception when calling PostsApi->postsPostIdDelete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **postsPostIdGet**
> Post postsPostIdGet(postId)

Get a post

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getPostsApi();
final String postId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final response = api.postsPostIdGet(postId);
    print(response);
} catch on DioException (e) {
    print('Exception when calling PostsApi->postsPostIdGet: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **postId** | **String**|  | 

### Return type

[**Post**](Post.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

