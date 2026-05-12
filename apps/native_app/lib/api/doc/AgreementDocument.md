# ciel_api.model.AgreementDocument

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | Agreement document ID | 
**type** | [**AgreementType**](AgreementType.md) |  | 
**language** | [**AgreementLanguage**](AgreementLanguage.md) |  | 
**version** | **int** | Version number | 
**status** | [**AgreementDocumentStatus**](AgreementDocumentStatus.md) |  | 
**title** | **String** | Document title | 
**content** | **String** | Document content (markdown format) | 
**createdBy** | **String** | Admin user ID who created this document | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 
**publishedBy** | **String** | Admin user ID who published this document | [optional] 
**publishedAt** | [**DateTime**](DateTime.md) | When the document was published | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


