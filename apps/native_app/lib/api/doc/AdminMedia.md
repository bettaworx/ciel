# ciel_api.model.AdminMedia

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**type** | [**MediaType**](MediaType.md) |  | 
**url** | **String** |  | 
**width** | **int** |  | 
**height** | **int** |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**duration** | **double** | Duration in seconds (video only, null for images) | [optional] 
**thumbnailUrl** | **String** | Thumbnail URL (video only, null for images) | [optional] 
**userId** | **String** | User who uploaded this media | [optional] 
**uploaderUsername** | **String** | Username of uploader | [optional] 
**deletedAt** | [**DateTime**](DateTime.md) | When the media was deleted | [optional] 
**deletedBy** | **String** | Admin user ID who deleted this media | [optional] 
**deletionReason** | **String** | Reason for deletion | [optional] 
**phash** | **String** | Perceptual hash of the image | [optional] 
**usedInPostsCount** | **int** | Number of posts using this media | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


