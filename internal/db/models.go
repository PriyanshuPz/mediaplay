package db

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type MediaType string

const (
	MediaMovie  MediaType = "movie"
	MediaMusic  MediaType = "music"
	MediaSeries MediaType = "series"
)

type Media struct {
	ID        uint           `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time      `gorm:"column:created_at;not null" json:"created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at;not null" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"-"`

	Title       string `gorm:"column:title;not null" json:"title"`
	Description string `gorm:"column:description" json:"description"`
	FilePath    string `gorm:"column:file_path;uniqueIndex;not null" json:"file_path"`
	Thumbnail   string `gorm:"column:thumbnail" json:"thumbnail"`

	Type MediaType `gorm:"column:type;type:text;index;not null" json:"type"`

	ExternalID string `gorm:"column:external_id;index" json:"external_id"`

	Metadata datatypes.JSON `gorm:"column:metadata" json:"metadata"`

	SeriesID *uint   `gorm:"column:series_id;index" json:"series_id,omitempty"`
	Series   *Series `gorm:"foreignKey:SeriesID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"series,omitempty"`

	SeasonID *uint   `gorm:"column:season_id;index" json:"season_id,omitempty"`
	Season   *Season `gorm:"foreignKey:SeasonID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"season,omitempty"`
}

func (Media) TableName() string {
	return "media"
}

type Series struct {
	ID        uint      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time `gorm:"column:created_at;not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;not null" json:"updated_at"`

	Title       string         `gorm:"column:title;not null;index" json:"title"`
	Description string         `gorm:"column:description" json:"description"`
	ExternalID  string         `gorm:"column:external_id;index" json:"external_id"`
	Metadata    datatypes.JSON `gorm:"column:metadata" json:"metadata"`

	Seasons []Season `gorm:"foreignKey:SeriesID;constraint:OnDelete:CASCADE;" json:"seasons,omitempty"`
}

func (Series) TableName() string {
	return "series"
}

type Season struct {
	ID        uint      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time `gorm:"column:created_at;not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;not null" json:"updated_at"`

	SeriesID uint   `gorm:"column:series_id;index;not null" json:"series_id"`
	Series   Series `gorm:"foreignKey:SeriesID;constraint:OnDelete:CASCADE;" json:"series,omitempty"`

	Number int `gorm:"column:number;not null" json:"number"`

	Episodes []Episode `gorm:"foreignKey:SeasonID;constraint:OnDelete:CASCADE;" json:"episodes,omitempty"`
}

func (Season) TableName() string {
	return "seasons"
}

type Episode struct {
	ID        uint      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time `gorm:"column:created_at;not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;not null" json:"updated_at"`

	SeasonID uint   `gorm:"column:season_id;index;not null" json:"season_id"`
	Season   Season `gorm:"foreignKey:SeasonID;constraint:OnDelete:CASCADE;" json:"season,omitempty"`

	Title  string `gorm:"column:title" json:"title"`
	Number int    `gorm:"column:number;not null" json:"number"`

	MediaID uint  `gorm:"column:media_id;uniqueIndex;not null" json:"media_id"`
	Media   Media `gorm:"foreignKey:MediaID;constraint:OnDelete:CASCADE;" json:"media,omitempty"`
}

func (Episode) TableName() string {
	return "episodes"
}

type ScanLog struct {
	ID        uint      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	CreatedAt time.Time `gorm:"column:created_at;not null" json:"created_at"`

	Path    string `gorm:"column:path;index" json:"path"`
	Status  string `gorm:"column:status;index" json:"status"`
	Message string `gorm:"column:message" json:"message"`
}

func (ScanLog) TableName() string {
	return "scan_logs"
}
