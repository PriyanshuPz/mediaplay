import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_ORIGIN, api, getMediaStreamUrl } from "../lib/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import type { Media, MediaType, UpdateMediaInput } from "../lib/types";
import {
  FaArrowLeft,
  FaCamera,
  FaFloppyDisk,
  FaListUl,
  FaPlay,
} from "react-icons/fa6";

export function MediaViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [type, setType] = useState<MediaType>("movie");
  const [seriesName, setSeriesName] = useState("");
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const {
    data: media,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["media", id],
    queryFn: () => api.getMediaById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!media) {
      return;
    }

    setTitle(media.title ?? "");
    setDescription(media.description ?? "");
    setThumbnail(media.thumbnail ?? "");
    setType(media.type);
    setSeriesName(media.series?.title ?? "");
    setSeason(media.season?.number?.toString() ?? "");
    setEpisode(media.episode?.number?.toString() ?? "");
  }, [media]);

  const updateMutation = useMutation({
    mutationFn: (input: UpdateMediaInput) => api.updateMedia(id!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", id] });
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (selectedFile: File) => api.uploadThumbnail(id!, selectedFile),
    onSuccess: async ({ thumbnail: uploadedThumbnail }) => {
      setThumbnail(uploadedThumbnail);
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["media", id] });
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  const playlistQuery = useQuery({
    queryKey: ["playlist", media?.type, media?.series_id],
    queryFn: async () => {
      if (!media) {
        return [] as Media[];
      }

      if (media.type === "music") {
        return api.listMedia("music");
      }

      if (media.type === "series") {
        const seriesItems = await api.listMedia("series");

        if (!media.series_id) {
          return seriesItems;
        }

        return seriesItems.filter((item) => item.series_id === media.series_id);
      }

      return [] as Media[];
    },
    enabled: !!media,
  });

  const previewThumbnail = useMemo(() => {
    if (!thumbnail) {
      return "";
    }

    if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
      return thumbnail;
    }

    return `${API_ORIGIN}${thumbnail}`;
  }, [thumbnail]);

  const streamUrl = useMemo(() => {
    if (!id) {
      return "";
    }

    return getMediaStreamUrl(id);
  }, [id]);

  const playlistItems = useMemo(() => {
    const items = playlistQuery.data ?? [];

    if (!media) {
      return [];
    }

    if (media.type === "series") {
      return [...items].sort((left, right) => {
        const seasonDifference =
          (left.season?.number ?? 0) - (right.season?.number ?? 0);
        if (seasonDifference !== 0) {
          return seasonDifference;
        }

        const episodeDifference =
          (left.episode?.number ?? 0) - (right.episode?.number ?? 0);
        if (episodeDifference !== 0) {
          return episodeDifference;
        }

        return left.title.localeCompare(right.title);
      });
    }

    return items;
  }, [media, playlistQuery.data]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const payload: UpdateMediaInput = {
      title,
      description,
      thumbnail: thumbnail || undefined,
      type,
      seriesName: type === "series" && seriesName ? seriesName : undefined,
      season: type === "series" && season ? Number(season) : undefined,
      episode: type === "series" && episode ? Number(episode) : undefined,
    };

    updateMutation.mutate(payload);
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    uploadMutation.mutate(file);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !media) {
    return <ErrorMessage message={error?.message || "Media not found"} />;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/manage/media")}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
      >
        <FaArrowLeft className="h-3 w-3" />
        Back to library
      </button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Player
                </div>
                <h2 className="mt-1 text-sm font-medium text-zinc-900">
                  {media.type === "music" ? "Audio playback" : "Video playback"}
                </h2>
              </div>
              <div className="inline-flex items-center gap-1.5 border border-zinc-200 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                <FaPlay className="h-3 w-3" />
                {media.type}
              </div>
            </div>

            <div className="bg-black">
              {media.type === "music" ? (
                <audio
                  controls
                  preload="metadata"
                  src={streamUrl}
                  className="w-full"
                />
              ) : (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={previewThumbnail || undefined}
                  src={streamUrl}
                  className="aspect-video w-full bg-black"
                />
              )}
            </div>

            <div className="grid gap-3 border-t border-zinc-200 px-4 py-3 sm:grid-cols-2">
              <Info label="File path" value={media.file_path} />
              <Info
                label="Created"
                value={new Date(media.created_at).toLocaleString()}
              />
              <Info
                label="Updated"
                value={new Date(media.updated_at).toLocaleString()}
              />
              <Info label="External ID" value={media.external_id || "None"} />
            </div>
          </section>

          {playlistItems.length > 1 ? (
            <section className="border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                    Playlist
                  </div>
                  <h2 className="mt-1 text-sm font-medium text-zinc-900">
                    {media.type === "music" ? "All tracks" : "Series episodes"}
                  </h2>
                </div>
                <FaListUl className="h-3.5 w-3.5 text-zinc-500" />
              </div>

              <div className="divide-y divide-zinc-200">
                {playlistItems.map((item) => {
                  const isActive = item.id === media.id;

                  return (
                    <Link
                      key={item.id}
                      to={`/media/${item.id}`}
                      className={`block px-4 py-3 transition-colors ${
                        isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="truncate text-sm font-medium text-zinc-900">
                            {item.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                            {item.type === "series" && item.series?.title ? (
                              <span>{item.series.title}</span>
                            ) : null}
                            {item.season?.number ? (
                              <span>S{item.season.number}</span>
                            ) : null}
                            {item.episode?.number ? (
                              <span>E{item.episode.number}</span>
                            ) : null}
                          </div>
                        </div>

                        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                          {isActive ? "Playing" : "Open"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <section className="space-y-4 border border-zinc-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-700">
              Edit metadata
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Update title, description, classification, and thumbnail.
            </p>
          </div>

          {updateMutation.error ? (
            <ErrorMessage message={updateMutation.error.message} />
          ) : null}

          {uploadMutation.error ? (
            <ErrorMessage message={uploadMutation.error.message} />
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                className="w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </Field>

            <Field label="Type">
              <select
                value={type}
                onChange={(event) => setType(event.target.value as MediaType)}
                className="w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              >
                <option value="movie">Movie</option>
                <option value="music">Music</option>
                <option value="series">Series</option>
              </select>
            </Field>

            {type === "series" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Series name">
                  <input
                    value={seriesName}
                    onChange={(event) => setSeriesName(event.target.value)}
                    className="w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  />
                </Field>
                <Field label="Season">
                  <input
                    value={season}
                    onChange={(event) => setSeason(event.target.value)}
                    type="number"
                    min={1}
                    className="w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  />
                </Field>
                <Field label="Episode">
                  <input
                    value={episode}
                    onChange={(event) => setEpisode(event.target.value)}
                    type="number"
                    min={1}
                    className="w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  />
                </Field>
              </div>
            ) : null}

            <Field label="Thumbnail URL">
              <input
                value={thumbnail}
                onChange={(event) => setThumbnail(event.target.value)}
                placeholder="https://... or /meta/media/..."
                className="w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </Field>

            <div className="space-y-2 border border-dashed border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-2">
                <FaCamera className="h-3.5 w-3.5 text-zinc-500" />
                <div className="text-sm font-medium text-zinc-800">
                  Upload thumbnail
                </div>
              </div>
              <p className="text-xs leading-5 text-zinc-500">
                Pick a file and store it in the metadata directory. The app will
                save a browser-friendly URL automatically.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-zinc-600 file:mr-3 file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-50 hover:file:bg-zinc-700"
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploadMutation.isPending}
                className="inline-flex items-center justify-center border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload thumbnail"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaFloppyDisk className="h-3 w-3" />
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </div>
      <div
        className="mt-1 text-xs text-zinc-700"
        style={{ overflowWrap: "anywhere" }}
      >
        {value}
      </div>
    </div>
  );
}
