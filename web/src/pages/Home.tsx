import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { MediaShelf } from "../components/MediaShelf";

export function Home() {
  const {
    data: stats,
    isLoading: loadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["stats"],
    queryFn: api.fetchStats,
  });

  const {
    data: homeFeed,
    isLoading: loadingFeed,
    error: feedError,
  } = useQuery({
    queryKey: ["home-feed"],
    queryFn: api.getHomeFeed,
  });

  const pageError = statsError || feedError;

  if (pageError) {
    return <ErrorMessage message={pageError.message} />;
  }

  return (
    <div className="space-y-6">
      <section className="border border-zinc-200 bg-white px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              MediaPlay
            </div>
            <h1 className="text-lg font-medium text-zinc-900">
              Compact library overview
            </h1>
            <p className="text-sm text-zinc-500">
              Browse media, adjust metadata, and replace thumbnails.
            </p>
          </div>
        </div>
      </section>

      {loadingStats ? <LoadingSpinner /> : null}

      {stats ? (
        <div className="grid gap-2 border border-zinc-200 bg-white sm:grid-cols-3">
          <StatsCard label="Movies" count={stats.movies} />
          <StatsCard label="Music" count={stats.music} />
          <StatsCard label="Series" count={stats.series} />
        </div>
      ) : null}

      {loadingFeed ? <LoadingSpinner /> : null}

      {homeFeed ? (
        <div className="space-y-8">
          <MediaShelf
            title="Fresh movies"
            description="Recent movie entries in the catalog."
            items={homeFeed.movies}
            emptyText="No movies have been indexed yet."
            actionLabel="All movies"
            actionTo="/movies"
          />
          <MediaShelf
            title="Music"
            description="Albums, tracks, and other music entries."
            items={homeFeed.music}
            emptyText="No music has been indexed yet."
            actionLabel="All music"
            actionTo="/music"
          />
          <MediaShelf
            title="Series"
            description="Shows and seasons waiting for edits."
            items={homeFeed.series}
            emptyText="No series have been indexed yet."
            actionLabel="All series"
            actionTo="/series"
          />
        </div>
      ) : null}
    </div>
  );
}

function StatsCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="border-r border-zinc-200 p-3 last:border-r-0 sm:p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-medium text-zinc-900">{count}</div>
    </div>
  );
}
