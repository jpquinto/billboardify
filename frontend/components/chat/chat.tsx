import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { askQuestion } from "@/actions/ask-question";
import { markdownToHtml } from "@/utils/markdown-to-html";
import { AssistantMessage } from "./assistant-message";
// @ts-ignore
import "./scroll.css";

interface Message {
  role: "user" | "assistant";
  content: string;
  userQuery?: string;
  toolData?: {
    tool_query_listening_data?: {
      sql: string;
      response: string;
      data: any[];
    };
  };
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const response = await askQuestion(currentInput);

      if (response.success === false) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${
              response.error || "Unknown error"
            }`,
            userQuery: currentInput, // Track the user query
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.response,
            toolData: response.tool_data,
            userQuery: currentInput, // Track the user query
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          userQuery: currentInput, // Track the user query even on error
        },
      ]);
      console.error("Error calling askQuestion:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 z-[999]">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/chat-logo.png" alt="User Avatar" />
            <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Spotify Assistant
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Whatcha listenin' to?
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6 min-h-[75dvh] max-h-[75dvh] overflow-y-scroll">
        <div className="px-20 mx-auto space-y-6">
          {messages.map((message, index) => (
            <div key={index}>
              {message.role === "user" ? (
                <div className="flex gap-3 flex-row-reverse">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl px-4 py-3 max-w-[80%] bg-gradient-to-tr from-teal-100 to-purple-100 text-slate-900">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: markdownToHtml(message.content),
                      }}
                    />
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  content={message.content}
                  toolData={message.toolData}
                  userQuery={message.userQuery}
                />
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/chat-logo.png" alt="User Avatar" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
                  <Bot className="w-4 h-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-4">
        <div className="px-20 mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 rounded-full border-slate-300 dark:border-slate-600 focus-visible:ring-teal-300/50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-full bg-gradient-to-tr from-teal-500/50 to-purple-600/50 hover:from-teal-500 hover:to-purple-600 text-white px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
