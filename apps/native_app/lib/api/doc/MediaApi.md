# ciel_api.api.MediaApi

## Load the API package
```dart
import 'package:ciel_api/api.dart';
```

All URIs are relative to *http://localhost:6137/api/v1*

Method | HTTP request | Description
------------- | ------------- | -------------
[**mediaPost**](MediaApi.md#mediapost) | **POST** /media | Upload media (image, animated GIF, or video)


# **mediaPost**
> Media mediaPost(file)

Upload media (image, animated GIF, or video)

Upload an image, animated GIF, or video and store it with optimized encoding.  **Image formats:** PNG, JPG, JPEG, WebP, GIF   **Video formats:** MP4, WebM, MOV, AVI, MKV, M4V, 3GP, OGV  **File size limits:** - **Images:** 15 MiB (default) - **Videos:** 100 MiB (default)  **Input dimension limits:** 16384x16384 pixels, 100 megapixels total   **Video duration limit:** 300 seconds (5 minutes, default)  **Output specifications:**  **Images:** - **Animated GIF → Animated WebP:** Max 1024px (longest edge), all frames preserved - **Static images (PNG/JPG/WebP) → Static WebP:** Max 2048px (longest edge) - **Aspect ratio:** Always preserved (no upscaling) - **Quality:** 50 (optimized for file size)  **Videos:** - **All formats → MP4 (H.264 + AAC):** Max 1920px (longest edge) - **Codec:** H.264 video, AAC audio - **Quality:** CRF 23 (balanced quality/size) - **Audio:** Preserved and converted to AAC - **Thumbnail:** Automatically generated from first frame as WebP  **Security features:** - MIME type validation (content sniffing + ffprobe format verification) - Metadata stripping (EXIF/XMP/GPS) - Automatic format conversion - DoS protection via size, dimension, and duration limits  **Conversion examples:** - 6000x4000px PNG → 2048x1365px WebP - 800x600px JPEG → 800x600px WebP (no upscaling) - 2000x1500px GIF (50 frames) → 1024x768px Animated WebP (50 frames) - 1920x1080 MOV (60s) → 1920x1080 MP4 (60s, H.264+AAC) - 3840x2160 MKV (120s) → 1920x1080 MP4 (120s, H.264+AAC) 

### Example
```dart
import 'package:ciel_api/api.dart';

final api = CielApi().getMediaApi();
final MultipartFile file = BINARY_DATA_HERE; // MultipartFile | Image file (PNG/JPG/WebP/GIF) or video file (MP4/WebM/MOV/AVI/MKV/M4V/3GP/OGV)

try {
    final response = api.mediaPost(file);
    print(response);
} catch on DioException (e) {
    print('Exception when calling MediaApi->mediaPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file** | **MultipartFile**| Image file (PNG/JPG/WebP/GIF) or video file (MP4/WebM/MOV/AVI/MKV/M4V/3GP/OGV) | 

### Return type

[**Media**](Media.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

