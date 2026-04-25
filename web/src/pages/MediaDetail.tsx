import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { MetadataSearchPanel } from "../components/MetadataSearchPanel";
import { MediaCard } from "../components/MediaCard";
import { Modal } from "../components/modals/Modal";
import { formatDate, resolveAssetUrl } from "../lib/utls";
import type { Media } from "../lib/types";

export function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const { data: suggestions = [] } = useQuery({
    queryKey: ["media-recommendations", id],
    queryFn: () => api.getMediaRecommendations(id!, 12),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!media) return <ErrorMessage message="Media not found" />;

  const thumbnail = resolveAssetUrl(media.thumbnail);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Fix metadata
          </button>

          <button
            onClick={() => api.refreshMetadata(id!)}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-lg border bg-card">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={media.title}
              className="aspect-2/3 w-full object-cover"
            />
          ) : (
            <div className="aspect-2/3 flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {media.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {media.series?.title || media.type}
            </p>
          </div>

          {media.description && (
            <p className="text-sm text-muted-foreground">{media.description}</p>
          )}

          {media.type === "music" ? (
            <button
              onClick={() => navigate(`/listen/${media.id}`)}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Listen
            </button>
          ) : (
            <button
              onClick={() => navigate(`/player/${media.id}`)}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Play
            </button>
          )}

          {media.type === "series" && (
            <div className="text-sm text-muted-foreground">
              Season {media.season?.number} • Episode {media.episode?.number}
            </div>
          )}

          {media.type === "music" && (
            <div className="text-sm text-muted-foreground">Music track</div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <MediaMeta media={media} />
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Suggested Next
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Similar picks based on this title
            </p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            No similar media found yet.
          </div>
        ) : (
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className="w-37 min-w-37 snap-start sm:w-42 sm:min-w-42"
              >
                <MediaCard media={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {searchOpen && (
        <Modal onClose={() => setSearchOpen(false)}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-foreground">Search metadata</span>
            <button
              onClick={() => setSearchOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <MetadataSearchPanel
            mediaId={media.id.toString()}
            defaultQuery={media.title}
            title="Search metadata"
            description="Pick a result"
            onSelect={async (c) => {
              await api.updateMetadata(media.id.toString(), c);
              setSearchOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function MediaMeta({ media }: { media: Media }) {
  const meta =
    typeof media.metadata === "string"
      ? JSON.parse(media.metadata)
      : media.metadata || {};
  return (
    <div className="border border-border bg-card px-4 py-3">
      <h2 className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
        Info
      </h2>

      <div className="grid gap-2 text-sm">
        {meta.original_title && meta.original_title !== media.title && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original</span>
            <span className="text-foreground truncate">
              {meta.original_title}
            </span>
          </div>
        )}

        {meta.artist && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Artist</span>
            <span className="text-foreground truncate">{meta.artist}</span>
          </div>
        )}

        {meta.year && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Year</span>
            <span className="text-foreground">{meta.year}</span>
          </div>
        )}

        {meta.media_type && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="text-foreground capitalize">
              {meta.media_type}
            </span>
          </div>
        )}

        {meta.source && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source</span>
            <span className="text-foreground uppercase">{meta.source}</span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground flex justify-between">
        <span>{formatDate(media.created_at)}</span>
        <span>{formatDate(media.updated_at)}</span>
      </div>
    </div>
  );
}
