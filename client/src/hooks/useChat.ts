import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ChatMessage, ChatRequest } from "@/lib/types";

export function useChat(userId: string = "default") {
  // Prefer logged-in userId if exists in localStorage
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.user?.id) {
      userId = auth.user.id;
    }
  } catch {}
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

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: () => api.clearChat(userId),
    onSuccess: () => {
      // Invalidate chat history to refresh messages
      queryClient.invalidateQueries({ queryKey: ["/api/chat", userId] });
    },
    onError: (error) => {
      console.error("Failed to clear chat:", error);
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
      content: msg.content || msg.message || "",
      timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      suggestions: msg.metadata?.suggestions,
      actionItems: msg.metadata?.actionItems,
    }));
  };

  const clearChat = () => {
    return clearChatMutation.mutate();
  };

  return {
    messages: formatMessages(),
    isLoading,
    isTyping,
    sendMessage,
    clearChat,
    isPending: sendMessageMutation.isPending,
    isClearing: clearChatMutation.isPending,
    error: sendMessageMutation.error,
    clearError: clearChatMutation.error,
  };
}
