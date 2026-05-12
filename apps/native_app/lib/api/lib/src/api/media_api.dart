//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'dart:async';

import 'package:built_value/json_object.dart';
import 'package:built_value/serializer.dart';
import 'package:dio/dio.dart';

import 'package:ciel_api/src/api_util.dart';
import 'package:ciel_api/src/model/error.dart';
import 'package:ciel_api/src/model/media.dart';

class MediaApi {
  final Dio _dio;

  final Serializers _serializers;

  const MediaApi(this._dio, this._serializers);

  /// Upload media (image, animated GIF, or video)
  /// Upload an image, animated GIF, or video and store it with optimized encoding.  **Image formats:** PNG, JPG, JPEG, WebP, GIF   **Video formats:** MP4, WebM, MOV, AVI, MKV, M4V, 3GP, OGV  **File size limits:** - **Images:** 15 MiB (default) - **Videos:** 100 MiB (default)  **Input dimension limits:** 16384x16384 pixels, 100 megapixels total   **Video duration limit:** 300 seconds (5 minutes, default)  **Output specifications:**  **Images:** - **Animated GIF → Animated WebP:** Max 1024px (longest edge), all frames preserved - **Static images (PNG/JPG/WebP) → Static WebP:** Max 2048px (longest edge) - **Aspect ratio:** Always preserved (no upscaling) - **Quality:** 50 (optimized for file size)  **Videos:** - **All formats → MP4 (H.264 + AAC):** Max 1920px (longest edge) - **Codec:** H.264 video, AAC audio - **Quality:** CRF 23 (balanced quality/size) - **Audio:** Preserved and converted to AAC - **Thumbnail:** Automatically generated from first frame as WebP  **Security features:** - MIME type validation (content sniffing + ffprobe format verification) - Metadata stripping (EXIF/XMP/GPS) - Automatic format conversion - DoS protection via size, dimension, and duration limits  **Conversion examples:** - 6000x4000px PNG → 2048x1365px WebP - 800x600px JPEG → 800x600px WebP (no upscaling) - 2000x1500px GIF (50 frames) → 1024x768px Animated WebP (50 frames) - 1920x1080 MOV (60s) → 1920x1080 MP4 (60s, H.264+AAC) - 3840x2160 MKV (120s) → 1920x1080 MP4 (120s, H.264+AAC)
  ///
  /// Parameters:
  /// * [file] - Image file (PNG/JPG/WebP/GIF) or video file (MP4/WebM/MOV/AVI/MKV/M4V/3GP/OGV)
  /// * [cancelToken] - A [CancelToken] that can be used to cancel the operation
  /// * [headers] - Can be used to add additional headers to the request
  /// * [extras] - Can be used to add flags to the request
  /// * [validateStatus] - A [ValidateStatus] callback that can be used to determine request success based on the HTTP status of the response
  /// * [onSendProgress] - A [ProgressCallback] that can be used to get the send progress
  /// * [onReceiveProgress] - A [ProgressCallback] that can be used to get the receive progress
  ///
  /// Returns a [Future] containing a [Response] with a [Media] as data
  /// Throws [DioException] if API call or serialization fails
  Future<Response<Media>> mediaPost({
    required MultipartFile file,
    CancelToken? cancelToken,
    Map<String, dynamic>? headers,
    Map<String, dynamic>? extra,
    ValidateStatus? validateStatus,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    final _path = r'/media';
    final _options = Options(
      method: r'POST',
      headers: <String, dynamic>{
        ...?headers,
      },
      extra: <String, dynamic>{
        'secure': <Map<String, String>>[
          {
            'type': 'http',
            'scheme': 'bearer',
            'name': 'bearerAuth',
          },
        ],
        ...?extra,
      },
      contentType: 'multipart/form-data',
      validateStatus: validateStatus,
    );

    dynamic _bodyData;

    try {
      _bodyData = FormData.fromMap(<String, dynamic>{
        r'file': file,
      });
    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _options.compose(
          _dio.options,
          _path,
        ),
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    final _response = await _dio.request<Object>(
      _path,
      data: _bodyData,
      options: _options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );

    Media? _responseData;

    try {
      final rawResponse = _response.data;
      _responseData = rawResponse == null
          ? null
          : _serializers.deserialize(
              rawResponse,
              specifiedType: const FullType(Media),
            ) as Media;
    } catch (error, stackTrace) {
      throw DioException(
        requestOptions: _response.requestOptions,
        response: _response,
        type: DioExceptionType.unknown,
        error: error,
        stackTrace: stackTrace,
      );
    }

    return Response<Media>(
      data: _responseData,
      headers: _response.headers,
      isRedirect: _response.isRedirect,
      requestOptions: _response.requestOptions,
      redirects: _response.redirects,
      statusCode: _response.statusCode,
      statusMessage: _response.statusMessage,
      extra: _response.extra,
    );
  }
}
