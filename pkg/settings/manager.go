package settings

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	bolt "go.etcd.io/bbolt"
)

// Settings represents user settings.
type Settings struct {
    // OpenaiKey is an OpenAI API Key to use with Assistant for GraphQL queries.
	OpenaiKey string `json:"openai_key"`

    // UpdatedAt is the time the settings were updated.
    UpdatedAt time.Time `json:"updated_at"`
}

type Manager struct {
	db *bolt.DB
}

// NewManager creates a new settings manager.
func NewManager(db *bolt.DB) *Manager {
	return &Manager{db: db}
}

// UpdateSettings updates the fields of a Settings instance in the database.
func (m *Manager) UpdateSettings(ctx context.Context, settings *Settings) error {
	return m.db.Update(func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("settings"))
		if err != nil {
			return fmt.Errorf("create bucket: %w", err)
		}

		key := []byte("settings")
        value := b.Get(key)

	    settings.UpdatedAt = time.Now().UTC()

        // Marshal the settings back to JSON
        value, err = json.Marshal(settings)
        if err != nil {
            return fmt.Errorf("encode settings: %w", err)
        }

		// Put the settings back into the bucket
		return b.Put(key, value)
	})
}

// GetSettings retrieves the Settings instance from the database.
func (m *Manager) GetSettings(ctx context.Context) (*Settings, error) {
	var settings *Settings

	err := m.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("settings"))
		if b == nil {
			return fmt.Errorf("settings bucket not found")
		}

		key := []byte("settings")
		value := b.Get(key)
		if value == nil {
			return fmt.Errorf("settings not found")
		}

		settings = &Settings{}
		if err := json.Unmarshal(value, settings); err != nil {
			return fmt.Errorf("unmarshal settings: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("get settings: %w", err)
	}

	return settings, nil
}
