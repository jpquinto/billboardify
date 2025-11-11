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
import { ArtistMetadata } from "@/types/artist-metadata";

interface ArtistMetadataCardProps {
  artistMetadata: ArtistMetadata;
  primaryColor?: string;
  secondaryColor?: string;
}

export const ArtistMetadataCard = ({
  artistMetadata,
  primaryColor,
  secondaryColor,
}: ArtistMetadataCardProps) => {
  const getPositionChange = () => {
    if (
      artistMetadata.last_week_position === null ||
      artistMetadata.position === null
    ) {
      return null;
    }
    const change = artistMetadata.last_week_position - artistMetadata.position;
    if (change > 0) return { value: change, trend: "up" };
    if (change < 0) return { value: Math.abs(change), trend: "down" };
    return { value: 0, trend: "same" };
  };

  const positionChange = getPositionChange();
  const usePrimaryColor =
    primaryColor || artistMetadata.cover_primary_color || "#8B5CF6";
  const useSecondaryColor =
    secondaryColor || artistMetadata.cover_secondary_color || "#EC4899";

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
          </div>
          <Badge variant="secondary">{artistMetadata.genre}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Position</p>
            <div className="flex items-center gap-2">
              <p
                className="text-2xl font-bold"
                style={{ color: usePrimaryColor }}
              >
                {artistMetadata.position !== null
                  ? `#${artistMetadata.position}`
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
              {artistMetadata.last_week_position !== null
                ? `#${artistMetadata.last_week_position}`
                : "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Peak Position</p>
            <p
              className="text-2xl font-bold"
              style={{ color: useSecondaryColor }}
            >
              {artistMetadata.peak_position !== null
                ? `#${artistMetadata.peak_position}`
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
              {formatNumber(artistMetadata.play_count)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Weeks on Chart</p>
            <p className="text-lg font-semibold">
              {formatNumber(artistMetadata.weeks_on_chart)}
            </p>
          </div>
        </div>

        {artistMetadata.last_charted_at && (
          <div className="flex items-center gap-2 pt-4 border-t text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Last charted: {formatDate(artistMetadata.last_charted_at)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
