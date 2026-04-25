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

type UpdateMediaInput struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Thumbnail   *string `json:"thumbnail"`

	Type *db.MediaType `json:"type"`

	SeriesName *string `json:"seriesName"`
	Season     *int    `json:"season"`
	Episode    *int    `json:"episode"`
}
