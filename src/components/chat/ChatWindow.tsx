"use client";

import { useCallback, useEffect, useState } from "react";
import BasicModal from "@/components/modal";
import { WaveLoader } from "@/components/wave-loader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useSession } from "@/lib/auth-client";

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  sender: { name: string };
}

interface ChatWindowProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

function hasMessageListChanged(current: ChatMessage[], next: ChatMessage[]) {
  if (current.length !== next.length) return true;

  for (let index = 0; index < current.length; index += 1) {
    const currentItem = current[index];
    const nextItem = next[index];

    if (
      currentItem.id !== nextItem.id ||
      currentItem.senderId !== nextItem.senderId ||
      currentItem.content !== nextItem.content ||
      currentItem.readAt !== nextItem.readAt ||
      currentItem.createdAt !== nextItem.createdAt
    ) {
      return true;
    }
  }

  return false;
}

export default function ChatWindow({
  bookingId,
  isOpen,
  onClose,
  title = "Booking Chat",
}: ChatWindowProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const markUnreadAsRead = useCallback(async (items: ChatMessage[]) => {
    if (!currentUserId) return;

    const unreadIds = items
      .filter((item) => !item.readAt && item.senderId !== currentUserId)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    await Promise.all(
      unreadIds.map((id) =>
        fetch(`/api/messages/${id}/read`, {
          method: "PATCH",
        })
      )
    );
  }, [currentUserId]);

  const fetchMessages = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!bookingId) return;

    if (!silent) setInitialLoading(true);

    try {
      const res = await fetch(`/api/messages?bookingId=${bookingId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load messages");
        return;
      }
      const nextMessages: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
      setMessages((currentMessages) => {
        if (!hasMessageListChanged(currentMessages, nextMessages)) {
          return currentMessages;
        }

        return nextMessages;
      });
      setError("");
      await markUnreadAsRead(nextMessages);
    } catch {
      setError("Failed to load messages");
    } finally {
      if (!silent) setInitialLoading(false);
    }
  }, [bookingId, markUnreadAsRead]);

  const sendMessage = async () => {
    const content = message.trim();
    if (!content) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }
      setMessage("");
      await fetchMessages({ silent: true });
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    void fetchMessages();

    const streamUrl = `/api/messages/stream?bookingId=${encodeURIComponent(bookingId)}`;
    const eventSource = new EventSource(streamUrl);

    const refreshMessages = () => {
      void fetchMessages({ silent: true });
    };

    eventSource.addEventListener("message-created", refreshMessages);
    eventSource.addEventListener("message-read", refreshMessages);
    const fallbackRefreshId = window.setInterval(refreshMessages, 2000);

    return () => {
      window.clearInterval(fallbackRefreshId);
      eventSource.removeEventListener("message-created", refreshMessages);
      eventSource.removeEventListener("message-read", refreshMessages);
      eventSource.close();
    };
  }, [isOpen, bookingId, fetchMessages]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
  }, [isOpen]);

  return (
    <BasicModal isOpen={isOpen} onClose={onClose} title={title} size="full">
      <div className="flex h-[70vh] flex-col">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-border bg-(--bg-muted) p-3">
          {initialLoading ? (
            <div className="flex h-full items-center justify-center">
              <WaveLoader bars={5} className="bg-primary" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-(--text-2)">No messages yet.</p>
          ) : (
            messages.map((item) => {
              const mine = item.senderId === currentUserId;
              return (
                <div
                  key={item.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      mine
                        ? "bg-primary text-white"
                        : "border border-black/10 bg-black/10 text-foreground"
                    }`}
                  >
                    <p className="text-xs opacity-70">{item.sender.name}</p>
                    <p className="text-sm">{item.content}</p>
                    <p className="mt-1 text-[11px] opacity-75">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {mine && item.readAt ? " • Read" : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <Input
              id="chat-message"
              label=""
              value={message}
              placeholder="Type a message"
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
            />
          </div>
          <Button onClick={sendMessage} isLoading={sending} className="mt-0 h-fit px-4 py-2.5">
            Send
          </Button>
        </div>
      </div>
    </BasicModal>
  );
}
