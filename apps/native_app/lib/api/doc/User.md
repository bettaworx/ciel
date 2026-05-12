# ciel_api.model.User

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**username** | **String** |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**displayName** | **String** |  | [optional] 
**bio** | **String** |  | [optional] 
**avatarUrl** | **String** |  | [optional] 
**bannerUrl** | **String** |  | [optional] 
**isAdmin** | **bool** | Whether user has admin.all permission | [optional] 
**termsVersion** | **int** | Version of Terms of Service accepted by user (0 = not accepted) | [optional] 
**privacyVersion** | **int** | Version of Privacy Policy accepted by user (0 = not accepted) | [optional] 
**termsAcceptedAt** | [**DateTime**](DateTime.md) | When user accepted Terms of Service | [optional] 
**privacyAcceptedAt** | [**DateTime**](DateTime.md) | When user accepted Privacy Policy | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


