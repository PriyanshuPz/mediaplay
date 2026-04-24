package media

import (
	"log"
	"mediaplay/internal/db"
	"mediaplay/internal/res"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type handler struct {
	service Service
}

func NewHandler(service Service) *handler {
	return &handler{service: service}
}

func (h *handler) GetStats(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.GetStats(r.Context())
	if err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, data, "Stats fetched successfully")
}

func (h *handler) GetHomeFeed(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.GetHomeFeed(r.Context())
	if err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, data, "home feed fetched successfully")
}

func (h *handler) ListMedia(w http.ResponseWriter, r *http.Request) {
	var mediaType *db.MediaType
	if typeParam := r.URL.Query().Get("type"); typeParam != "" {
		parsedType := db.MediaType(typeParam)
		switch parsedType {
		case db.MediaMovie, db.MediaMusic, db.MediaSeries:
			mediaType = &parsedType
		default:
			res.Error(w, "invalid media type", http.StatusBadRequest)
			return
		}
	}

	data, err := h.service.ListMedia(r.Context(), mediaType)
	if err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, data, "media fetched successfully")
}

func (h *handler) GetMedia(w http.ResponseWriter, r *http.Request) {
	id, err := parseMediaID(r)
	if err != nil {
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	data, err := h.service.GetMedia(r.Context(), id)
	if err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, data, "media fetched successfully")
}

func (h *handler) StreamMedia(w http.ResponseWriter, r *http.Request) {
	h.service.StreamMedia(w, r)
}

func (h *handler) UpdateMedia(w http.ResponseWriter, r *http.Request) {
	id, err := parseMediaID(r)
	if err != nil {
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	input, err := res.Parse[UpdateMediaInput](r)
	if err != nil {
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateMedia(r.Context(), id, input); err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	data, err := h.service.GetMedia(r.Context(), id)
	if err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, data, "media updated successfully")
}

func (h *handler) UploadThumbnail(w http.ResponseWriter, r *http.Request) {
	h.service.UploadThumbnail(w, r)
}

func parseMediaID(r *http.Request) (uint, error) {
	idStr := chi.URLParam(r, "id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return 0, err
	}

	return uint(id64), nil
}
