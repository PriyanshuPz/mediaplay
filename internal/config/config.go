package config

import (
	"flag"
	"log"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DatabasePath string
	MediaPath    string
	TMDBApiKey   string
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Printf("No .env file loaded (%v), falling back to system environment", err)
	}

	cfg := &Config{
		Port:         GetEnv("PORT", "8000"),
		DatabasePath: GetEnv("DATABASE_PATH", "app_data.db"),
		MediaPath:    GetEnv("MEDIA_PATH", "./media"),
		TMDBApiKey:   GetEnv("TMDB_API_KEY", ""),
	}

	return cfg
}

func WithFlags(cfg *Config) *Config {
	port := flag.String("port", cfg.Port, "server port")
	db := flag.String("db", cfg.DatabasePath, "database path")
	media := flag.String("media", cfg.MediaPath, "media directory")
	tmdb := flag.String("tmdb", cfg.TMDBApiKey, "TMDB API key")

	flag.Parse()

	cfg.Port = *port
	cfg.DatabasePath = *db
	cfg.MediaPath = *media
	cfg.TMDBApiKey = *tmdb

	return cfg
}
