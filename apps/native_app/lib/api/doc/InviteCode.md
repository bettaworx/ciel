# ciel_api.model.InviteCode

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**code** | **String** | Invite code (auto-generated 8-char or custom up to 32 chars) | 
**createdBy** | **String** | User ID of creator | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**useCount** | **int** | Number of times this code has been used | 
**disabled** | **bool** | Whether this code has been disabled | 
**lastUsedAt** | [**DateTime**](DateTime.md) |  | [optional] 
**maxUses** | **int** | Maximum allowed uses. null = unlimited | [optional] 
**expiresAt** | [**DateTime**](DateTime.md) | Expiration date. null = never expires | [optional] 
**note** | **String** | Optional note about this invite code | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


