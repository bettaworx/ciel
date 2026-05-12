# ciel_api.model.StepupStartResponse

## Load the model package
```dart
import 'package:ciel_api/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**stepupSessionId** | **String** |  | 
**salt** | **String** | Base64-encoded salt. | 
**iterations** | **int** | PBKDF2 iteration count. | 
**serverNonce** | **String** | Server-provided nonce to append to clientNonce. | 
**expiresInSeconds** | **int** |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


