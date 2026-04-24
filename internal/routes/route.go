package routes

import (
	"mediaplay/internal/config"
	"mediaplay/internal/routes/media"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func Routes(db *gorm.DB, cfg config.Config) *chi.Mux {
	r := chi.NewRouter()
	mediaService := media.NewService(db, cfg)
	mediaHandler := media.NewHandler(mediaService)
	r.Get("/stats", mediaHandler.GetStats)
	r.Get("/home", mediaHandler.GetHomeFeed)
	r.Get("/media", mediaHandler.ListMedia)
	r.Get("/media/{id}", mediaHandler.GetMedia)
	r.Get("/media/{id}/stream", mediaHandler.StreamMedia)
	r.Patch("/media/{id}", mediaHandler.UpdateMedia)
	r.Post("/media/{id}/thumbnail", mediaHandler.UploadThumbnail)

	return r
}
