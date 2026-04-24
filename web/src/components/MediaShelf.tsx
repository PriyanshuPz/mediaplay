import { Link } from "react-router-dom";
import type { Media } from "../lib/types";
import { MediaCard } from "./MediaCard";

interface MediaShelfProps {
  title: string;
  description?: string;
  items: Media[];
  emptyText: string;
  actionLabel?: string;
  actionTo?: string;
}

export function MediaShelf({
  title,
  description,
  items,
  emptyText,
  actionLabel,
  actionTo,
}: MediaShelfProps) {
  const featuredItems = items.slice(0, 18);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 border-b border-zinc-200 pb-2">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-700">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs text-zinc-500">{description}</p>
          ) : null}
        </div>
        {actionLabel && actionTo ? (
          <Link
            to={actionTo}
            className="hidden border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900 sm:inline-flex"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {featuredItems.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      )}
    </section>
  );
}
