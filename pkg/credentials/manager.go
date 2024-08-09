package credentials

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	bolt "go.etcd.io/bbolt"
)

// Credential represents an L402 credential.
type Credential struct {
	ID uint64 `json:"id"`

	// Label is the human-readable label for this credential.
	Label string `json:"label"`

	// Location is the service URL for this credential.
	Location string `json:"location"`

	// Method is the type of the request. Possible values are 'POST' | 'GET' | 'PUT' | 'DELETE'
    Method string `json:"method"`

	// Macaroon is the hex-encoded macaroon.
	Macaroon string `json:"macaroon"`

	// Preimage is the hex-encoded preimage.
	Preimage string `json:"preimage"`

	// Invoice is LN payment request.
	Invoice string `json:"invoice"`

	// CreatedAt is the time the credential was created.
	CreatedAt time.Time `json:"created_at"`

	// Type is the type of the credential was created. Possible values are 'file' | 'graphql'
	Type string `json:"type"`
}

type Manager struct {
	db *bolt.DB
}

// NewManager creates a new credential manager.
func NewManager(db *bolt.DB) *Manager {
	return &Manager{db: db}
}

// AddCredential adds a new credential to the database.
func (m *Manager) AddCredential(ctx context.Context, cred *Credential) error {
	return m.db.Update(func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("credentials"))
		if err != nil {
			return fmt.Errorf("create bucket: %w", err)
		}

		// Assign the new ID to the credential
		id, err := b.NextSequence()
		if err != nil {
			return fmt.Errorf("generate next ID: %w", err)
		}
		cred.ID = id

		// Set the created at time to now
		cred.CreatedAt = time.Now().UTC()

		key := []byte(fmt.Sprintf("%d", cred.ID))
		value, err := json.Marshal(cred)
		if err != nil {
			return fmt.Errorf("encode credential: %w", err)
		}

		return b.Put(key, value)
	})
}

func (m *Manager) ListCredentials(ctx context.Context) ([]*Credential, error) {
	var credentials []*Credential

	err := m.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("credentials"))
		if b == nil {
			return nil // No credentials bucket exists yet
		}

		return b.ForEach(func(k, v []byte) error {
			var cred Credential
			if err := json.Unmarshal(v, &cred); err != nil {
				return fmt.Errorf("unmarshal credential: %w", err)
			}
			credentials = append(credentials, &cred)
			return nil
		})
	})

	if err != nil {
		return nil, fmt.Errorf("list credentials: %w", err)
	}

	return credentials, nil
}

// GetCredential retrieves a credential by its ID.
func (m *Manager) GetCredential(ctx context.Context, id uint64) (*Credential, error) {

	var cred *Credential

	err := m.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("credentials"))
		if b == nil {
			return fmt.Errorf("credentials bucket not found")
		}

		key := []byte(fmt.Sprintf("%d", id))
		value := b.Get(key)
		if value == nil {
			return fmt.Errorf("credential not found")
		}

		cred = &Credential{}
		if err := json.Unmarshal(value, cred); err != nil {
			return fmt.Errorf("unmarshal credential: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("get credential: %w", err)
	}

	return cred, nil
}
