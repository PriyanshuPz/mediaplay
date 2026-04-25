package routes

import (
	"mediaplay/internal/config"
	"mediaplay/internal/routes/media"
	"mediaplay/internal/routes/meta"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func Routes(db *gorm.DB, cfg *config.Config) *chi.Mux {
	r := chi.NewRouter()

	mediaService := media.NewService(db, cfg)
	mediaHandler := media.NewHandler(mediaService)
	r.Get("/stats", mediaHandler.GetStats)
	r.Get("/home", mediaHandler.GetHomeFeed)
	r.Get("/media", mediaHandler.ListMedia)
	r.Get("/media/{id}", mediaHandler.GetMedia)
	r.Get("/media/{id}/stream", mediaHandler.StreamMedia)

	metaService := meta.NewService(db, cfg)
	metaHandler := meta.NewHandler(metaService)

	r.Get("/meta/{id}/candidates", metaHandler.GetMetadataCandidates)
	r.Post("/meta/{id}/refresh", metaHandler.RefreshMetadata)
	r.Post("/meta/{id}/update", metaHandler.UpdateMetadata)

	r.Patch("/admin/media/{id}", mediaHandler.UpdateMedia)
	r.Delete("/admin/media/{id}", mediaHandler.DeleteMedia)
	r.Post("/admin/media/{id}/thumbnail", mediaHandler.UploadThumbnail)

	return r
}
