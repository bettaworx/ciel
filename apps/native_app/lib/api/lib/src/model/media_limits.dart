//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:ciel_api/src/model/media_post_limits.dart';
import 'package:ciel_api/src/model/media_emoji_limits.dart';
import 'package:built_collection/built_collection.dart';
import 'package:ciel_api/src/model/media_avatar_limits.dart';
import 'package:ciel_api/src/model/media_banner_limits.dart';
import 'package:ciel_api/src/model/media_video_limits.dart';
import 'package:ciel_api/src/model/media_server_icon_limits.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'media_limits.g.dart';

/// MediaLimits
///
/// Properties:
/// * [maxUploadSizeMB] - Maximum file upload size in megabytes (for images)
/// * [allowedExtensions] - List of allowed file extensions
/// * [post]
/// * [avatar]
/// * [banner]
/// * [serverIcon]
/// * [emoji]
/// * [video]
@BuiltValue()
abstract class MediaLimits implements Built<MediaLimits, MediaLimitsBuilder> {
  /// Maximum file upload size in megabytes (for images)
  @BuiltValueField(wireName: r'maxUploadSizeMB')
  int get maxUploadSizeMB;

  /// List of allowed file extensions
  @BuiltValueField(wireName: r'allowedExtensions')
  BuiltList<String> get allowedExtensions;

  @BuiltValueField(wireName: r'post')
  MediaPostLimits get post;

  @BuiltValueField(wireName: r'avatar')
  MediaAvatarLimits get avatar;

  @BuiltValueField(wireName: r'banner')
  MediaBannerLimits get banner;

  @BuiltValueField(wireName: r'serverIcon')
  MediaServerIconLimits get serverIcon;

  @BuiltValueField(wireName: r'emoji')
  MediaEmojiLimits get emoji;

  @BuiltValueField(wireName: r'video')
  MediaVideoLimits get video;

  MediaLimits._();

  factory MediaLimits([void updates(MediaLimitsBuilder b)]) = _$MediaLimits;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MediaLimitsBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MediaLimits> get serializer => _$MediaLimitsSerializer();
}

class _$MediaLimitsSerializer implements PrimitiveSerializer<MediaLimits> {
  @override
  final Iterable<Type> types = const [MediaLimits, _$MediaLimits];

  @override
  final String wireName = r'MediaLimits';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MediaLimits object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'maxUploadSizeMB';
    yield serializers.serialize(
      object.maxUploadSizeMB,
      specifiedType: const FullType(int),
    );
    yield r'allowedExtensions';
    yield serializers.serialize(
      object.allowedExtensions,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'post';
    yield serializers.serialize(
      object.post,
      specifiedType: const FullType(MediaPostLimits),
    );
    yield r'avatar';
    yield serializers.serialize(
      object.avatar,
      specifiedType: const FullType(MediaAvatarLimits),
    );
    yield r'banner';
    yield serializers.serialize(
      object.banner,
      specifiedType: const FullType(MediaBannerLimits),
    );
    yield r'serverIcon';
    yield serializers.serialize(
      object.serverIcon,
      specifiedType: const FullType(MediaServerIconLimits),
    );
    yield r'emoji';
    yield serializers.serialize(
      object.emoji,
      specifiedType: const FullType(MediaEmojiLimits),
    );
    yield r'video';
    yield serializers.serialize(
      object.video,
      specifiedType: const FullType(MediaVideoLimits),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MediaLimits object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object,
            specifiedType: specifiedType)
        .toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MediaLimitsBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'maxUploadSizeMB':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.maxUploadSizeMB = valueDes;
          break;
        case r'allowedExtensions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.allowedExtensions.replace(valueDes);
          break;
        case r'post':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaPostLimits),
          ) as MediaPostLimits;
          result.post.replace(valueDes);
          break;
        case r'avatar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaAvatarLimits),
          ) as MediaAvatarLimits;
          result.avatar.replace(valueDes);
          break;
        case r'banner':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaBannerLimits),
          ) as MediaBannerLimits;
          result.banner.replace(valueDes);
          break;
        case r'serverIcon':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaServerIconLimits),
          ) as MediaServerIconLimits;
          result.serverIcon.replace(valueDes);
          break;
        case r'emoji':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaEmojiLimits),
          ) as MediaEmojiLimits;
          result.emoji.replace(valueDes);
          break;
        case r'video':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MediaVideoLimits),
          ) as MediaVideoLimits;
          result.video.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MediaLimits deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MediaLimitsBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}
