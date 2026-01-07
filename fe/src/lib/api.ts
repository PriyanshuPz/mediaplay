const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost/api";

export interface MediaFile {
  file_id: number;
  path: string;
  name: string;
  size: number;
  duration?: number;
  mime?: string;
  season?: number;
  episode?: number;
}

export interface Media extends MediaFile {
  id: number;
  type: "image" | "video" | "movie" | "series";
  title: string;
  description?: string;
  year?: number;
  poster_path?: string;
  created_at: number;
}

export interface AddMediaRequest {
  type: "image" | "video" | "movie" | "series";
  title: string;
  description: string;
  year?: number;
  poster_path?: string;
  path: string;
  size: number;
  duration?: number;
  mime?: string;
  season?: number;
  episode?: number;
}

export const api = {
  async fetchMedia(): Promise<Media[]> {
    const response = await fetch(`${API_BASE_URL}/media`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch media");
    }
    return data.data;
  },

  async getMediaById(id: string): Promise<Media> {
    const response = await fetch(`${API_BASE_URL}/media/${id}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch media");
    }
    return data.data;
  },

  async addMedia(media: AddMediaRequest): Promise<{ media_id: number }> {
    const response = await fetch(`${API_BASE_URL}/media/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(media),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to add media");
    }
    return data;
  },
};
