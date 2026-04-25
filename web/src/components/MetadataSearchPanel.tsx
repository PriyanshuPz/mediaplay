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
  const [submittedQuery, setSubmittedQuery] = useState(defaultQuery);

  const candidatesQuery = useQuery({
    queryKey: ["metadata-candidates", mediaId, submittedQuery],
    queryFn: () => api.getMetadataCandidates(mediaId, submittedQuery),
    enabled: submittedQuery.trim().length > 0,
  });

  const candidates = candidatesQuery.data?.candidates ?? [];

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#111111] p-5 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Metadata search
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmittedQuery(query.trim() || defaultQuery);
            await candidatesQuery.refetch();
          }}
          className="flex w-full max-w-md gap-2 sm:w-auto"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, album, or artist"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20"
          />
          <button
            type="submit"
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
        Results are fetched automatically from TMDB for films and series, and
        from iTunes for music.
      </div>

      <div className="mt-5">
        {candidatesQuery.isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-zinc-400">
            Searching metadata...
          </div>
        ) : candidates.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {candidates.map((candidate) => (
              <button
                key={`${candidate.source}-${candidate.external_id || candidate.url}`}
                onClick={() => onSelect(candidate)}
                className="group flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-3 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
              >
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-900">
                  {candidate.url ? (
                    <img
                      src={candidate.url}
                      alt={candidate.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {candidate.title}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {candidate.artist ||
                          candidate.original_title ||
                          candidate.source}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                      {candidate.source}
                    </span>
                  </div>

                  {candidate.overview ? (
                    <p className="line-clamp-3 text-xs leading-5 text-zinc-400">
                      {candidate.overview}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      No synopsis available.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    {candidate.year ? (
                      <MetaPill label={String(candidate.year)} />
                    ) : null}
                    {candidate.score ? (
                      <MetaPill label={`Score ${candidate.score.toFixed(1)}`} />
                    ) : null}
                    {candidate.popularity ? (
                      <MetaPill
                        label={`Popularity ${candidate.popularity.toFixed(1)}`}
                      />
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-zinc-400">
            No candidates found. Try a shorter search term or update the title.
          </div>
        )}
      </div>
    </div>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
      {label}
    </span>
  );
}
