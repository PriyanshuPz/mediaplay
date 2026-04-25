package meta

import (
	"context"
	"mediaplay/internal/config"
	"mediaplay/internal/metadata"

	"gorm.io/gorm"
)

type service struct {
	db      *gorm.DB
	cfg     *config.Config
	metaSvc *metadata.Service
}

type Service interface {
	GetMetadataCandidates(ctx context.Context, id uint, query string) (MetadataCandidates, error)
	RefreshMetadata(ctx context.Context, id uint, query string) error
	UpdateMetadata(ctx context.Context, id uint, input UpdateMetadataInput) error
}

func NewService(db *gorm.DB, cfg *config.Config) Service {
	return &service{
		db:      db,
		cfg:     cfg,
		metaSvc: metadata.NewService(db, cfg),
	}
}

func (s *service) GetMetadataCandidates(ctx context.Context, id uint, query string) (MetadataCandidates, error) {

	results, err := s.metaSvc.Search(ctx, id, query)
	if err != nil {
		return MetadataCandidates{}, err
	}

	candidates := make([]MetadataCandidate, 0, len(results))
	for _, r := range results {
		candidates = append(candidates, FromMetadataCandidate(r))
	}

	return MetadataCandidates{
		Candidates:  candidates,
		TMDBEnabled: true,
	}, nil
}

func (s *service) RefreshMetadata(ctx context.Context, id uint, query string) error {
	if query != "" {
		return s.metaSvc.Refresh(ctx, id)
	}
	return s.metaSvc.Refresh(ctx, id)
}

func (s *service) UpdateMetadata(ctx context.Context, id uint, input UpdateMetadataInput) error {
	return s.metaSvc.UpdateManual(id, ToMetadataCandidate(input))
}
