package settings

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"time"

	bolt "go.etcd.io/bbolt"
)

// Settings represents user settings.
type Settings struct {
    // OpenaiKey is an OpenAI API Key to use with Assistant for GraphQL queries.
	OpenaiKey string `json:"openai_key"`

	// CreatedAt is the time the settings were created.
    CreatedAt time.Time `json:"created_at"`

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

		if value == nil {
			// If the settings didn't exist before, set CreatedAt to now
			settings.CreatedAt = time.Now().UTC()
			value, err = json.Marshal(settings)
			if err != nil {
				return fmt.Errorf("encode settings: %w", err)
			}
		} else {
			// If the settings existed, unmarshal the existing settings to keep CreatedAt
			existingSettings := &Settings{}
			if err := json.Unmarshal(value, existingSettings); err != nil {
				return fmt.Errorf("unmarshal settings: %w", err)
			}

			// Use reflect to iterate over the fields of the settings struct
			existingVal := reflect.ValueOf(existingSettings).Elem()
			newVal := reflect.ValueOf(settings).Elem()

			for i := 0; i < newVal.NumField(); i++ {
				newField := newVal.Field(i)
				existingField := existingVal.Field(i)

				// Don't overwrite the CreatedAt field
				if existingVal.Type().Field(i).Name == "CreatedAt" {
					continue
				}

				// Copy the field from the new settings to the existing settings
				existingField.Set(newField)
			}

			settings = existingSettings

			// Set UpdatedAt to now
			settings.UpdatedAt = time.Now().UTC()

			// Marshal the settings back to JSON
			value, err = json.Marshal(settings)
			if err != nil {
				return fmt.Errorf("encode settings: %w", err)
			}
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
