package main

import (
	"embed"
	"log/slog"
	"os"
	"path/filepath"
	"pillbox/pkg/credentials"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	bolt "go.etcd.io/bbolt"
)

var (
	Version = "0.0.1"
)

//go:embed all:frontend/dist
var assets embed.FS

// LoadDB loads the database from the default location.
func LoadDB() (*bolt.DB, error) {
	// Get the user's home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		slog.Error(
			"Failed to get user home directory",
			"error", err,
		)

		return nil, err
	}

	// Create the .pillbox directory if it doesn't exist
	pillboxDir := filepath.Join(homeDir, ".pillbox")
	if err := os.MkdirAll(pillboxDir, 0755); err != nil {
		slog.Error(
			"Failed to create .pillbox directory",
			"error", err,
		)

		return nil, err
	}

	// Set the database path
	dbPath := filepath.Join(pillboxDir, "pillbox.db")

	// Open the database
	db, err := bolt.Open(dbPath, 0600, nil)
	if err != nil {
		slog.Error(
			"Failed to open database",
			"error", err,
		)

		return nil, err
	}

	return db, nil
}

func main() {
	// Create a new BoltDB database
	db, err := LoadDB()
	if err != nil {
		slog.Error(
			"Failed to load database",
			"error", err,
		)

		return
	}
	defer db.Close()

	credMgr := credentials.NewManager(db)

	// Create an instance of the app structure
	app := NewApp(db, credMgr)

	opts := &options.App{
		Title:  "pillbox",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		//BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
	}

	// Create application with options
	if err = wails.Run(opts); err != nil {
		slog.Error(
			"Error running Wails",
			"error", err,
		)
	}
}
