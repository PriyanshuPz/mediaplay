import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { MetadataSearchPanel } from "../components/MetadataSearchPanel";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { api } from "../lib/api";
import type {
  MediaType,
  MetadataCandidate,
  UpdateMediaInput,
} from "../lib/types";

interface EditingMedia {
  id: number;
  title: string;
  description: string;
  seriesName?: string;
  type: MediaType;
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<EditingMedia | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["media", "all"],
    queryFn: api.fetchMedia,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMediaInput }) =>
      api.updateMedia(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
      setEditingId(null);
      setEditingData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteMedia,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  const filteredData = data?.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[#111111] px-6 py-5 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Media Management
        </h1>
        <p className="text-sm text-zinc-400">
          Edit media details, search metadata candidates, or remove items from
          your library.
        </p>
      </section>

      <div className="rounded-[28px] border border-white/10 bg-[#111111] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
        <input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20"
        />
      </div>

      {error ? <ErrorMessage message={error.message} /> : null}
      {isLoading ? <LoadingSpinner /> : null}

      {filteredData && filteredData.length > 0 ? (
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Series
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredData.map((media) => (
                  <tr key={media.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{media.title}</p>
                      <p className="text-xs text-zinc-500">{media.file_path}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-300">
                        {media.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {media.series?.title || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(media.id);
                            setEditingData({
                              id: media.id,
                              title: media.title,
                              description: media.description,
                              seriesName: media.series?.title,
                              type: media.type,
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                        >
                          <FaEdit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${media.title}"? This cannot be undone.`,
                              )
                            ) {
                              deleteMutation.mutate(media.id.toString());
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <FaTrash size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {editingId && editingData ? (
        <EditMediaModal
          media={editingData}
          onSave={(updatedData) => {
            updateMutation.mutate({
              id: editingId.toString(),
              input: {
                title: updatedData.title,
                description: updatedData.description,
                seriesName: updatedData.seriesName || undefined,
              },
            });
          }}
          onCancel={() => {
            setEditingId(null);
            setEditingData(null);
          }}
          isLoading={updateMutation.isPending}
        />
      ) : null}
    </div>
  );
}

interface EditMediaModalProps {
  media: EditingMedia;
  onSave: (
    data: Pick<EditingMedia, "id" | "title" | "description" | "seriesName">,
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditMediaModal({
  media,
  onSave,
  onCancel,
  isLoading,
}: EditMediaModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(media.title);
  const [description, setDescription] = useState(media.description);
  const [seriesName, setSeriesName] = useState(media.seriesName || "");

  const applyMutation = useMutation({
    mutationFn: (candidate: MetadataCandidate) =>
      api.updateMetadata(media.id.toString(), candidate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-4xl border border-white/10 bg-[#0d0d0d] shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold text-white">Edit Media</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Search metadata candidates and apply them before saving manual
            edits.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#111111] p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Series Name (Optional)
              </label>
              <input
                type="text"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
              Candidate search uses {media.type === "music" ? "iTunes" : "TMDB"}{" "}
              automatically.
            </div>
          </div>

          <div className="space-y-4">
            <MetadataSearchPanel
              mediaId={media.id.toString()}
              defaultQuery={media.title}
              title={`Search ${media.type === "music" ? "music" : "film/series"} metadata`}
              description="Selecting a candidate writes the metadata snapshot and fills the edit form fields."
              onSelect={(candidate) => {
                setTitle(candidate.title || title);
                setDescription(candidate.overview || description);
                if (candidate.artist && !seriesName) {
                  setSeriesName(candidate.artist);
                }

                applyMutation.mutate(candidate);
              }}
            />

            {applyMutation.isPending ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                Applying selected metadata...
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-6 py-5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({ id: media.id, title, description, seriesName })
            }
            disabled={isLoading}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
