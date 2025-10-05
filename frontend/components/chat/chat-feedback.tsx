"use client";

import { addTrainingData } from "@/actions/add-training-data";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ChatFeedbackProps {
  question: string;
  sql: string;
}

export const ChatFeedback = ({ question, sql }: ChatFeedbackProps) => {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleThumbsUp = async () => {
    if (feedback === "up" || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addTrainingData({ question, sql });
      setFeedback("up");
      toast.success("Thanks for your feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsDown = () => {
    if (feedback === "down") return;
    setFeedback("down");
    toast.info("Thanks for your feedback!");
  };

  return (
    <div className="flex items-center justify-end gap-2 mt-2">
      {feedback && (
        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
          Feedback recorded
        </span>
      )}
      <button
        onClick={handleThumbsUp}
        disabled={isSubmitting || feedback !== null}
        className={`p-1.5 rounded-md transition-colors ${
          feedback === "up"
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Good response"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={handleThumbsDown}
        disabled={feedback !== null}
        className={`p-1.5 rounded-md transition-colors ${
          feedback === "down"
            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Bad response"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
};
