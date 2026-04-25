import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { API_ORIGIN, api, getMediaStreamUrl } from "../lib/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { VideoPlayer } from "../components/VideoPlayer";
import { MusicPlayer } from "../components/MusicPlayer";
import { MetadataSearchPanel } from "../components/MetadataSearchPanel";
import type { Media, MetadataCandidate } from "../lib/types";
import { FaArrowLeft, FaEllipsisVertical } from "react-icons/fa6";

export function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const {
    data: media,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["media", id],
    queryFn: () => api.getMediaById(id!),
    enabled: !!id,
  });

  const previewThumbnail = useMemo(
    () => resolveAssetUrl(media?.thumbnail),
    [media?.thumbnail],
  );

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshMetadata(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", id] });
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  const applyMetadataMutation = useMutation({
    mutationFn: (candidate: MetadataCandidate) =>
      api.updateMetadata(id!, candidate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", id] });
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
      setSearchOpen(false);
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

  const metadataEntries = useMemo(() => {
    if (!media?.metadata || typeof media.metadata !== "object") {
      return [] as Array<[string, unknown]>;
    }

    return Object.entries(media.metadata as Record<string, unknown>)
      .filter(([key, value]) => key !== "synced_at" && value != null)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  }, [media?.metadata]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!media) return <ErrorMessage message="Media not found" />;

  const streamUrl = getMediaStreamUrl(media.id.toString());
  const playlistItems = playlistQuery.data ?? [];

  return (
    <>
      <div className="space-y-8 pb-20 text-zinc-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
          >
            <FaArrowLeft size={14} />
            Back
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <FaEllipsisVertical size={18} />
            </button>

            {showMenu ? (
              <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
                <button
                  onClick={() => {
                    refreshMutation.mutate();
                    setShowMenu(false);
                  }}
                  disabled={refreshMutation.isPending}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"
                >
                  <span>Refresh metadata</span>
                  <span className="text-xs text-zinc-500">
                    {refreshMutation.isPending ? "..." : "⌘R"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/5"
                >
                  <span>Search metadata</span>
                  <span className="text-xs text-zinc-500">TMDB / iTunes</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-[#141414] shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_32%)]" />
          <div className="relative grid gap-8 px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8 lg:py-8">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-zinc-900 shadow-2xl">
                {previewThumbnail ? (
                  <img
                    src={previewThumbnail}
                    alt={media.title}
                    className="aspect-2/3 w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-2/3 items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-950 text-xs uppercase tracking-[0.3em] text-zinc-500">
                    No artwork
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                <StatPill label="Type" value={media.type} />
                <StatPill
                  label="Status"
                  value={media.external_id ? "Matched" : "Local"}
                />
                {media.season ? (
                  <StatPill
                    label="Season"
                    value={String(media.season.number)}
                  />
                ) : null}
                {media.episode ? (
                  <StatPill
                    label="Episode"
                    value={String(media.episode.number)}
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 pt-2 lg:pt-6">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-400">
                    {media.series?.title || media.type}
                  </p>
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    {media.title}
                  </h1>
                  {media.description ? (
                    <p className="max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
                      {media.description}
                    </p>
                  ) : (
                    <p className="max-w-3xl text-base leading-7 text-zinc-500">
                      No description available.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge>{media.type}</Badge>
                  {media.series?.title ? (
                    <Badge>{media.series.title}</Badge>
                  ) : null}
                  {media.external_id ? (
                    <Badge subtle>{media.external_id}</Badge>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoCard label="Title" value={media.title} />
                <InfoCard label="Series" value={media.series?.title || "-"} />
                <InfoCard label="Season" value={media.season?.number ?? "-"} />
                <InfoCard
                  label="Episode"
                  value={media.episode?.number ?? "-"}
                />
              </div>

              {media.type === "music" ? (
                <MusicPlayer
                  tracks={playlistItems}
                  initialTrackIndex={Math.max(
                    0,
                    playlistItems.findIndex((track) => track.id === media.id),
                  )}
                />
              ) : (
                <VideoPlayer
                  src={streamUrl}
                  poster={previewThumbnail}
                  title={media.title}
                />
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                  Metadata
                </p>
                <h2 className="text-xl font-semibold text-white">
                  Structured information
                </h2>
              </div>
            </div>

            {metadataEntries.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {metadataEntries.map(([key, value]) => (
                  <MetadataTile
                    key={key}
                    label={humanizeKey(key)}
                    value={value}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-zinc-400">
                No metadata snapshot has been saved yet.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                File
              </p>
              <h2 className="text-xl font-semibold text-white">
                Media details
              </h2>
            </div>

            <div className="space-y-4 text-sm text-zinc-300">
              <DetailRow label="File path" value={media.file_path} mono />
              <DetailRow
                label="Thumbnail"
                value={media.thumbnail || "-"}
                mono
              />
              <DetailRow label="Created" value={formatDate(media.created_at)} />
              <DetailRow label="Updated" value={formatDate(media.updated_at)} />
            </div>

            {playlistItems.length > 1 ? (
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                  Queue
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {media.type === "music" ? "Playlist" : "Series episodes"}
                </h3>

                <div className="mt-4 space-y-2">
                  {playlistItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/media/${item.id}`)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/5 ${
                        item.id === media.id
                          ? "border-white/20 bg-white/10"
                          : "border-white/10 bg-white/0"
                      }`}
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                        {item.thumbnail ? (
                          <img
                            src={resolveAssetUrl(item.thumbnail)}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {item.series?.title || item.file_path}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-4xl border border-white/10 bg-[#0d0d0d] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.7)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                  Apply metadata
                </p>
                <h2 className="text-2xl font-semibold text-white">
                  Pick a candidate for {media.title}
                </h2>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <MetadataSearchPanel
              mediaId={media.id.toString()}
              defaultQuery={media.title}
              title={`Search ${media.type === "music" ? "music" : "film/series"} metadata`}
              description="Choose a result to write its metadata back to the media record."
              onSelect={(candidate) => applyMetadataMutation.mutate(candidate)}
            />

            {applyMetadataMutation.isPending ? (
              <p className="mt-4 text-sm text-zinc-400">
                Applying selected metadata...
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function Badge({
  children,
  subtle = false,
}: {
  children: string;
  subtle?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${
        subtle
          ? "border border-white/10 bg-white/5 text-zinc-300"
          : "bg-white text-zinc-950"
      }`}
    >
      {children}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function MetadataTile({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-200">
        {renderMetadataValue(value)}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-zinc-500">{label}</span>
      <span
        className={`max-w-[70%] text-right ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function renderMetadataValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => renderMetadataValue(item)).join(", ");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(
      0,
      4,
    );
    return entries
      .map(([key, item]) => `${humanizeKey(key)}: ${renderMetadataValue(item)}`)
      .join(" · ");
  }

  return String(value);
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString();
}

function resolveAssetUrl(path?: string) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_ORIGIN}${path}`;
  }

  return `${API_ORIGIN}/${path}`;
}
