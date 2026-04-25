import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import type { MetadataCandidate } from "../lib/types";

interface MetadataSearchPanelProps {
  mediaId: string;
  defaultQuery: string;
  title: string;
  description: string;
  onSelect: (candidate: MetadataCandidate) => void;
}

export function MetadataSearchPanel({
  mediaId,
  defaultQuery,
  title,
  description,
  onSelect,
}: MetadataSearchPanelProps) {
  const [query, setQuery] = useState(defaultQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["metadata-candidates", mediaId, query],
    queryFn: () => api.getMetadataCandidates(mediaId, query),
    enabled: query.trim().length > 0,
  });

  const candidates = data?.candidates ?? [];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Metadata search
          </p>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex w-full max-w-md gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, album, artist..."
            className="flex-1 rounded-md border bg-input px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
          >
            Search
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="rounded-md border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          Searching...
        </div>
      ) : candidates.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {candidates.map((c) => (
            <button
              key={`${c.source}-${c.external_id || c.url}`}
              onClick={() => onSelect(c)}
              className="flex gap-3 rounded-lg border bg-card p-3 text-left transition hover:bg-accent"
            >
              <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {c.url && (
                  <img
                    src={c.url}
                    alt={c.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.artist || c.original_title || c.source}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {c.source}
                  </span>
                </div>

                {c.overview ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {c.overview}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  {c.year && <MetaPill label={String(c.year)} />}
                  {c.score && (
                    <MetaPill label={`Score ${c.score.toFixed(1)}`} />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          No results. Try a simpler query.
        </div>
      )}
    </div>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px]">{label}</span>
  );
}
