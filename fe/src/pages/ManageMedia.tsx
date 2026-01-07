import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { AddMediaRequest } from "../lib/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";

export function ManageMedia() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<AddMediaRequest>({
    type: "video",
    title: "",
    description: "",
    year: new Date().getFullYear(),
    poster_path: "",
    path: "",
    size: 0,
    duration: 0,
    mime: "",
    season: undefined,
    episode: undefined,
  });

  const mutation = useMutation({
    mutationFn: api.addMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      navigate("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? Number(value) : undefined) : value,
    }));
  };

  const showSeasonEpisode = formData.type === "series";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-950 mb-3">Add New Media</h1>
        <p className="text-base text-gray-500">
          Fill in the details to add media to your library
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-100 rounded-lg p-8"
      >
        {mutation.error && (
          <div className="mb-6">
            <ErrorMessage message={mutation.error.message} />
          </div>
        )}

        <div className="space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="movie">Movie</option>
              <option value="series">TV Series</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              minLength={2}
              placeholder="Enter media title"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Enter description"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min={1900}
              max={2100}
              placeholder="2026"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Poster Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poster URL
            </label>
            <input
              type="url"
              name="poster_path"
              value={formData.poster_path}
              onChange={handleChange}
              placeholder="https://example.com/poster.jpg"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* File Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Path *
            </label>
            <input
              type="text"
              name="path"
              value={formData.path}
              onChange={handleChange}
              required
              minLength={2}
              placeholder="/media/videos/movie.mp4"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Size (bytes) *
            </label>
            <input
              type="number"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
              min={0}
              placeholder="1048576"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (seconds)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration || ""}
              onChange={handleChange}
              min={0}
              placeholder="3600"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* MIME Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MIME Type
            </label>
            <input
              type="text"
              name="mime"
              value={formData.mime}
              onChange={handleChange}
              placeholder="video/mp4"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Season & Episode (for series) */}
          {showSeasonEpisode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season
                </label>
                <input
                  type="number"
                  name="season"
                  value={formData.season || ""}
                  onChange={handleChange}
                  min={1}
                  placeholder="1"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Episode
                </label>
                <input
                  type="number"
                  name="episode"
                  value={formData.episode || ""}
                  onChange={handleChange}
                  min={1}
                  placeholder="1"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 mt-8 pt-8 border-t border-gray-100">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {mutation.isPending ? (
              <>
                <LoadingSpinner />
                <span>Adding...</span>
              </>
            ) : (
              <span>Add Media</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
