import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ApprovedMessage } from "../lib/types";

type RealtimeSummary = {
  classifiedCount: number;
  approvedCount: number;
  lastSyncedAt: string;
};

const socket = io("http://localhost:3000", {
  autoConnect: false
});

function mergeMessages(messages: ApprovedMessage[]) {
  const uniqueMessages = new Map<string, ApprovedMessage>();

  for (const message of messages) {
    uniqueMessages.set(message.id, message);
  }

  return Array.from(uniqueMessages.values())
    .sort((left, right) => {
      return new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime();
    });
}

export function useTicker(initialMessages: ApprovedMessage[]) {
  const [messages, setMessagesState] = useState<ApprovedMessage[]>(mergeMessages(initialMessages));
  const [isConnected, setIsConnected] = useState(false);
  const [lastSummary, setLastSummary] = useState<RealtimeSummary | null>(null);

  function setMessages(
    value: ApprovedMessage[] | ((current: ApprovedMessage[]) => ApprovedMessage[])
  ) {
    setMessagesState((current) => {
      const nextValue = value instanceof Function ? value(current) : value;
      return mergeMessages(nextValue);
    });
  }

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.connect();

    socket.on("ticker.email-classified", (message: ApprovedMessage) => {
      setMessages((current) => [message, ...current]);
    });
    socket.on("ticker.summary", (summary: RealtimeSummary) => {
      setLastSummary(summary);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("ticker.email-classified");
      socket.off("ticker.summary");
      socket.disconnect();
    };
  }, []);

  return { messages, setMessages, isConnected, lastSummary };
}
