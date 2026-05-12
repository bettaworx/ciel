# ciel_api.model.AdminEmoji

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**shortcode** | **String** | Custom emoji shortcode (alphanumeric and underscore only, Mastodon-compatible). | 
**imageUrl** | **String** | URL of the emoji WebP image. | 
**width** | **int** | Output image width in pixels. | 
**height** | **int** | Output image height in pixels. | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 
**name** | **String** | Optional display name for the emoji. | [optional] 
**category** | **String** | Optional category for grouping emojis. | [optional] 
**license** | **String** | Optional license information for the emoji image. | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


