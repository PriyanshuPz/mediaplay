package metadata

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mediaplay/internal/config"
	"mediaplay/internal/db"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db  *gorm.DB
	cfg *config.Config
}

type StoredMetadata struct {
	Candidate MetadataCandidate `json:"candidate"`
	UpdatedAt int64             `json:"updated_at"`
	IsManual  bool              `json:"is_manual,omitempty"`
}

func NewService(db *gorm.DB, cfg *config.Config) *Service {
	s := &Service{
		db:  db,
		cfg: cfg,
	}
	_ = os.MkdirAll(s.metaDir(), 0755)
	return s
}

func (s *Service) metaDir() string {
	return filepath.Join(s.cfg.MediaPath, "meta")
}

func (s *Service) metaJSONPath(path string) string {
	return filepath.Join(s.metaDir(), mediaKey(path)+".json")
}

func (s *Service) metaImagePath(path string) string {
	return filepath.Join(s.metaDir(), mediaKey(path)+".jpg")
}

func (s *Service) AutoFetch(ctx context.Context, mediaID uint) error {
	var media db.Media
	if err := s.db.First(&media, mediaID).Error; err != nil {
		return err
	}

	if local, stored, err := s.loadLocalMetadata(media.FilePath); err == nil {
		if stored.IsManual {
			s.applyMetadata(media.ID, media.FilePath, local)
			return nil
		}
		s.applyMetadata(media.ID, media.FilePath, local)
		return nil
	}

	candidates := s.fetchCandidates(ctx, media, media.Title)
	if len(candidates) == 0 {
		return nil
	}

	best := PickBestCandidate(media.Title, candidates)

	_ = s.saveLocalMetadata(media.FilePath, best, false)
	s.applyMetadata(media.ID, media.FilePath, best)

	return nil
}

func (s *Service) Refresh(ctx context.Context, mediaID uint) error {
	var media db.Media
	if err := s.db.First(&media, mediaID).Error; err != nil {
		return err
	}

	candidates := s.fetchCandidates(ctx, media, media.Title)
	if len(candidates) == 0 {
		return fmt.Errorf("no metadata found")
	}

	best := PickBestCandidate(media.Title, candidates)

	if err := s.saveLocalMetadata(media.FilePath, best, false); err != nil {
		return err
	}

	s.applyMetadata(media.ID, media.FilePath, best)
	return nil
}

func (s *Service) UpdateManual(mediaID uint, candidate MetadataCandidate) error {
	var media db.Media
	if err := s.db.First(&media, mediaID).Error; err != nil {
		return err
	}

	if err := s.saveLocalMetadata(media.FilePath, candidate, true); err != nil {
		return err
	}

	s.applyMetadata(media.ID, media.FilePath, candidate)
	return nil
}

func (s *Service) Search(ctx context.Context, mediaID uint, query string) ([]MetadataCandidate, error) {
	var media db.Media
	if err := s.db.First(&media, mediaID).Error; err != nil {
		return nil, err
	}

	if strings.TrimSpace(query) == "" {
		query = media.Title
	}

	return s.fetchCandidates(ctx, media, query), nil
}

func (s *Service) fetchCandidates(ctx context.Context, media db.Media, title string) []MetadataCandidate {

	switch media.Type {
	case db.MediaMovie, db.MediaSeries:
		return s.TmdbCandidates(ctx, title, string(media.Type), s.cfg.TMDBApiKey)
	case db.MediaMusic:
		return s.MusicCandidates(ctx, media, title)
	}
	return nil
}

func (s *Service) applyMetadata(mediaID uint, mediaPath string, best MetadataCandidate) {
	metaJSON, _ := json.Marshal(best)

	localThumb := s.metaImagePath(mediaPath)
	thumbnailURL := filepath.ToSlash(filepath.Join("/media", "meta", mediaKey(mediaPath)+".jpg"))

	updates := map[string]interface{}{
		"metadata":    metaJSON,
		"external_id": best.ExternalID,
	}

	if _, err := os.Stat(localThumb); err == nil {
		updates["thumbnail"] = thumbnailURL
	} else if best.URL != "" {
		updates["thumbnail"] = best.URL
	}

	if best.Overview != "" {
		updates["description"] = best.Overview
	}

	if IsBetterTitle("", best.Title) {
		updates["title"] = best.Title
	}

	s.db.Model(&db.Media{}).
		Where("id = ?", mediaID).
		Updates(updates)
}

func (s *Service) saveLocalMetadata(path string, candidate MetadataCandidate, manual bool) error {
	metaPath := s.metaJSONPath(path)

	stored := StoredMetadata{
		Candidate: candidate,
		UpdatedAt: time.Now().Unix(),
		IsManual:  manual,
	}

	data, _ := json.MarshalIndent(stored, "", "  ")
	if err := os.WriteFile(metaPath, data, 0644); err != nil {
		return err
	}

	if candidate.URL != "" {
		_ = s.downloadImage(candidate.URL, s.metaImagePath(path))
	}

	return nil
}

func (s *Service) loadLocalMetadata(path string) (MetadataCandidate, StoredMetadata, error) {
	metaPath := s.metaJSONPath(path)

	data, err := os.ReadFile(metaPath)
	if err != nil {
		return MetadataCandidate{}, StoredMetadata{}, err
	}

	var stored StoredMetadata
	if err := json.Unmarshal(data, &stored); err != nil {
		return MetadataCandidate{}, StoredMetadata{}, err
	}

	return stored.Candidate, stored, nil
}

func (s *Service) downloadImage(url, dest string) error {
	if _, err := os.Stat(dest); err == nil {
		return nil
	}

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %d", resp.StatusCode)
	}

	file, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(file, resp.Body)
	return err
}

func (s *Service) TmdbCandidates(ctx context.Context, title string, mediaType string, apiKey string) []MetadataCandidate {
	if strings.TrimSpace(apiKey) == "" || strings.TrimSpace(title) == "" {
		return nil
	}

	query := url.Values{}
	query.Set("api_key", apiKey)
	query.Set("query", title)
	query.Set("include_adult", "false")

	if mediaType == "series" {
		mediaType = "tv"
	}

	searchURL := fmt.Sprintf("https://api.themoviedb.org/3/search/%s?%s", mediaType, query.Encode())
	log.Println("[METADATA SEARCH]:", searchURL)
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
			ID            int     `json:"id"`
			PosterPath    string  `json:"poster_path"`
			Title         string  `json:"title"`
			Name          string  `json:"name"`
			ReleaseDate   string  `json:"release_date"`
			FirstAirDate  string  `json:"first_air_date"`
			OriginalTitle string  `json:"original_title"`
			Overview      string  `json:"overview"`
			Popularity    float64 `json:"popularity"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil
	}

	candidates := make([]MetadataCandidate, 0, 10)
	for _, result := range payload.Results {
		if result.PosterPath == "" {
			continue
		}

		candidateTitle := result.Title
		if candidateTitle == "" {
			candidateTitle = result.Name
		}

		candidate := MetadataCandidate{
			URL:           fmt.Sprintf("https://image.tmdb.org/t/p/w342%s", result.PosterPath),
			Title:         candidateTitle,
			OriginalTitle: result.OriginalTitle,
			Overview:      strings.TrimSpace(result.Overview),
			Popularity:    result.Popularity,
			Source:        "tmdb",
			MediaType:     mediaType,
		}

		candidate.Score = scoreCandidate(title, candidate)

		if result.ID > 0 {
			candidate.ExternalID = fmt.Sprintf("tmdb:%s:%d", mediaType, result.ID)
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

func (s *Service) MusicCandidates(ctx context.Context, media db.Media, searchTerm string) []MetadataCandidate {
	if strings.TrimSpace(searchTerm) == "" {
		searchTerm = media.Title
	}

	if strings.TrimSpace(searchTerm) == "" {
		return nil
	}

	query := url.Values{}
	query.Set("term", searchTerm)
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
			TrackID       int64  `json:"trackId"`
			TrackName     string `json:"trackName"`
			ArtistName    string `json:"artistName"`
			ReleaseDate   string `json:"releaseDate"`
			ArtworkURL100 string `json:"artworkUrl100"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil
	}

	candidates := make([]MetadataCandidate, 0, len(payload.Results))
	for _, result := range payload.Results {
		if result.ArtworkURL100 == "" {
			continue
		}

		candidate := MetadataCandidate{
			URL:       strings.Replace(result.ArtworkURL100, "100x100bb", "600x600bb", 1),
			Title:     result.TrackName,
			Artist:    result.ArtistName,
			Source:    "itunes",
			MediaType: "song",
		}
		if result.TrackID > 0 {
			candidate.ExternalID = fmt.Sprintf("itunes:track:%d", result.TrackID)
		}

		if year := yearFromDate(result.ReleaseDate); year != nil {
			candidate.Year = year
		}

		candidates = append(candidates, candidate)
	}

	return candidates
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

func PickBestCandidate(query string, list []MetadataCandidate) MetadataCandidate {
	best := list[0]
	bestScore := -1.0

	for _, c := range list {
		score := scoreCandidate(query, c)
		if score > bestScore {
			bestScore = score
			best = c
		}
	}

	return best
}

func scoreCandidate(query string, c MetadataCandidate) float64 {
	q := strings.ToLower(query)
	t := strings.ToLower(c.Title)

	score := 0.0

	if q == t {
		score += 50
	} else if strings.Contains(t, q) {
		score += 25
	}

	score += c.Popularity * 0.1

	if c.Year != nil && *c.Year > 2000 {
		score += 5
	}

	return score
}

func IsBetterTitle(original, candidate string) bool {
	if len(candidate) < 3 {
		return false
	}

	// avoid overly short replacements
	if len(candidate) < len(original)/2 {
		return false
	}

	return true
}

func mediaKey(path string) string {
	h := sha1.Sum([]byte(path))
	return hex.EncodeToString(h[:])
}
