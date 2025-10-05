import { Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markdownToHtml } from "@/utils/markdown-to-html";
import { ChatSongList, isSongData } from "./chat-song-list";
import { ChatArtistList, isArtistData } from "./chat-artist-list";
import { ChatAlbumList, isAlbumData } from "./chat-album-list";
import { ChatBarChart, isBarChartData } from "./chat-bar-chart";
import { ChatFeedback } from "./chat-feedback";

interface AssistantMessageProps {
  content: string;
  toolData?: {
    tool_query_listening_data?: {
      sql: string;
      response: string;
      data: any[];
    };
  };
  userQuery?: string;
}

export const AssistantMessage = ({
  content,
  toolData,
  userQuery,
}: AssistantMessageProps) => {
  const hasToolData = toolData?.tool_query_listening_data;
  const toolDataExists =
    hasToolData && hasToolData.data && hasToolData.data.length > 0;
  const isSongList = toolDataExists && isSongData(hasToolData.data);
  const isArtistList = toolDataExists && isArtistData(hasToolData.data);
  const isAlbumList = toolDataExists && isAlbumData(hasToolData.data);
  const isBarChart = toolDataExists && isBarChartData(hasToolData.data);

  // Check if a special component is being rendered
  const hasSpecialComponent =
    isSongList || isArtistList || isAlbumList || isBarChart;

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8">
        <AvatarImage src="/chat-logo.png" alt="User Avatar" />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
          <Bot className="w-4 h-4 text-white" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-3 w-full">
        {hasToolData && (
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            {toolDataExists && (
              <div>
                {isSongList ? (
                  <ChatSongList songs={hasToolData.data} />
                ) : isArtistList ? (
                  <ChatArtistList artists={hasToolData.data} />
                ) : isAlbumList ? (
                  <ChatAlbumList albums={hasToolData.data} />
                ) : isBarChart ? (
                  <ChatBarChart data={hasToolData.data} />
                ) : (
                  <>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Results ({hasToolData.data.length} rows)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            {Object.keys(hasToolData.data[0]).map((key) => (
                              <th
                                key={key}
                                className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {hasToolData.data.slice(0, 10).map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-slate-100 dark:border-slate-800"
                            >
                              {Object.values(row).map((value, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="py-2 px-3 text-slate-600 dark:text-slate-400"
                                >
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {hasToolData.data.length > 10 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Showing 10 of {hasToolData.data.length} results
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Only render content if no special component is shown */}
        {!hasSpecialComponent && (
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
            <div
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        )}

        {/* Feedback moved outside content container */}
        {hasToolData && userQuery && (
          <ChatFeedback question={userQuery} sql={hasToolData.sql} />
        )}
      </div>
    </div>
  );
};
