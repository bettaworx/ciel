# ciel_api.model.IPBan

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**ipAddress** | **String** | IP address (IPv4 or IPv6) | 
**bannedBy** | **String** | Admin user ID who created this ban | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**reason** | **String** | Reason for the ban | [optional] 
**expiresAt** | [**DateTime**](DateTime.md) | When the ban expires (null = permanent) | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


