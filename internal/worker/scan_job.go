package worker

import (
	"context"
	"io/fs"
	"log/slog"
	"mediaplay/internal/config"
	"mediaplay/internal/db"
	"mediaplay/internal/metadata"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync/atomic"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var videoExt = map[string]struct{}{
	".mp4": {}, ".mkv": {}, ".avi": {}, ".mov": {}, ".wmv": {},
	".flv": {}, ".webm": {}, ".m4v": {}, ".mpeg": {}, ".mpg": {},
	".3gp": {}, ".ts": {}, ".vob": {},
}

var audioExt = map[string]struct{}{
	".mp3": {}, ".flac": {}, ".wav": {}, ".aac": {}, ".ogg": {},
	".m4a": {}, ".wma": {}, ".alac": {}, ".aiff": {},
}

var subtitleExt = map[string]struct{}{
	".srt": {}, ".ass": {}, ".vtt": {}, ".sub": {},
}

type ScanJob struct {
	db      *gorm.DB
	logger  *slog.Logger
	cfg     *config.Config
	metaSvc *metadata.Service
}

func NewScanJob(db *gorm.DB, cfg *config.Config, logger *slog.Logger) *ScanJob {
	return &ScanJob{
		db:      db,
		logger:  logger,
		cfg:     cfg,
		metaSvc: metadata.NewService(db, cfg),
	}
}

func (j *ScanJob) Name() string {
	return "media_scan"
}

func (j *ScanJob) Spec() string {
	return "@every 5m"
}

var running atomic.Bool

func (j *ScanJob) Run(ctx context.Context) error {
	if !running.CompareAndSwap(false, true) {
		j.logger.Warn("scan already running, skipping")
		return nil
	}
	defer running.Store(false)

	return filepath.WalkDir(j.cfg.MediaPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}

		if !isMediaFile(path) {
			return nil
		}

		rel, _ := filepath.Rel(j.cfg.MediaPath, path)
		parts := strings.Split(rel, string(os.PathSeparator))

		if len(parts) == 0 {
			return nil
		}

		switch parts[0] {
		case "Movies", "movies":
			return j.handleMovie(ctx, path, parts)

		case "Web Series", "web series", "series", "web_series", "Web_series":
			return j.handleSeries(ctx, path, parts)

		case "Music", "music":
			return j.handleMusic(ctx, path, parts)
		}

		return nil
	})
}

func looksLikeTitle(name string) bool {
	name = strings.ToLower(name)

	junk := []string{
		"movies", "downloads", "video", "1080p", "720p", "bluray",
	}

	for _, j := range junk {
		if strings.Contains(name, j) {
			return false
		}
	}

	return len(name) > 3
}

func (j *ScanJob) handleMovie(ctx context.Context, path string, parts []string) error {
	title := extractTitle(path)

	// try folder as hint (only if useful)
	if len(parts) >= 2 {
		folder := parts[len(parts)-2]

		if looksLikeTitle(folder) {
			title = folder
		}
	}

	return j.upsertMedia(ctx, path, title, db.MediaMovie, nil, nil)
}

func (j *ScanJob) handleSeries(ctx context.Context, path string, _ []string) error {
	title := extractTitle(path)

	seriesName, seasonNumber, ok := guessSeriesInfo(path)

	var seriesID *uint
	var seasonID *uint

	if ok && seriesName != "" {
		var series db.Series
		j.db.FirstOrCreate(&series, db.Series{Title: seriesName})
		seriesID = &series.ID

		if seasonNumber > 0 {
			var season db.Season
			j.db.FirstOrCreate(&season, db.Season{
				SeriesID: series.ID,
				Number:   seasonNumber,
			})
			seasonID = &season.ID
		}
	}

	return j.upsertMedia(ctx, path, title, db.MediaSeries, seriesID, seasonID)
}
func (j *ScanJob) handleMusic(ctx context.Context, path string, _ []string) error {
	title := extractTitle(path)

	return j.upsertMedia(ctx, path, title, db.MediaMusic, nil, nil)
}

func (j *ScanJob) upsertMedia(
	_ context.Context,
	path string,
	title string,
	mediaType db.MediaType,
	seriesID *uint,
	seasonID *uint,
) error {

	var existing db.Media
	err := j.db.Where("file_path = ?", path).First(&existing).Error

	if err == nil {
		updates := map[string]interface{}{}
		if existing.Title != title {
			updates["title"] = title
		}
		if existing.Type != mediaType {
			updates["type"] = mediaType
		}

		if seriesID == nil {
			if existing.SeriesID != nil {
				updates["series_id"] = nil
			}
		} else if existing.SeriesID == nil || *existing.SeriesID != *seriesID {
			updates["series_id"] = *seriesID
		}

		if seasonID == nil {
			if existing.SeasonID != nil {
				updates["season_id"] = nil
			}
		} else if existing.SeasonID == nil || *existing.SeasonID != *seasonID {
			updates["season_id"] = *seasonID
		}

		if len(updates) > 0 {
			if updateErr := j.db.Model(&existing).Updates(updates).Error; updateErr != nil {
				return updateErr
			}
		}

		// existing rows should still get metadata refreshed on scan runs
		go j.fetchMetadata(existing.ID, title)
		return nil
	}

	if err != gorm.ErrRecordNotFound {
		return err
	}

	media := db.Media{
		Title:    title,
		FilePath: path,
		Type:     mediaType,
		SeriesID: seriesID,
		SeasonID: seasonID,
	}

	err = j.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "file_path"}},
		DoNothing: true,
	}).Create(&media).Error

	if err != nil {
		return err
	}

	if media.ID == 0 {
		if findErr := j.db.Where("file_path = ?", path).First(&media).Error; findErr != nil {
			return findErr
		}
	}

	go j.fetchMetadata(media.ID, title)

	return nil
}

func extractSeasonNumber(name string) int {
	name = strings.ToLower(name)

	// supports: "Season 1", "S1"
	name = strings.ReplaceAll(name, "season", "")
	name = strings.TrimSpace(name)

	n, err := strconv.Atoi(name)
	if err == nil {
		return n
	}

	if after, ok := strings.CutPrefix(name, "s"); ok {
		n, _ = strconv.Atoi(after)
		return n
	}

	return 1
}

func isMediaFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))

	if _, ok := videoExt[ext]; ok {
		return true
	}
	if _, ok := audioExt[ext]; ok {
		return true
	}

	return false
}

func (j *ScanJob) fetchMetadata(mediaID uint, _ string) {
	ctx := context.Background()

	if err := j.metaSvc.AutoFetch(ctx, mediaID); err != nil {
		j.logger.Warn("metadata fetch failed", "media_id", mediaID, "err", err)
	}
}

func guessSeriesInfo(path string) (seriesName string, season int, ok bool) {
	lower := strings.ToLower(path)

	re := regexp.MustCompile(`s(\d{1,2})e(\d{1,2})`)
	match := re.FindStringSubmatch(lower)

	if len(match) == 3 {
		season, _ = strconv.Atoi(match[1])
		ok = true
	}

	dir := filepath.Dir(path)
	seriesName = filepath.Base(filepath.Dir(dir))

	return
}

func extractTitle(filename string) string {
	base := filepath.Base(filename)
	filename = strings.TrimSuffix(base, filepath.Ext(base))
	reSeparators := regexp.MustCompile(`[._-]+`)
	name := reSeparators.ReplaceAllString(filename, " ")

	reYear := regexp.MustCompile(`\b(19|20)\d{2}\b`)
	name = reYear.ReplaceAllString(name, "")

	noiseWords := []string{
		"official", "trailer", "teaser", "4k", "ultra", "hd", "60fps",
		"new", "hindi", "dubbed", "sony", "pictures",
	}

	for _, word := range noiseWords {
		re := regexp.MustCompile(`(?i)\b` + word + `\b`)
		name = re.ReplaceAllString(name, "")
	}

	reSpaces := regexp.MustCompile(`\s+`)
	name = reSpaces.ReplaceAllString(name, " ")

	name = strings.TrimSpace(name)

	return strings.Title(strings.ToLower(name))
}
