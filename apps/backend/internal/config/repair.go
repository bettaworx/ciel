package config

import "gopkg.in/yaml.v3"

// presenceProbe はデフォルトが true の bool フィールドの存在チェック用。
// Go の zero value (false) と "未設定" を区別するためポインタを使う。
type presenceProbe struct {
	Auth struct {
		InviteOnly *bool `yaml:"invite_only"`
	} `yaml:"auth"`
	Media struct {
		Encoding *struct {
			Post       *bool `yaml:"post"`
			Avatar     *bool `yaml:"avatar"`
			Banner     *bool `yaml:"banner"`
			ServerIcon *bool `yaml:"server_icon"`
			Video      *bool `yaml:"video"`
		} `yaml:"encoding"`
	} `yaml:"media"`
}

// repairDefaults はゼロ値または未設定のフィールドにデフォルト値を補完する。
// rawData は bool フィールドの存在チェックに使用する元の YAML バイト列。
// 修復したフィールドの YAML パス一覧を返す。
func repairDefaults(cfg *Config, rawData []byte) []string {
	defaults := DefaultConfig()
	var repaired []string

	var probe presenceProbe
	_ = yaml.Unmarshal(rawData, &probe)

	// server.name: 空文字 → "Ciel"
	if cfg.Server.Name == "" {
		cfg.Server.Name = defaults.Server.Name
		repaired = append(repaired, "server.name")
	}

	// auth.invite_only: 未設定 → true (存在チェック必須)
	if probe.Auth.InviteOnly == nil {
		cfg.Auth.InviteOnly = defaults.Auth.InviteOnly
		repaired = append(repaired, "auth.invite_only")
	}

	// media.max_upload_size
	if cfg.Media.MaxUploadSize == 0 {
		cfg.Media.MaxUploadSize = defaults.Media.MaxUploadSize
		repaired = append(repaired, "media.max_upload_size")
	}

	// media.allowed_extensions
	if len(cfg.Media.AllowedExtensions) == 0 {
		cfg.Media.AllowedExtensions = defaults.Media.AllowedExtensions
		repaired = append(repaired, "media.allowed_extensions")
	}

	// media.max_input_width/height/pixels
	if cfg.Media.MaxInputWidth == 0 {
		cfg.Media.MaxInputWidth = defaults.Media.MaxInputWidth
		repaired = append(repaired, "media.max_input_width")
	}
	if cfg.Media.MaxInputHeight == 0 {
		cfg.Media.MaxInputHeight = defaults.Media.MaxInputHeight
		repaired = append(repaired, "media.max_input_height")
	}
	if cfg.Media.MaxInputPixels == 0 {
		cfg.Media.MaxInputPixels = defaults.Media.MaxInputPixels
		repaired = append(repaired, "media.max_input_pixels")
	}

	// media.encoding.* (デフォルト true, 存在チェック必須)
	if probe.Media.Encoding == nil {
		cfg.Media.Encoding = defaults.Media.Encoding
		repaired = append(repaired, "media.encoding.post", "media.encoding.avatar",
			"media.encoding.banner", "media.encoding.server_icon", "media.encoding.video")
	} else {
		enc := probe.Media.Encoding
		if enc.Post == nil {
			cfg.Media.Encoding.Post = true
			repaired = append(repaired, "media.encoding.post")
		}
		if enc.Avatar == nil {
			cfg.Media.Encoding.Avatar = true
			repaired = append(repaired, "media.encoding.avatar")
		}
		if enc.Banner == nil {
			cfg.Media.Encoding.Banner = true
			repaired = append(repaired, "media.encoding.banner")
		}
		if enc.ServerIcon == nil {
			cfg.Media.Encoding.ServerIcon = true
			repaired = append(repaired, "media.encoding.server_icon")
		}
		if enc.Video == nil {
			cfg.Media.Encoding.Video = true
			repaired = append(repaired, "media.encoding.video")
		}
	}

	// media.post.static/gif
	if cfg.Media.Post.Static.MaxSize == 0 {
		cfg.Media.Post.Static.MaxSize = defaults.Media.Post.Static.MaxSize
		repaired = append(repaired, "media.post.static.max_size")
	}
	if cfg.Media.Post.Static.Quality == 0 {
		cfg.Media.Post.Static.Quality = defaults.Media.Post.Static.Quality
		repaired = append(repaired, "media.post.static.quality")
	}
	if cfg.Media.Post.Gif.MaxSize == 0 {
		cfg.Media.Post.Gif.MaxSize = defaults.Media.Post.Gif.MaxSize
		repaired = append(repaired, "media.post.gif.max_size")
	}
	if cfg.Media.Post.Gif.Quality == 0 {
		cfg.Media.Post.Gif.Quality = defaults.Media.Post.Gif.Quality
		repaired = append(repaired, "media.post.gif.quality")
	}

	// media.avatar.static/gif
	if cfg.Media.Avatar.Static.Size == 0 {
		cfg.Media.Avatar.Static.Size = defaults.Media.Avatar.Static.Size
		repaired = append(repaired, "media.avatar.static.size")
	}
	if cfg.Media.Avatar.Static.Quality == 0 {
		cfg.Media.Avatar.Static.Quality = defaults.Media.Avatar.Static.Quality
		repaired = append(repaired, "media.avatar.static.quality")
	}
	if cfg.Media.Avatar.Gif.Size == 0 {
		cfg.Media.Avatar.Gif.Size = defaults.Media.Avatar.Gif.Size
		repaired = append(repaired, "media.avatar.gif.size")
	}
	if cfg.Media.Avatar.Gif.Quality == 0 {
		cfg.Media.Avatar.Gif.Quality = defaults.Media.Avatar.Gif.Quality
		repaired = append(repaired, "media.avatar.gif.quality")
	}

	// media.banner.static/gif
	if cfg.Media.Banner.Static.Width == 0 {
		cfg.Media.Banner.Static.Width = defaults.Media.Banner.Static.Width
		repaired = append(repaired, "media.banner.static.width")
	}
	if cfg.Media.Banner.Static.Height == 0 {
		cfg.Media.Banner.Static.Height = defaults.Media.Banner.Static.Height
		repaired = append(repaired, "media.banner.static.height")
	}
	if cfg.Media.Banner.Static.Quality == 0 {
		cfg.Media.Banner.Static.Quality = defaults.Media.Banner.Static.Quality
		repaired = append(repaired, "media.banner.static.quality")
	}
	if cfg.Media.Banner.Gif.Width == 0 {
		cfg.Media.Banner.Gif.Width = defaults.Media.Banner.Gif.Width
		repaired = append(repaired, "media.banner.gif.width")
	}
	if cfg.Media.Banner.Gif.Height == 0 {
		cfg.Media.Banner.Gif.Height = defaults.Media.Banner.Gif.Height
		repaired = append(repaired, "media.banner.gif.height")
	}
	if cfg.Media.Banner.Gif.Quality == 0 {
		cfg.Media.Banner.Gif.Quality = defaults.Media.Banner.Gif.Quality
		repaired = append(repaired, "media.banner.gif.quality")
	}

	// media.server_icon.static/gif
	if cfg.Media.ServerIcon.Static.Size == 0 {
		cfg.Media.ServerIcon.Static.Size = defaults.Media.ServerIcon.Static.Size
		repaired = append(repaired, "media.server_icon.static.size")
	}
	if cfg.Media.ServerIcon.Static.Quality == 0 {
		cfg.Media.ServerIcon.Static.Quality = defaults.Media.ServerIcon.Static.Quality
		repaired = append(repaired, "media.server_icon.static.quality")
	}
	if cfg.Media.ServerIcon.Gif.MaxSize == 0 {
		cfg.Media.ServerIcon.Gif.MaxSize = defaults.Media.ServerIcon.Gif.MaxSize
		repaired = append(repaired, "media.server_icon.gif.max_size")
	}
	if cfg.Media.ServerIcon.Gif.Quality == 0 {
		cfg.Media.ServerIcon.Gif.Quality = defaults.Media.ServerIcon.Gif.Quality
		repaired = append(repaired, "media.server_icon.gif.quality")
	}

	// media.emoji.static/gif
	if cfg.Media.Emoji.Static.Height == 0 {
		if cfg.Media.Emoji.Height != 0 {
			cfg.Media.Emoji.Static.Height = cfg.Media.Emoji.Height
		} else {
			cfg.Media.Emoji.Static.Height = defaults.Media.Emoji.Static.Height
		}
		repaired = append(repaired, "media.emoji.static.height")
	}
	if cfg.Media.Emoji.Static.Quality == 0 {
		if cfg.Media.Emoji.Quality != 0 {
			cfg.Media.Emoji.Static.Quality = cfg.Media.Emoji.Quality
		} else {
			cfg.Media.Emoji.Static.Quality = defaults.Media.Emoji.Static.Quality
		}
		repaired = append(repaired, "media.emoji.static.quality")
	}
	if cfg.Media.Emoji.Gif.Height == 0 {
		if cfg.Media.Emoji.Height != 0 {
			cfg.Media.Emoji.Gif.Height = cfg.Media.Emoji.Height
		} else {
			cfg.Media.Emoji.Gif.Height = defaults.Media.Emoji.Gif.Height
		}
		repaired = append(repaired, "media.emoji.gif.height")
	}
	if cfg.Media.Emoji.Gif.Quality == 0 {
		if cfg.Media.Emoji.Quality != 0 {
			cfg.Media.Emoji.Gif.Quality = cfg.Media.Emoji.Quality
		} else {
			cfg.Media.Emoji.Gif.Quality = defaults.Media.Emoji.Gif.Quality
		}
		repaired = append(repaired, "media.emoji.gif.quality")
	}
	cfg.Media.Emoji.Height = 0
	cfg.Media.Emoji.Quality = 0

	// post.max_content_length
	if cfg.Post.MaxContentLength == 0 {
		cfg.Post.MaxContentLength = defaults.Post.MaxContentLength
		repaired = append(repaired, "post.max_content_length")
	}

	// media.video.*
	// 注意: media.video.crf のデフォルトは 23。CRF=0 は技術的に有効(ロスレス)だが、
	// 実運用で意図的に設定されることは稀なため、0 は未設定として扱う。
	if cfg.Media.Video.MaxUploadSize == 0 {
		cfg.Media.Video.MaxUploadSize = defaults.Media.Video.MaxUploadSize
		repaired = append(repaired, "media.video.max_upload_size")
	}
	if cfg.Media.Video.MaxDuration == 0 {
		cfg.Media.Video.MaxDuration = defaults.Media.Video.MaxDuration
		repaired = append(repaired, "media.video.max_duration")
	}
	if cfg.Media.Video.MaxSize == 0 {
		cfg.Media.Video.MaxSize = defaults.Media.Video.MaxSize
		repaired = append(repaired, "media.video.max_size")
	}
	if cfg.Media.Video.CRF == 0 {
		cfg.Media.Video.CRF = defaults.Media.Video.CRF
		repaired = append(repaired, "media.video.crf")
	}

	return repaired
}
