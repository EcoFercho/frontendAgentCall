import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ApprovedMessage } from "../lib/types";

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

    socket.on("ticker.email-approved", (message: ApprovedMessage) => {
      setMessages((current) => [message, ...current]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("ticker.email-approved");
      socket.disconnect();
    };
  }, []);

  return { messages, setMessages, isConnected };
}
