package worker

import (
	"context"
	"encoding/json"
	"io/fs"
	"log/slog"
	"mediaplay/internal/db"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync/atomic"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ScanJob struct {
	db        *gorm.DB
	logger    *slog.Logger
	mediaRoot string
}

func NewScanJob(db *gorm.DB, mediaRoot string, logger *slog.Logger) *ScanJob {
	return &ScanJob{
		db:        db,
		logger:    logger,
		mediaRoot: mediaRoot,
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

	return filepath.WalkDir(j.mediaRoot, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}

		if !isMediaFile(path) {
			return nil
		}

		rel, _ := filepath.Rel(j.mediaRoot, path)
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
	// async metadata
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

func extractTitle(path string) string {
	base := filepath.Base(path)
	return strings.TrimSuffix(base, filepath.Ext(base))
}

func (j *ScanJob) fetchMetadata(mediaID uint, title string) {
	// TODO! call OMDb or your scraper

	meta := map[string]interface{}{
		"title":   title,
		"fetched": true,
	}

	jsonData, _ := json.Marshal(meta)

	j.db.Model(&db.Media{}).
		Where("id = ?", mediaID).
		Update("metadata", jsonData)
}

func guessSeriesInfo(path string) (seriesName string, season int, ok bool) {
	lower := strings.ToLower(path)

	// detect S01E02 pattern
	re := regexp.MustCompile(`s(\d{1,2})e(\d{1,2})`)
	match := re.FindStringSubmatch(lower)

	if len(match) == 3 {
		season, _ = strconv.Atoi(match[1])
		ok = true
	}

	// fallback: parent folder as series
	dir := filepath.Dir(path)
	seriesName = filepath.Base(filepath.Dir(dir))

	return
}
