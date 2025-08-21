// src/components/StreamerCard.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeOff } from "lucide-react";

// Utility til relative tid (visning af "x min ago")
function formatRelativeTime(startTime?: string) {
  if (!startTime) return "";
  const diff = Date.now() - new Date(startTime).getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

interface StreamerCardProps {
  streamer: {
    twitch_username: string;
    display_name?: string | null;
    // ... (eventuelt flere felter)
  };
  streamData: {
    is_live?: boolean;
    viewer_count?: number;
    game_name?: string;
    title?: string;
    started_at?: string;
    thumbnail_url?: string;
  };
}

const StreamerCard = ({ streamer, streamData }: StreamerCardProps) => {
  // Build Twitch thumbnail_url
  const rawThumb = streamData?.thumbnail_url || "";
  const thumbnailUrl = rawThumb
    ? rawThumb.replace("{width}", "320").replace("{height}", "180") +
      `?v=${Date.now()}`
    : "";

  return (
    <Card className="p-4 bg-gaming-card flex flex-col items-center space-y-3 shadow-lg">
      {streamData?.is_live ? (
        <>
          <Badge variant="outline" className="bg-primary text-white px-4">
            LIVE
          </Badge>
          {/* Live Twitch thumbnail */}
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`${streamer.twitch_username} Live Preview`}
              className="rounded-md shadow-md w-full max-w-[320px] h-auto mb-2"
              style={{ aspectRatio: "16/9" }}
            />
          ) : (
            <div className="w-full h-[180px] bg-gaming-dark flex items-center justify-center text-muted-foreground">
              No Thumbnail
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">
              {streamer.display_name || streamer.twitch_username}
            </span>
            <Badge>{streamData.viewer_count ?? 0} viewers</Badge>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            {streamData.title}
          </div>
          <div className="text-xs text-foreground/70 text-center">
            {streamData.game_name}
            {streamData.started_at &&
              ` • Started ${formatRelativeTime(streamData.started_at)}`}
          </div>
          <Button
            size="sm"
            className="mt-3 bg-twitch-purple"
            asChild
          >
            <a
              href={`https://twitch.tv/${streamer.twitch_username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on Twitch
            </a>
          </Button>
        </>
      ) : (
        <>
          <Badge variant="outline" className="bg-muted text-muted-foreground px-4">
            Offline
          </Badge>
          <div className="w-full h-[180px] bg-gaming-dark flex items-center justify-center text-muted-foreground">
            <EyeOff className="h-10 w-10" />
          </div>
          <span className="font-semibold">
            {streamer.display_name || streamer.twitch_username}
          </span>
          <span className="text-xs text-muted-foreground">Offline</span>
        </>
      )}
    </Card>
  );
};

export default StreamerCard;
