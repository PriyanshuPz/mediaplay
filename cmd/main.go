package main

import (
	"context"
	"log/slog"
	"mediaplay/internal/config"
	types "mediaplay/internal/db"
	"mediaplay/internal/worker"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var version = "dev"

func main() {

	cfg := config.Load()
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	logger.Info("starting mediaplay server", "version", version)

	db, err := gorm.Open(sqlite.Open(cfg.DatabasePath), &gorm.Config{})

	if err != nil {
		panic("failed to connect database")
	}

	db.AutoMigrate(
		&types.Media{},
		&types.Episode{},
		&types.Season{},
		&types.Series{},
		&types.ScanLog{},
	)

	workerManager := worker.NewManager(logger)
	scanJob := worker.NewScanJob(db, cfg.MediaPath, logger)

	if err := workerManager.Register(scanJob); err != nil {
		logger.Error("failed to register scan job", "error", err)
	}

	workerManager.Start()
	// trigger initial scan
	go scanJob.Run(context.Background())
	defer worker.StopWithTimeout(workerManager, 300)

	api := application{
		config: cfg,
		db:     db,
		logger: logger,
	}

	if err := api.run(api.mount()); err != nil {
		slog.Error("server failed to start", "error", err)
		os.Exit(1)
	}
}
