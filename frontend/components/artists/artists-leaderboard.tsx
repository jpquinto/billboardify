import { LeaderboardSummary, ArtistLeaderboardEntry } from "@/types/leaderboard";
import { Trophy } from "lucide-react";

interface ArtistsLeaderboardProps {
  leaderboard: ArtistLeaderboardEntry[];
}

export const ArtistsLeaderboard = ({ leaderboard }: ArtistsLeaderboardProps) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No artists in the leaderboard yet
      </div>
    );
  }

  // Calculate max total_plays (first entry since they're sorted)
  const maxPlays = leaderboard[0]?.total_plays || 1;

  return (
    <div className="rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-transparent to-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/70 to-pink-500/70 rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Artists Leaderboard
            </h2>
            <p className="text-sm text-gray-600">
              Top artists by total plays in the last 30 days
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {leaderboard.map((entry, index) => {
          // Calculate percentage for gradient width
          const percentage = (entry.total_plays / maxPlays) * 100;

          return (
            <div
              key={`${entry.artist_id}-${index}`}
              className="relative px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-gray-200/50"
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center space-x-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  <span
                    className={`text-lg font-bold ${
                      entry.rank === 1
                        ? "text-yellow-600"
                        : entry.rank === 2
                        ? "text-gray-400"
                        : entry.rank === 3
                        ? "text-amber-600"
                        : "text-gray-600"
                    }`}
                  >
                    #{entry.rank}
                  </span>
                </div>

                {/* Artist Cover */}
                <div className="flex-shrink-0">
                  <img
                    src={entry.artist_image_url}
                    alt={`${entry.artist_name}`}
                    className="w-12 h-12 rounded-md object-cover bg-gray-200"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjRDFENUQ5Ii8+CjxwYXRoIGQ9Ik0yNCAyOEMyNi4yMDkxIDI4IDI4IDI2LjIwOTEgMjggMjRDMjggMjEuNzkwOSAyNi4yMDkxIDIwIDI0IDIwQzIxLjc5MDkgMjAgMjAgMjEuNzkwOSAyMCAyNEMyMCAyNi4yMDkxIDIxLjc5MDkgMjggMjQgMjhaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=";
                    }}
                  />
                </div>

                {/* Song and Artist Info */}
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg text-gray-900 font-bold truncate">
                    <a
                      href={`/albums/${entry.artist_id}`}
                      className="hover:text-purple-500 transition-colors"
                    >
                      {entry.artist_name}
                    </a>
                  </h3>
                </div>

                {/* Score */}
                <div className="flex-shrink-0">
                  <span className="text-lg font-semibold text-gray-900">
                    {entry.total_plays}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">plays</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
