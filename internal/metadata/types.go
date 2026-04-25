package metadata

type MetadataCandidate struct {
	URL           string `json:"url"`
	Title         string `json:"title"`
	OriginalTitle string `json:"original_title,omitempty"`

	Year     *int   `json:"year,omitempty"`
	Overview string `json:"overview,omitempty"`

	Popularity float64 `json:"popularity,omitempty"`
	Score      float64 `json:"score,omitempty"`

	Artist string `json:"artist,omitempty"`

	Source     string `json:"source"`
	ExternalID string `json:"external_id,omitempty"`

	MediaType string `json:"media_type,omitempty"`
}
