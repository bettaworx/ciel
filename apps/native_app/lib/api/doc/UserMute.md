# ciel_api.model.UserMute

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**userId** | **String** | ID of the muted user | 
**muteType** | [**MuteType**](MuteType.md) |  | 
**mutedBy** | **String** | Admin user ID who created this mute | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**reason** | **String** | Reason for the mute | [optional] 
**expiresAt** | [**DateTime**](DateTime.md) | When the mute expires (null = permanent) | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


