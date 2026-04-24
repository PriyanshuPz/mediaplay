package media

import "mediaplay/internal/db"

type Stats struct {
	Movies int64 `json:"movies"`
	Music  int64 `json:"music"`
	Series int64 `json:"series"`
}

type HomeFeed struct {
	Movies []db.Media `json:"movies"`
	Music  []db.Media `json:"music"`
	Series []db.Media `json:"series"`
}

type MediaDetail struct {
	db.Media
}

type ThumbnailCandidate struct {
	URL        string `json:"url"`
	Title      string `json:"title"`
	Year       *int   `json:"year,omitempty"`
	Source     string `json:"source"`
	ExternalID string `json:"external_id,omitempty"`
}

type ThumbnailCandidates struct {
	CurrentThumbnail string               `json:"current_thumbnail,omitempty"`
	Candidates       []ThumbnailCandidate `json:"candidates"`
	TMDBEnabled      bool                 `json:"tmdb_enabled"`
}

type SelectThumbnailInput struct {
	URL        string `json:"url"`
	Title      string `json:"title"`
	Source     string `json:"source"`
	ExternalID string `json:"external_id"`
}

type UpdateMediaInput struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Thumbnail   *string `json:"thumbnail"`

	Type *db.MediaType `json:"type"`

	SeriesName *string `json:"seriesName"`
	Season     *int    `json:"season"`
	Episode    *int    `json:"episode"`
}
