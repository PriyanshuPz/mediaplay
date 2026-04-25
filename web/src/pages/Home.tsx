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
      <section className="rounded-lg border bg-card px-4 py-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            MediaPlay
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Your Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse, fix metadata, and manage your collection.
          </p>
        </div>
      </section>

      {/* Stats */}
      {loadingStats ? (
        <LoadingSpinner />
      ) : stats ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatsCard label="Movies" count={stats.movies} />
          <StatsCard label="Music" count={stats.music} />
          <StatsCard label="Series" count={stats.series} />
        </div>
      ) : null}

      {/* Feed */}
      {loadingFeed ? (
        <LoadingSpinner />
      ) : homeFeed ? (
        <div className="space-y-8">
          <MediaShelf
            title="Fresh movies"
            description="Recently added movies"
            items={homeFeed.movies}
            emptyText="No movies found"
            actionLabel="All movies"
            actionTo="/movies"
          />
          <MediaShelf
            title="Music"
            description="Tracks and albums"
            items={homeFeed.music}
            emptyText="No music found"
            actionLabel="All music"
            actionTo="/music"
          />
          <MediaShelf
            title="Series"
            description="Shows and seasons"
            items={homeFeed.series}
            emptyText="No series found"
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
    <div className="rounded-lg border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-foreground">{count}</div>
    </div>
  );
}
