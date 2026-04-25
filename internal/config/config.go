package config

import (
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
		DatabasePath: GetEnv("DATABASE_URL", "app_data.db"),
		MediaPath:    GetEnv("MEDIA_PATH", "./media"),
		TMDBApiKey:   GetEnv("TMDB_API_KEY", ""),
	}

	return cfg
}
