import { Music, Play, Disc3 } from "lucide-react";

// Helper function to check if data matches album structure
export const isAlbumData = (data: any[]): boolean => {
  if (!data || data.length === 0) return false;

  const firstItem = data[0];
  const requiredFields = [
    "album_id",
    "album_name",
    "artist_name",
    "total_plays",
    "album_cover_url",
  ];

  return requiredFields.every((field) => field in firstItem);
};

interface Album {
  album_id: string;
  album_name: string;
  artist_name: string;
  total_plays: number;
  album_cover_url: string;
}

interface ChatAlbumListProps {
  albums: Album[];
}

export const ChatAlbumList = ({ albums }: ChatAlbumListProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Disc3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {albums.length} {albums.length === 1 ? "Album" : "Albums"}
        </h3>
      </div>
      <div className="space-y-2">
        {albums.map((album, index) => (
          <ChatAlbumRow key={album.album_id} album={album} rank={index + 1} />
        ))}
      </div>
    </div>
  );
};

interface ChatAlbumRowProps {
  album: Album;
  rank: number;
}

const ChatAlbumRow = ({ album, rank }: ChatAlbumRowProps) => {
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
        {album.album_cover_url ? (
          <img
            src={album.album_cover_url}
            alt={album.album_name}
            className="w-12 h-12 rounded-md object-cover shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
            <Disc3 className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
          <Play className="w-5 h-5 text-white" fill="white" />
        </div>
      </div>

      {/* Album Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {album.album_name}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
          {album.artist_name}
        </p>
      </div>

      {/* Play Count */}
      <div className="flex-shrink-0 text-right px-2">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {formatPlays(album.total_plays)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">plays</div>
      </div>
    </div>
  );
};
