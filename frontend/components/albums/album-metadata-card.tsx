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
import { AlbumMetadata } from "@/types/album-metadata";

interface AlbumMetadataCardProps {
  albumMetadata: AlbumMetadata;
  primaryColor?: string;
  secondaryColor?: string;
}

export const AlbumMetadataCard = ({
  albumMetadata,
  primaryColor,
  secondaryColor,
}: AlbumMetadataCardProps) => {
  const getPositionChange = () => {
    if (
      albumMetadata.last_week_position === null ||
      albumMetadata.position === null
    ) {
      return null;
    }
    const change = albumMetadata.last_week_position - albumMetadata.position;
    if (change > 0) return { value: change, trend: "up" };
    if (change < 0) return { value: Math.abs(change), trend: "down" };
    return { value: 0, trend: "same" };
  };

  const positionChange = getPositionChange();
  const usePrimaryColor =
    primaryColor || albumMetadata.cover_primary_color || "#8B5CF6";
  const useSecondaryColor =
    secondaryColor || albumMetadata.cover_secondary_color || "#EC4899";

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
              {albumMetadata.album_name}
            </span>
          </div>
          <Badge variant="secondary">{albumMetadata.genre}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Position</p>
            <div className="flex items-center gap-2">
              <p
                className="text-2xl font-bold"
                style={{ color: usePrimaryColor }}
              >
                {albumMetadata.position !== null
                  ? `#${albumMetadata.position}`
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
              {albumMetadata.last_week_position !== null
                ? `#${albumMetadata.last_week_position}`
                : "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Peak Position</p>
            <p
              className="text-2xl font-bold"
              style={{ color: useSecondaryColor }}
            >
              {albumMetadata.peak_position !== null
                ? `#${albumMetadata.peak_position}`
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <PlayCircle className="w-3 h-3" />
              Recent Play Count
            </p>
            <p className="text-lg font-semibold">
              {formatNumber(albumMetadata.play_count)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Weeks on Chart</p>
            <p className="text-lg font-semibold">
              {formatNumber(albumMetadata.weeks_on_chart)}
            </p>
          </div>
        </div>

        {albumMetadata.last_charted_at && (
          <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Last charted: {formatDate(albumMetadata.last_charted_at)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
