import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeHigh,
  FaBackward,
  FaForward,
  FaListUl,
} from "react-icons/fa6";
import { FaVolumeMute } from "react-icons/fa";
import type { Media } from "../lib/types";
import { API_ORIGIN, getMediaStreamUrl } from "../lib/api";

interface MusicPlayerProps {
  tracks: Media[];
  initialTrackIndex?: number;
  onTrackChange?: (trackId: number) => void;
}

export function MusicPlayer({
  tracks,
  initialTrackIndex = 0,
  onTrackChange,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    if (tracks.length === 0) {
      return 0;
    }

    return Math.max(0, Math.min(initialTrackIndex, tracks.length - 1));
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack]);

  const getThumbnail = (track: Media) => {
    if (!track.thumbnail) return "";
    if (track.thumbnail.startsWith("http")) return track.thumbnail;
    return `${API_ORIGIN}${track.thumbnail}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (tracks.length === 0) {
      return;
    }

    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    onTrackChange?.(tracks[nextIndex].id);
  };

  const playPrevious = () => {
    if (tracks.length === 0) {
      return;
    }

    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIndex);
    onTrackChange?.(tracks[prevIndex].id);
  };

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    onTrackChange?.(tracks[index].id);
    setShowPlaylist(false);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume || 0.5);
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
      {currentTrack && (
        <>
          <audio
            ref={audioRef}
            src={getMediaStreamUrl(currentTrack.id.toString())}
            crossOrigin="anonymous"
          />

          <div className="p-6">
            {/* Album art */}
            <div className="mb-6 flex justify-center">
              <img
                src={getThumbnail(currentTrack) || "/placeholder-album.png"}
                alt={currentTrack.title}
                className="w-48 h-48 rounded-lg shadow-lg object-cover"
              />
            </div>

            {/* Track info */}
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-zinc-900 mb-1">
                {currentTrack.title}
              </h3>
              {currentTrack.description && (
                <p className="text-sm text-zinc-600">
                  {currentTrack.description}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-2 bg-zinc-200 rounded-full cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={playPrevious}
                className="p-3 rounded-full hover:bg-zinc-100 transition-colors text-zinc-700"
              >
                <FaBackward size={20} />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center text-white shadow-lg"
              >
                {isPlaying ? (
                  <FaPause size={28} />
                ) : (
                  <FaPlay size={28} className="ml-1" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-3 rounded-full hover:bg-zinc-100 transition-colors text-zinc-700"
              >
                <FaForward size={20} />
              </button>
            </div>

            {/* Volume and playlist */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={handleToggleMute}
                  className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  {isMuted ? (
                    <FaVolumeMute size={20} />
                  ) : (
                    <FaVolumeHigh size={20} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="flex-1 h-2 bg-zinc-200 rounded-full cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0"
                />
              </div>

              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="p-2 text-zinc-600 hover:text-zinc-900 transition-colors ml-4"
              >
                <FaListUl size={20} />
              </button>
            </div>
          </div>

          {/* Playlist */}
          {showPlaylist && (
            <div className="border-t border-zinc-200 max-h-96 overflow-y-auto">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(index)}
                  className={`w-full text-left px-6 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                    index === currentTrackIndex ? "bg-blue-50" : ""
                  }`}
                >
                  <p
                    className={`font-medium ${
                      index === currentTrackIndex
                        ? "text-blue-600"
                        : "text-zinc-900"
                    }`}
                  >
                    {track.title}
                  </p>
                  {track.description && (
                    <p className="text-xs text-zinc-600">{track.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
