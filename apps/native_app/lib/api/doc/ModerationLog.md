# ciel_api.model.ModerationLog

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**adminUserId** | **String** | Admin user who performed the action (null for system actions) | 
**action** | [**ModerationAction**](ModerationAction.md) |  | 
**targetType** | [**ModerationTargetType**](ModerationTargetType.md) |  | 
**targetId** | **String** | ID of the target (format depends on target type) | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**adminUsername** | **String** | Username of admin who performed the action | [optional] 
**adminDisplayName** | **String** | Display name of admin who performed the action | [optional] 
**details** | [**JsonObject**](.md) | Additional details about the action (JSON object) | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


