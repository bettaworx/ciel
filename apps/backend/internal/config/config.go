package config

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

var (
	globalConfig   *Config
	globalConfigMu sync.RWMutex
)

// SetGlobalConfig sets the global configuration instance (for tests and initialization)
func SetGlobalConfig(cfg *Config) {
	globalConfigMu.Lock()
	defer globalConfigMu.Unlock()
	globalConfig = cfg
}

// GetGlobalConfig returns the global configuration instance
func GetGlobalConfig() *Config {
	globalConfigMu.RLock()
	defer globalConfigMu.RUnlock()
	return globalConfig
}

// Config represents the server configuration stored in config.yaml
type Config struct {
	Server ServerConfig `yaml:"server"`
	Auth   AuthConfig   `yaml:"auth"`
	Setup  SetupConfig  `yaml:"setup"`
}

// ServerConfig holds server metadata settings
type ServerConfig struct {
	Name          string     `yaml:"name"`
	Description   string     `yaml:"description"`
	IconMediaID   *uuid.UUID `yaml:"icon_media_id"`
	LastUpdatedAt int64      `yaml:"last_updated_at"` // Unix timestamp
}

// AuthConfig holds authentication and registration settings
type AuthConfig struct {
	InviteOnly bool `yaml:"invite_only"`
}

// SetupConfig holds setup completion status
type SetupConfig struct {
	Completed    bool `yaml:"completed"`
	PasswordUsed bool `yaml:"password_used"`
}

// DefaultConfig returns a new Config with default values
func DefaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Name:          "Ciel",
			Description:   "",
			IconMediaID:   nil,
			LastUpdatedAt: time.Now().Unix(),
		},
		Auth: AuthConfig{
			InviteOnly: true, // Default to invite-only for security
		},
		Setup: SetupConfig{
			Completed:    false,
			PasswordUsed: false,
		},
	}
}

// UpdateTimestamp sets the current Unix timestamp for LastUpdatedAt
func (c *Config) UpdateTimestamp() {
	c.Server.LastUpdatedAt = time.Now().Unix()
}
