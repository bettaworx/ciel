# ciel_api.model.CreateInviteCodeRequest

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**code** | **String** | Optional custom invite code (1-32 characters, alphanumeric with underscore/hyphen). If not provided or null, an 8-character code will be auto-generated.  | [optional] 
**maxUses** | **int** | Maximum number of times this code can be used. null = unlimited | [optional] 
**expiresAt** | [**DateTime**](DateTime.md) | Expiration date/time in ISO 8601 format. null = never expires | [optional] 
**note** | **String** | Optional note about this invite code (e.g., \"For beta testers\") | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


