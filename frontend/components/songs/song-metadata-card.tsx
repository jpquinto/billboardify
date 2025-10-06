import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  PlayCircle,
} from "lucide-react";

interface SongMetadata {
  track_id: string;
  artist_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_id: string;
  album_cover_url: string;
  genre: string;
  position: number | null;
  peak_position: number | null;
  weeks_on_chart: number | null;
  play_count: number | null;
  last_week_position: number | null;
  last_charted_at: string | null;
  album_cover_banner: string | null;
  cover_primary_color: string | null;
  cover_secondary_color: string | null;
}

interface SongMetadataCardProps {
  songMetadata: SongMetadata;
  primaryColor?: string;
  secondaryColor?: string;
}

export const SongMetadataCard = ({
  songMetadata,
  primaryColor,
  secondaryColor,
}: SongMetadataCardProps) => {
  const getPositionChange = () => {
    if (
      songMetadata.last_week_position === null ||
      songMetadata.position === null
    ) {
      return null;
    }
    const change = songMetadata.last_week_position - songMetadata.position;
    if (change > 0) return { value: change, trend: "up" };
    if (change < 0) return { value: Math.abs(change), trend: "down" };
    return { value: 0, trend: "same" };
  };

  const positionChange = getPositionChange();
  const usePrimaryColor =
    primaryColor || songMetadata.cover_primary_color || "#8B5CF6";
  const useSecondaryColor =
    secondaryColor || songMetadata.cover_secondary_color || "#EC4899";

  const formatNumber = (num: number | null) => {
    if (num === null) return "N/A";
    return num.toLocaleString();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Album:</span>
            <span className="text-sm font-medium">
              {songMetadata.album_name}
            </span>
          </div>
          <Badge variant="secondary">{songMetadata.genre}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Position</p>
            <div className="flex items-center gap-2">
              <p
                className="text-2xl font-bold"
                style={{ color: usePrimaryColor }}
              >
                {songMetadata.position !== null
                  ? `#${songMetadata.position}`
                  : "N/A"}
              </p>
              {positionChange && positionChange.trend === "up" && (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {positionChange.value}
                  </span>
                </div>
              )}
              {positionChange && positionChange.trend === "down" && (
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {positionChange.value}
                  </span>
                </div>
              )}
              {positionChange && positionChange.trend === "same" && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Minus className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Week</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {songMetadata.last_week_position !== null
                ? `#${songMetadata.last_week_position}`
                : "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Peak Position</p>
            <p
              className="text-2xl font-bold"
              style={{ color: useSecondaryColor }}
            >
              {songMetadata.peak_position !== null
                ? `#${songMetadata.peak_position}`
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <PlayCircle className="w-3 h-3" />
              Play Count
            </p>
            <p className="text-lg font-semibold">
              {formatNumber(songMetadata.play_count)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Weeks on Chart</p>
            <p className="text-lg font-semibold">
              {formatNumber(songMetadata.weeks_on_chart)}
            </p>
          </div>
        </div>

        {songMetadata.last_charted_at && (
          <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Last charted: {formatDate(songMetadata.last_charted_at)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
