import type {
  HomeFeed,
  Media,
  MediaType,
  Stats,
  MetadataCandidate,
  MetadataCandidatesResponse,
  UpdateMediaInput,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_ORIGIN = new URL(API_BASE_URL).origin;

type ApiEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

const makeUrl = (endpoint: string) => {
  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL
    : `${API_BASE_URL}/`;
  return new URL(endpoint.replace(/^\//, ""), normalizedBase).toString();
};

export const getMediaStreamUrl = (id: string) => makeUrl(`/media/${id}/stream`);

const apiCall = async <T>(endpoint: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(makeUrl(endpoint), {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Request failed");
  }

  return data.data as T;
};

export const api = {
  async fetchStats(): Promise<Stats> {
    return apiCall("/stats");
  },

  async getHomeFeed(): Promise<HomeFeed> {
    return apiCall("/home");
  },

  async listMedia(type?: MediaType): Promise<Media[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    return apiCall(`/media${query}`);
  },

  async fetchMedia(): Promise<Media[]> {
    return api.listMedia();
  },

  async getMediaById(id: string): Promise<Media> {
    return apiCall(`/media/${id}`);
  },

  async getMediaRecommendations(id: string, limit = 12): Promise<Media[]> {
    const params = new URLSearchParams();
    if (limit > 0) {
      params.set("limit", String(limit));
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiCall(`/media/${id}/recommendations${suffix}`);
  },

  async getMetadataCandidates(
    id: string,
    query?: string,
  ): Promise<MetadataCandidatesResponse> {
    const params = new URLSearchParams();
    if (query?.trim()) {
      params.set("q", query.trim());
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiCall(`/meta/${id}/candidates${suffix}`);
  },

  async refreshMetadata(id: string, query?: string): Promise<void> {
    const params = new URLSearchParams();
    if (query?.trim()) {
      params.set("q", query.trim());
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiCall(`/meta/${id}/refresh${suffix}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async updateMetadata(id: string, input: MetadataCandidate): Promise<void> {
    return apiCall(`/meta/${id}/update`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateMedia(id: string, input: UpdateMediaInput): Promise<Media> {
    return apiCall(`/admin/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteMedia(id: string): Promise<void> {
    return apiCall(`/admin/media/${id}`, {
      method: "DELETE",
    });
  },

  async uploadThumbnail(
    id: string,
    file: File,
  ): Promise<{ thumbnail: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return apiCall(`/admin/media/${id}/thumbnail`, {
      method: "POST",
      body: formData,
    });
  },
};
