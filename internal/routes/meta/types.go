package meta

import "mediaplay/internal/metadata"

type MetadataCandidate struct {
	URL           string  `json:"url"`
	Title         string  `json:"title"`
	OriginalTitle string  `json:"original_title,omitempty"`
	Year          *int    `json:"year,omitempty"`
	Overview      string  `json:"overview,omitempty"`
	Popularity    float64 `json:"popularity,omitempty"`
	Score         float64 `json:"score,omitempty"`
	Artist        string  `json:"artist,omitempty"`
	Source        string  `json:"source"`
	ExternalID    string  `json:"external_id,omitempty"`
	MediaType     string  `json:"media_type,omitempty"`
}

type MetadataCandidates struct {
	Candidates  []MetadataCandidate `json:"candidates"`
	TMDBEnabled bool                `json:"tmdb_enabled"`
}

type RefreshMetadataInput struct {
	Query string `json:"query,omitempty"`
}

type UpdateMetadataInput = MetadataCandidate

// Convert from metadata service type to API type
func FromMetadataCandidate(mc metadata.MetadataCandidate) MetadataCandidate {
	return MetadataCandidate{
		URL:           mc.URL,
		Title:         mc.Title,
		OriginalTitle: mc.OriginalTitle,
		Year:          mc.Year,
		Overview:      mc.Overview,
		Popularity:    mc.Popularity,
		Score:         mc.Score,
		Artist:        mc.Artist,
		Source:        mc.Source,
		ExternalID:    mc.ExternalID,
		MediaType:     mc.MediaType,
	}
}

// Convert from API type to metadata service type
func ToMetadataCandidate(mc MetadataCandidate) metadata.MetadataCandidate {
	return metadata.MetadataCandidate{
		URL:           mc.URL,
		Title:         mc.Title,
		OriginalTitle: mc.OriginalTitle,
		Year:          mc.Year,
		Overview:      mc.Overview,
		Popularity:    mc.Popularity,
		Score:         mc.Score,
		Artist:        mc.Artist,
		Source:        mc.Source,
		ExternalID:    mc.ExternalID,
		MediaType:     mc.MediaType,
	}
}
