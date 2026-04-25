export interface Stats {
  movies: number;
  music: number;
  series: number;
}

export interface HomeFeed {
  movies: Media[];
  music: Media[];
  series: Media[];
}

export type MediaType = "movie" | "music" | "series";

export interface Series {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  external_id?: string;
  metadata?: unknown;
}

export interface Season {
  id: number;
  created_at: string;
  updated_at: string;
  series_id: number;
  number: number;
}

export interface Episode {
  id: number;
  created_at: string;
  updated_at: string;
  season_id: number;
  title: string;
  number: number;
  media_id: number;
}

export interface Media {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  file_path: string;
  thumbnail?: string;
  type: MediaType;
  external_id?: string;
  metadata?: unknown;
  series_id?: number;
  season_id?: number;
  series?: Series | null;
  season?: Season | null;
  episode?: Episode | null;
}

export interface UpdateMediaInput {
  title?: string;
  description?: string;
  thumbnail?: string;
  type?: MediaType;
  seriesName?: string;
  season?: number;
  episode?: number;
}

export interface MetadataCandidate {
  url: string;
  title: string;
  original_title?: string;
  year?: number;
  overview?: string;
  popularity?: number;
  score?: number;
  artist?: string;
  source: string;
  external_id?: string;
  media_type?: string;
}

export interface MetadataCandidatesResponse {
  candidates: MetadataCandidate[];
  tmdb_enabled: boolean;
}
