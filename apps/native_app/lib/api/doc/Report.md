# ciel_api.model.Report

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**reporterUserId** | **String** | User who submitted the report | 
**targetType** | [**ReportTargetType**](ReportTargetType.md) |  | 
**targetId** | **String** | ID of the reported item | 
**reason** | **String** | Predefined reason category | 
**status** | [**ReportStatus**](ReportStatus.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 
**reporterUsername** | **String** | Username of reporter | [optional] 
**reporterDisplayName** | **String** | Display name of reporter | [optional] 
**details** | **String** | Additional details provided by reporter | [optional] 
**reviewedBy** | **String** | Admin user ID who reviewed this report | [optional] 
**reviewerUsername** | **String** | Username of reviewer | [optional] 
**reviewerDisplayName** | **String** | Display name of reviewer | [optional] 
**reviewedAt** | [**DateTime**](DateTime.md) | When the report was reviewed | [optional] 
**resolution** | **String** | Admin's resolution notes | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


