import type {
  HomeFeed,
  Media,
  MediaType,
  Stats,
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

  async updateMedia(id: string, input: UpdateMediaInput): Promise<Media> {
    return apiCall(`/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async uploadThumbnail(
    id: string,
    file: File,
  ): Promise<{ thumbnail: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return apiCall(`/media/${id}/thumbnail`, {
      method: "POST",
      body: formData,
    });
  },
};
