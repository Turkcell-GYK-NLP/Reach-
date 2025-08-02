import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ChatMessage, ChatRequest } from "@/lib/types";

export function useChat(userId: string = "default") {
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // Get chat history
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat", userId],
    queryFn: () => api.getChatHistory(userId),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: ChatRequest) => api.sendMessage(data),
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      // Invalidate chat history to refresh messages
      queryClient.invalidateQueries({ queryKey: ["/api/chat", userId] });
      setIsTyping(false);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      setIsTyping(false);
    },
  });

  const sendMessage = (message: string, userContext?: any) => {
    return sendMessageMutation.mutate({
      userId,
      message,
      userContext,
    });
  };

  // Helper function to format messages for display
  const formatMessages = (): Array<{
    id: string;
    type: "user" | "bot";
    content: string;
    timestamp: Date;
    suggestions?: string[];
    actionItems?: any[];
  }> => {
    if (!messages) return [];

    return messages.map((msg: ChatMessage) => ({
      id: msg.id,
      type: msg.metadata?.type || "user",
      content: msg.message,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      suggestions: msg.metadata?.suggestions,
      actionItems: msg.metadata?.actionItems,
    }));
  };

  return {
    messages: formatMessages(),
    isLoading,
    isTyping,
    sendMessage,
    isPending: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}
