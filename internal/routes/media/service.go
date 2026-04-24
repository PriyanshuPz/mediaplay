package media

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image"
	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"io"
	"mediaplay/internal/config"
	"mediaplay/internal/db"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

const maxThumbnailBytes = 10 << 20

type service struct {
	db  *gorm.DB
	cfg config.Config
}

type Service interface {
	GetStats(ctx context.Context) (Stats, error)
	GetHomeFeed(ctx context.Context) (HomeFeed, error)
	ListMedia(ctx context.Context, mediaType *db.MediaType) ([]db.Media, error)
	GetMedia(ctx context.Context, id uint) (MediaDetail, error)
	GetThumbnailCandidates(ctx context.Context, id uint) (ThumbnailCandidates, error)
	SetThumbnailFromURL(ctx context.Context, id uint, imageURL string) (string, error)
	StreamMedia(w http.ResponseWriter, r *http.Request)
	UpdateMedia(ctx context.Context, id uint, input UpdateMediaInput) error
	UploadThumbnail(w http.ResponseWriter, r *http.Request)
}

func NewService(db *gorm.DB, cfg config.Config) Service {
	return &service{db: db, cfg: cfg}
}

func (s *service) GetStats(ctx context.Context) (Stats, error) {

	musicCount, err := gorm.G[db.Media](s.db).Where("type = ?", "music").Count(ctx, "id")

	if err != nil {
		return Stats{}, err
	}
	moviesCount, err := gorm.G[db.Media](s.db).Where("type = ?", "movie").Count(ctx, "id")

	if err != nil {
		return Stats{}, err
	}
	seriesCount, err := gorm.G[db.Media](s.db).Where("type = ?", "series").Count(ctx, "id")

	if err != nil {
		return Stats{}, err
	}

	return Stats{
		Movies: moviesCount,
		Music:  musicCount,
		Series: seriesCount,
	}, nil
}

func (s *service) GetHomeFeed(ctx context.Context) (HomeFeed, error) {
	movies, err := gorm.G[db.Media](s.db).Limit(4).Where("type = ?", db.MediaMovie).Find(ctx)

	if err != nil {
		return HomeFeed{}, err
	}
	music, err := gorm.G[db.Media](s.db).Limit(4).Where("type = ?", db.MediaMusic).Find(ctx)

	if err != nil {
		return HomeFeed{}, err
	}
	series, err := gorm.G[db.Media](s.db).Limit(4).Where("type = ?", db.MediaSeries).Find(ctx)

	if err != nil {
		return HomeFeed{}, err
	}

	feed := HomeFeed{
		Movies: movies,
		Music:  music,
		Series: series,
	}

	return feed, nil
}

func (s *service) ListMedia(ctx context.Context, mediaType *db.MediaType) ([]db.Media, error) {
	query := s.db.WithContext(ctx).Model(&db.Media{}).Preload("Series").Preload("Season").Order("created_at desc")

	if mediaType != nil {
		query = query.Where("type = ?", *mediaType)
	}

	var media []db.Media
	if err := query.Find(&media).Error; err != nil {
		return nil, err
	}

	return media, nil
}

func (s *service) GetMedia(ctx context.Context, id uint) (MediaDetail, error) {
	var media db.Media
	if err := s.db.WithContext(ctx).
		Preload("Series").
		Preload("Season").
		First(&media, "id = ?", id).Error; err != nil {
		return MediaDetail{}, err
	}

	return MediaDetail{Media: media}, nil
}

func (s *service) GetThumbnailCandidates(ctx context.Context, id uint) (ThumbnailCandidates, error) {
	var media db.Media
	if err := s.db.WithContext(ctx).
		Preload("Series").
		Preload("Season").
		First(&media, "id = ?", id).Error; err != nil {
		return ThumbnailCandidates{}, err
	}

	response := ThumbnailCandidates{CurrentThumbnail: media.Thumbnail}

	switch media.Type {
	case db.MediaMovie:
		response.Candidates = s.tmdbCandidates(ctx, media.Title, "movie")
	case db.MediaSeries:
		title := media.Title
		if media.Series != nil && media.Series.Title != "" {
			title = media.Series.Title
		}
		response.Candidates = s.tmdbCandidates(ctx, title, "tv")
	case db.MediaMusic:
		response.Candidates = s.musicCandidates(ctx, media)
	}

	return response, nil
}

func (s *service) SetThumbnailFromURL(ctx context.Context, id uint, imageURL string) (string, error) {
	trimmedURL := strings.TrimSpace(imageURL)
	if trimmedURL == "" {
		return "", fmt.Errorf("url is required")
	}

	parsedURL, err := url.Parse(trimmedURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		return "", fmt.Errorf("only http and https image urls are supported")
	}

	data, err := s.downloadRemoteImage(ctx, trimmedURL)
	if err != nil {
		return "", err
	}

	return s.persistThumbnail(ctx, id, data)
}

func (s *service) tmdbCandidates(ctx context.Context, title string, mediaType string) []ThumbnailCandidate {
	if strings.TrimSpace(s.cfg.TMDBApiKey) == "" || strings.TrimSpace(title) == "" {
		return nil
	}

	query := url.Values{}
	query.Set("api_key", s.cfg.TMDBApiKey)
	query.Set("query", title)
	query.Set("include_adult", "false")

	searchURL := fmt.Sprintf("https://api.themoviedb.org/3/search/%s?%s", mediaType, query.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, searchURL, nil)
	if err != nil {
		return nil
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil
	}

	var payload struct {
		Results []struct {
			PosterPath   string `json:"poster_path"`
			Title        string `json:"title"`
			Name         string `json:"name"`
			ReleaseDate  string `json:"release_date"`
			FirstAirDate string `json:"first_air_date"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil
	}

	candidates := make([]ThumbnailCandidate, 0, 10)
	for _, result := range payload.Results {
		if result.PosterPath == "" {
			continue
		}

		candidateTitle := result.Title
		if candidateTitle == "" {
			candidateTitle = result.Name
		}

		candidate := ThumbnailCandidate{
			URL:    fmt.Sprintf("https://image.tmdb.org/t/p/w342%s", result.PosterPath),
			Title:  candidateTitle,
			Source: "tmdb",
		}

		if year := yearFromDate(result.ReleaseDate); year != nil {
			candidate.Year = year
		} else if year := yearFromDate(result.FirstAirDate); year != nil {
			candidate.Year = year
		}

		candidates = append(candidates, candidate)
		if len(candidates) >= 10 {
			break
		}
	}

	return candidates
}

func (s *service) musicCandidates(ctx context.Context, media db.Media) []ThumbnailCandidate {
	if strings.TrimSpace(media.Title) == "" {
		return nil
	}

	query := url.Values{}
	query.Set("term", media.Title)
	query.Set("entity", "song")
	query.Set("limit", "8")

	searchURL := fmt.Sprintf("https://itunes.apple.com/search?%s", query.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, searchURL, nil)
	if err != nil {
		return nil
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil
	}

	var payload struct {
		Results []struct {
			TrackName     string `json:"trackName"`
			ArtistName    string `json:"artistName"`
			ReleaseDate   string `json:"releaseDate"`
			ArtworkURL100 string `json:"artworkUrl100"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil
	}

	candidates := make([]ThumbnailCandidate, 0, len(payload.Results))
	for _, result := range payload.Results {
		if result.ArtworkURL100 == "" {
			continue
		}

		candidate := ThumbnailCandidate{
			URL:    strings.Replace(result.ArtworkURL100, "100x100bb", "600x600bb", 1),
			Title:  strings.TrimSpace(strings.Join([]string{result.TrackName, result.ArtistName}, " - ")),
			Source: "itunes",
		}

		if year := yearFromDate(result.ReleaseDate); year != nil {
			candidate.Year = year
		}

		candidates = append(candidates, candidate)
	}

	return candidates
}

func (s *service) downloadRemoteImage(ctx context.Context, imageURL string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download image")
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxThumbnailBytes+1))
	if err != nil {
		return nil, err
	}
	if len(data) > maxThumbnailBytes {
		return nil, fmt.Errorf("image is too large")
	}

	return data, nil
}

func (s *service) persistThumbnail(ctx context.Context, id uint, data []byte) (string, error) {
	if len(data) == 0 {
		return "", fmt.Errorf("image is required")
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("invalid image")
	}

	dir := filepath.Join(s.cfg.MediaMetaPath, "media", strconv.Itoa(int(id)))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	finalPath := filepath.Join(dir, "cover.jpg")
	tempFile, err := os.CreateTemp(dir, "cover-*.jpg")
	if err != nil {
		return "", err
	}
	tempName := tempFile.Name()

	if err := jpeg.Encode(tempFile, img, &jpeg.Options{Quality: 90}); err != nil {
		tempFile.Close()
		os.Remove(tempName)
		return "", err
	}

	if err := tempFile.Close(); err != nil {
		os.Remove(tempName)
		return "", err
	}

	if err := os.Rename(tempName, finalPath); err != nil {
		os.Remove(tempName)
		return "", err
	}

	thumbnailURL := filepath.ToSlash(filepath.Join("/meta", "media", strconv.Itoa(int(id)), "cover.jpg"))
	if err := s.db.WithContext(ctx).
		Model(&db.Media{}).
		Where("id = ?", id).
		Update("thumbnail", thumbnailURL).Error; err != nil {
		return "", err
	}

	return thumbnailURL, nil
}

func yearFromDate(dateString string) *int {
	if len(dateString) < 4 {
		return nil
	}

	year, err := strconv.Atoi(dateString[:4])
	if err != nil {
		return nil
	}

	return &year
}

func (s *service) StreamMedia(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := chi.URLParam(r, "id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var media db.Media
	if err := s.db.WithContext(ctx).First(&media, "id = ?", uint(id64)).Error; err != nil {
		http.Error(w, "media not found", http.StatusNotFound)
		return
	}

	path := media.FilePath
	if !filepath.IsAbs(path) {
		if absPath, err := filepath.Abs(path); err == nil {
			path = absPath
		}
	}

	file, err := os.Open(path)
	if err != nil {
		http.Error(w, "media file not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		http.Error(w, "failed to read media file", http.StatusInternalServerError)
		return
	}

	http.ServeContent(w, r, filepath.Base(path), info.ModTime(), file)
}

func (s *service) UpdateMedia(ctx context.Context, id uint, input UpdateMediaInput) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		var media db.Media
		if err := tx.First(&media, "id = ?", id).Error; err != nil {
			return err
		}

		updates := map[string]any{}

		if input.Title != nil && media.Title != *input.Title {
			updates["title"] = *input.Title
		}
		if input.Description != nil && media.Description != *input.Description {
			updates["description"] = *input.Description
		}
		if input.Thumbnail != nil && media.Thumbnail != *input.Thumbnail {
			updates["thumbnail"] = *input.Thumbnail
		}
		if input.Type != nil && media.Type != *input.Type {
			updates["type"] = *input.Type
		}

		var seriesID *uint = media.SeriesID
		var seasonID *uint = media.SeasonID

		if input.SeriesName != nil {
			if *input.SeriesName == "" {
				updates["series_id"] = nil
				updates["season_id"] = nil
				seriesID = nil
				seasonID = nil
			} else {
				var series db.Series
				if err := tx.FirstOrCreate(&series, db.Series{
					Title: *input.SeriesName,
				}).Error; err != nil {
					return err
				}

				if media.SeriesID == nil || *media.SeriesID != series.ID {
					updates["series_id"] = series.ID
					seriesID = &series.ID
				}

				if media.Type != db.MediaSeries {
					updates["type"] = db.MediaSeries
				}
			}
		}

		if input.Season != nil && seriesID != nil {
			var season db.Season
			if err := tx.FirstOrCreate(&season, db.Season{
				SeriesID: *seriesID,
				Number:   *input.Season,
			}).Error; err != nil {
				return err
			}

			if media.SeasonID == nil || *media.SeasonID != season.ID {
				updates["season_id"] = season.ID
				seasonID = &season.ID
			}
		}

		if len(updates) > 0 {
			if err := tx.Model(&media).Updates(updates).Error; err != nil {
				return err
			}
		}

		if input.Episode != nil {
			if seasonID == nil {
				return nil
			}

			var ep db.Episode
			err := tx.Where("media_id = ?", media.ID).First(&ep).Error

			if err == nil {
				if ep.Number != *input.Episode || ep.SeasonID != *seasonID {
					return tx.Model(&ep).Updates(map[string]interface{}{
						"number":    *input.Episode,
						"season_id": *seasonID,
					}).Error
				}
				return nil
			}

			if err == gorm.ErrRecordNotFound {
				return tx.Create(&db.Episode{
					MediaID:  media.ID,
					SeasonID: *seasonID,
					Number:   *input.Episode,
					Title:    media.Title,
				}).Error
			}

			return err
		}

		return nil
	})
}

func (s *service) UploadThumbnail(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := chi.URLParam(r, "id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	id := uint(id64)

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, maxThumbnailBytes+1))
	if err != nil {
		http.Error(w, "failed to read file", http.StatusInternalServerError)
		return
	}
	if len(data) > maxThumbnailBytes {
		http.Error(w, "image is too large", http.StatusBadRequest)
		return
	}

	thumbnailURL, err := s.persistThumbnail(ctx, id, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"thumbnail": thumbnailURL,
	})
}
