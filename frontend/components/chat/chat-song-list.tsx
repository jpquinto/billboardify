import { ExternalLink, Music, Play } from "lucide-react";
import { Separator } from "../ui/separator";

// Helper function to check if data matches song structure
export const isSongData = (data: any[]): boolean => {
  if (!data || data.length === 0) return false;

  const firstItem = data[0];
  const requiredFields = [
    "track_id",
    "track_name",
    "artist_name",
    "album_name",
    "album_cover_url",
  ];

  return requiredFields.every((field) => field in firstItem);
};

interface Song {
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  total_plays?: number;
  album_cover_url: string;
}

interface ChatSongListProps {
  songs: Song[];
  playbackMessage?: string;
  playlistData?: {
    playlist_url: string;
    playlist_id: string;
    tracks_added: number;
  };
}

export const ChatSongList = ({
  songs,
  playbackMessage,
  playlistData,
}: ChatSongListProps) => {
  const displaySongs = songs.slice(0, 10);
  const hasMore = songs.length > 10;

  return (
    <div className="space-y-4">
      {playlistData && (
        <div className="pb-5 border-b border-b-slate-200">
          <a
            href={playlistData.playlist_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-r from-teal-100 to-purple-100 border border-purple-200 dark:border-teal-800 rounded-xl p-4 hover:shadow-md transition-shadow pb-5"
          >
            <div className="flex items-center gap-4">
              <img
                src={songs[0]?.album_cover_url}
                alt="Playlist cover"
                className="w-16 h-16 rounded-lg shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Playlist Created
                  </h4>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {playlistData.tracks_added}{" "}
                  {playlistData.tracks_added === 1 ? "track" : "tracks"}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-600 flex-shrink-0" />
            </div>
          </a>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {playbackMessage ||
              `${songs.length} ${songs.length === 1 ? "Track" : "Tracks"}`}
          </h3>
        </div>
        <div className="space-y-2">
          {displaySongs.map((song, index) => (
            <ChatSongRow key={song.track_id} song={song} rank={index + 1} />
          ))}
        </div>
        {hasMore && (
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-3">
            Showing 10 of {songs.length} results
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatSongRowProps {
  song: Song;
  rank: number;
}

const ChatSongRow = ({ song, rank }: ChatSongRowProps) => {
  const formatPlays = (plays: number) => {
    if (plays >= 1000000) {
      return `${(plays / 1000000).toFixed(1)}M`;
    } else if (plays >= 1000) {
      return `${(plays / 1000).toFixed(1)}K`;
    }
    return plays.toString();
  };

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
      {/* Rank */}
      <div className="flex-shrink-0 w-6 text-center">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {rank}
        </span>
      </div>

      {/* Album Cover */}
      <div className="flex-shrink-0 relative">
        {song.album_cover_url ? (
          <img
            src={song.album_cover_url}
            alt={song.album_name}
            className="w-12 h-12 rounded-md object-cover shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
          <Play className="w-5 h-5 text-white" fill="white" />
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {song.track_name}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
          {song.artist_name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
          {song.album_name}
        </p>
      </div>

      {/* Play Count - Only render if total_plays exists */}
      {song.total_plays !== undefined && (
        <div className="flex-shrink-0 text-right px-2">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {formatPlays(song.total_plays)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            plays
          </div>
        </div>
      )}
    </div>
  );
};
