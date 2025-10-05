import { Music, Play } from "lucide-react";

// Helper function to check if data matches song structure
export const isSongData = (data: any[]): boolean => {
  if (!data || data.length === 0) return false;

  const firstItem = data[0];
  const requiredFields = [
    "track_id",
    "track_name",
    "artist_name",
    "album_name",
    "total_plays",
    "album_cover_url",
  ];

  return requiredFields.every((field) => field in firstItem);
};

interface Song {
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  total_plays: number;
  album_cover_url: string;
}

interface ChatSongListProps {
  songs: Song[];
}

export const ChatSongList = ({ songs }: ChatSongListProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {songs.length} {songs.length === 1 ? "Track" : "Tracks"}
        </h3>
      </div>
      <div className="space-y-2">
        {songs.map((song, index) => (
          <ChatSongRow key={song.track_id} song={song} rank={index + 1} />
        ))}
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

      {/* Play Count */}
      <div className="flex-shrink-0 text-right px-2">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {formatPlays(song.total_plays)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">plays</div>
      </div>
    </div>
  );
};
