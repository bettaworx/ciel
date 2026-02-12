package config

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"

	"gopkg.in/yaml.v3"
)

// Manager manages server configuration with thread-safe reads and writes
type Manager struct {
	mu         sync.RWMutex
	config     *Config
	configPath string
}

// NewManager creates a new configuration manager.
// If the config file doesn't exist, it creates one with default values.
func NewManager(configPath string) (*Manager, error) {
	m := &Manager{
		configPath: configPath,
	}

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Create default config
		slog.Info("config file not found, creating from defaults", "path", configPath, "example", filepath.Dir(configPath)+"/config.yaml.example")
		if err := m.createDefaultConfig(); err != nil {
			return nil, fmt.Errorf("failed to create default config: %w", err)
		}
		slog.Info("created default config file", "path", configPath)
	}

	// Load config from file
	if err := m.load(); err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	// Set global config on initialization
	SetGlobalConfig(m.config)

	return m, nil
}

// Get returns a copy of the current configuration (thread-safe read)
func (m *Manager) Get() *Config {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Return a deep copy to prevent external modifications
	cfg := *m.config
	if m.config.Server.IconMediaID != nil {
		iconID := *m.config.Server.IconMediaID
		cfg.Server.IconMediaID = &iconID
	}
	return &cfg
}

// Update atomically updates the configuration using a function.
// The function receives a mutable copy of the config.
// If the function returns an error, changes are not saved.
func (m *Manager) Update(fn func(*Config) error) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Create a copy for the update function
	updatedCfg := *m.config
	if m.config.Server.IconMediaID != nil {
		iconID := *m.config.Server.IconMediaID
		updatedCfg.Server.IconMediaID = &iconID
	}

	// Apply updates
	if err := fn(&updatedCfg); err != nil {
		return err
	}

	// Update timestamp
	updatedCfg.UpdateTimestamp()

	// Write to disk atomically
	if err := m.writeConfig(&updatedCfg); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	// Update in-memory config
	m.config = &updatedCfg

	// Update global config
	SetGlobalConfig(&updatedCfg)

	return nil
}

// load reads the config file and updates the in-memory config
func (m *Manager) load() error {
	data, err := os.ReadFile(m.configPath)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return fmt.Errorf("failed to parse config file: %w", err)
	}

	// If media config is missing, use defaults
	if cfg.Media.MaxUploadSize == 0 {
		slog.Info("media config not found in config file, using defaults")
		defaultCfg := DefaultConfig()
		cfg.Media = defaultCfg.Media
	} else {
		// Clamp quality values to 0-100 range and log warnings
		original := cfg.Media
		cfg.Media.ClampQuality()
		cfg.Media.LogClampedQuality(&original)

		// Validate media configuration
		if err := cfg.Media.Validate(); err != nil {
			return fmt.Errorf("invalid media configuration: %w", err)
		}
	}

	m.config = &cfg
	return nil
}

// writeConfig writes the config to disk atomically using temp file + rename
func (m *Manager) writeConfig(cfg *Config) error {
	// Marshal to YAML
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Ensure directory exists
	dir := filepath.Dir(m.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Write to temporary file
	tempPath := m.configPath + ".tmp"
	if err := os.WriteFile(tempPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write temp config: %w", err)
	}

	// Atomic rename
	if err := os.Rename(tempPath, m.configPath); err != nil {
		os.Remove(tempPath) // Clean up temp file on error
		return fmt.Errorf("failed to rename config file: %w", err)
	}

	return nil
}

// createDefaultConfig creates a new config file with default values
func (m *Manager) createDefaultConfig() error {
	// Ensure directory exists
	dir := filepath.Dir(m.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	defaultCfg := DefaultConfig()

	// Marshal with comments
	data, err := yaml.Marshal(defaultCfg)
	if err != nil {
		return fmt.Errorf("failed to marshal default config: %w", err)
	}

	// Add header comment
	header := `# Ciel Server Configuration
# This file is automatically created on first run.
# Edit this file to configure server settings.

`
	fullData := []byte(header + string(data))

	// Write to file
	if err := os.WriteFile(m.configPath, fullData, 0644); err != nil {
		return fmt.Errorf("failed to write default config: %w", err)
	}

	return nil
}

// Validate checks if the configuration is valid
func (m *Manager) Validate() error {
	// Configuration validation removed - invite codes are managed via database
	return nil
}
