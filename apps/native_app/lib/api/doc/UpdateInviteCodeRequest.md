# ciel_api.model.UpdateInviteCodeRequest

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**code** | **String** | Updated invite code (1-32 characters, alphanumeric with underscore/hyphen). Must be unique. Omit this field to keep the existing code.  | [optional] 
**maxUses** | **int** | Maximum number of times this code can be used. null = unlimited. Omit this field to keep the existing value.  | [optional] 
**expiresAt** | [**DateTime**](DateTime.md) | Expiration date/time in ISO 8601 format. null = never expires. Omit this field to keep the existing value.  | [optional] 
**note** | **String** | Updated note about this invite code (e.g., \"For beta testers\"). null = clear the note. Omit this field to keep the existing value.  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


