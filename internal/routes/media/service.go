package media

import (
	"context"
	"encoding/json"
	_ "image/gif"
	_ "image/png"
	"mediaplay/internal/config"
	"mediaplay/internal/db"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

const maxThumbnailBytes = 10 << 20

type service struct {
	db  *gorm.DB
	cfg *config.Config
}

type Service interface {
	GetStats(ctx context.Context) (Stats, error)
	GetHomeFeed(ctx context.Context) (HomeFeed, error)
	ListMedia(ctx context.Context, mediaType *db.MediaType) ([]db.Media, error)
	GetMedia(ctx context.Context, id uint) (MediaDetail, error)
	GetRecommendations(ctx context.Context, id uint, limit int) ([]db.Media, error)
	StreamMedia(w http.ResponseWriter, r *http.Request)
	UpdateMedia(ctx context.Context, id uint, input UpdateMediaInput) error
	DeleteMedia(ctx context.Context, id uint) error
}

func NewService(db *gorm.DB, cfg *config.Config) Service {
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
	movies, err := gorm.G[db.Media](s.db).Limit(12).Where("type = ?", db.MediaMovie).Find(ctx)
	if err != nil {
		return HomeFeed{}, err
	}
	music, err := gorm.G[db.Media](s.db).Limit(12).Where("type = ?", db.MediaMusic).Find(ctx)
	if err != nil {
		return HomeFeed{}, err
	}
	series, err := gorm.G[db.Media](s.db).Limit(12).Where("type = ?", db.MediaSeries).Find(ctx)
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

func (s *service) GetRecommendations(ctx context.Context, id uint, limit int) ([]db.Media, error) {
	if limit <= 0 {
		limit = 12
	}
	if limit > 24 {
		limit = 24
	}

	var current db.Media
	if err := s.db.WithContext(ctx).
		Preload("Series").
		Preload("Season").
		First(&current, "id = ?", id).Error; err != nil {
		return nil, err
	}

	var candidates []db.Media
	query := s.db.WithContext(ctx).
		Model(&db.Media{}).
		Preload("Series").
		Preload("Season").
		Where("id <> ?", current.ID).
		Where("type = ?", current.Type).
		Order("updated_at desc").
		Limit(120)

	if err := query.Find(&candidates).Error; err != nil {
		return nil, err
	}

	targetTokens := mediaTokens(current)

	type scoredMedia struct {
		media db.Media
		score int
	}

	scored := make([]scoredMedia, 0, len(candidates))
	for _, candidate := range candidates {
		score := 0

		if current.SeriesID != nil && candidate.SeriesID != nil && *current.SeriesID == *candidate.SeriesID {
			score += 80
		}

		if current.SeasonID != nil && candidate.SeasonID != nil && *current.SeasonID == *candidate.SeasonID {
			score += 30
		}

		overlap := tokenOverlap(targetTokens, mediaTokens(candidate))
		score += overlap * 5

		if score > 0 {
			scored = append(scored, scoredMedia{media: candidate, score: score})
		}
	}

	sort.SliceStable(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			return scored[i].media.UpdatedAt.After(scored[j].media.UpdatedAt)
		}
		return scored[i].score > scored[j].score
	})

	recommendations := make([]db.Media, 0, limit)
	for _, item := range scored {
		recommendations = append(recommendations, item.media)
		if len(recommendations) == limit {
			return recommendations, nil
		}
	}

	if len(recommendations) == limit {
		return recommendations, nil
	}

	for _, candidate := range candidates {
		if containsMediaID(recommendations, candidate.ID) {
			continue
		}
		recommendations = append(recommendations, candidate)
		if len(recommendations) == limit {
			break
		}
	}

	return recommendations, nil
}

func mediaTokens(media db.Media) map[string]struct{} {
	combined := strings.Join([]string{media.Title, media.Description, media.ExternalID}, " ")
	parts := strings.FieldsFunc(strings.ToLower(combined), func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	})

	tokens := make(map[string]struct{}, len(parts))
	for _, part := range parts {
		if len(part) < 2 {
			continue
		}
		tokens[part] = struct{}{}
	}

	return tokens
}

func tokenOverlap(a, b map[string]struct{}) int {
	if len(a) == 0 || len(b) == 0 {
		return 0
	}

	count := 0
	if len(a) > len(b) {
		a, b = b, a
	}

	for token := range a {
		if _, ok := b[token]; ok {
			count++
		}
	}

	return count
}

func containsMediaID(items []db.Media, id uint) bool {
	for _, item := range items {
		if item.ID == id {
			return true
		}
	}

	return false
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
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
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

	if err != nil {
		return err
	}

	go s.syncMediaMetadataSnapshot(context.Background(), id)
	return nil
}

func (s *service) DeleteMedia(ctx context.Context, id uint) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&db.Media{}, "id = ?", id).Error; err != nil {
			return err
		}

		dir := filepath.Join(s.cfg.MediaPath, "meta", strconv.Itoa(int(id)))
		if _, err := os.Stat(dir); err == nil {
			os.RemoveAll(dir)
		}

		return nil
	})
}

func (s *service) syncMediaMetadataSnapshot(ctx context.Context, id uint) {
	var media db.Media
	if err := s.db.WithContext(ctx).First(&media, "id = ?", id).Error; err != nil {
		return
	}

	metadata := map[string]interface{}{}
	if len(media.Metadata) > 0 {
		_ = json.Unmarshal(media.Metadata, &metadata)
	}

	metadata["title"] = media.Title
	metadata["description"] = media.Description
	metadata["type"] = media.Type
	metadata["thumbnail"] = media.Thumbnail
	metadata["external_id"] = media.ExternalID
	metadata["synced_at"] = time.Now().UTC().Format(time.RFC3339)

	jsonData, err := json.Marshal(metadata)
	if err != nil {
		return
	}

	_ = s.db.WithContext(ctx).
		Model(&db.Media{}).
		Where("id = ?", id).
		Update("metadata", jsonData).Error
}
