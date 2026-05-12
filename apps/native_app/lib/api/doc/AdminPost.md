# ciel_api.model.AdminPost

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**author** | [**User**](User.md) |  | 
**content** | **String** |  | 
**media** | [**BuiltList&lt;Media&gt;**](Media.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**visibility** | [**PostVisibility**](PostVisibility.md) |  | 
**deletedAt** | [**DateTime**](DateTime.md) |  | [optional] 
**deletedBy** | **String** | Admin user ID who deleted this post | [optional] 
**deletionReason** | **String** | Reason for deletion | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


