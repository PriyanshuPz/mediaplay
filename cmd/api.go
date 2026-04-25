package main

import (
	"fmt"
	"log"
	"log/slog"
	web "mediaplay"
	"mediaplay/internal/config"
	"mediaplay/internal/res"
	"mediaplay/internal/routes"
	"net/http"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"gorm.io/gorm"
)

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.AllowAll().Handler)

	r.Use(middleware.Timeout(60 * time.Second))

	r.Mount("/api", routes.Routes(app.db, app.config))
	r.Handle("/m/*", http.StripPrefix("/m/", http.FileServer(http.Dir(app.config.MediaPath))))
	r.Handle("/meta/*", http.StripPrefix("/meta/", http.FileServer(http.Dir(filepath.Join(app.config.MediaPath, "meta")))))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		res.Success(w, map[string]string{
			"status":         "ok",
			"timestamp":      time.Now().Format(time.RFC3339),
			"server_version": version,
		}, "OK")
	})

	r.Handle("/*", web.Handler())

	return r
}

func (app *application) run(h http.Handler) error {
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", app.config.Port),
		Handler:      h,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	log.Printf("server has started at addr %s", app.config.Port)

	return srv.ListenAndServe()
}

type application struct {
	config *config.Config
	logger *slog.Logger
	db     *gorm.DB
}
