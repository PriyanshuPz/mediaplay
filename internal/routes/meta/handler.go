package meta

import (
	"log"
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

func (h *handler) GetMetadataCandidates(w http.ResponseWriter, r *http.Request) {
	id, err := parseMetaID(r)
	if err != nil {
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := r.URL.Query().Get("q")

	data, err := h.service.GetMetadataCandidates(r.Context(), id, query)
	if err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, data, "metadata candidates fetched successfully")
}

func (h *handler) RefreshMetadata(w http.ResponseWriter, r *http.Request) {
	id, err := parseMetaID(r)
	if err != nil {
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := r.URL.Query().Get("q")

	if err := h.service.RefreshMetadata(r.Context(), id, query); err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, res.M{}, "metadata refreshed successfully")
}

func (h *handler) UpdateMetadata(w http.ResponseWriter, r *http.Request) {
	id, err := parseMetaID(r)
	if err != nil {
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	input, err := res.Parse[UpdateMetadataInput](r)
	if err != nil {
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if input.URL == "" {
		res.Error(w, "url is required", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateMetadata(r.Context(), id, input); err != nil {
		log.Println(err)
		res.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res.Success(w, res.M{}, "metadata updated successfully")
}

func parseMetaID(r *http.Request) (uint, error) {
	idStr := chi.URLParam(r, "id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return 0, err
	}

	return uint(id64), nil
}
