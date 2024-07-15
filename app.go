package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	bolt "go.etcd.io/bbolt"

	"pillbox/pkg/credentials"
)

const (
	DefaultTimeout = 10 * time.Second
)

// App struct
type App struct {
	ctx context.Context
	db  *bolt.DB

	credentials *credentials.Manager
}

// NewApp creates a new App application struct
func NewApp(db *bolt.DB, credMgr *credentials.Manager) *App {
	return &App{db: db, credentials: credMgr}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) AddCredential(cred *credentials.Credential) error {
	ctxt, cancel := context.WithTimeout(a.ctx, DefaultTimeout)
	defer cancel()

	if err := a.credentials.AddCredential(ctxt, cred); err != nil {
		return err
	}

	return nil
}

func (a *App) ListCredentials() ([]*credentials.Credential, error) {
	ctx, cancel := context.WithTimeout(a.ctx, DefaultTimeout)
	defer cancel()

	creds, err := a.credentials.ListCredentials(ctx)
	if err != nil {
		return nil, fmt.Errorf("list credentials: %w", err)
	}

	return creds, nil
}

func (a *App) GetCredential(id uint64) (*credentials.Credential, error) {
	ctx, cancel := context.WithTimeout(a.ctx, DefaultTimeout)
	defer cancel()

	cred, err := a.credentials.GetCredential(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get credential: %w", err)
	}

	return cred, nil
}

func (a *App) GetDownloadsPath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return filepath.Join(homeDir, "Downloads")
}

func (a *App) SaveFile(fileName string, data []byte) error {
	filepath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save File",
		DefaultFilename: fileName,
	})
	if err != nil {
		return err
	}

	return os.WriteFile(filepath, data, 0644)
}

func (a *App) Version() string {
	return Version
}
