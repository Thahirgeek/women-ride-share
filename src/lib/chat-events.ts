import { EventEmitter } from "events";
import { Pool, type PoolClient } from "pg";

const CHAT_EVENT_CHANNEL = "chat_events";
const CHAT_EVENT_NAME = "chat-event";

export type ChatEventType = "message-created" | "message-read";

export interface ChatEventPayload {
  type: ChatEventType;
  bookingId: string;
  messageId: string;
  emittedAt: string;
}

type ChatEventListener = (event: ChatEventPayload) => void;

const globalForChatEvents = globalThis as unknown as {
  chatEventEmitter?: EventEmitter;
  chatEventPool?: Pool;
  chatEventListenerClient?: PoolClient;
  chatEventInitPromise?: Promise<void>;
};

const chatEventEmitter = globalForChatEvents.chatEventEmitter ?? new EventEmitter();
chatEventEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  globalForChatEvents.chatEventEmitter = chatEventEmitter;
}

function getChatEventPool() {
  if (globalForChatEvents.chatEventPool) return globalForChatEvents.chatEventPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for realtime chat events.");
  }

  const pool = new Pool({ connectionString });

  if (process.env.NODE_ENV !== "production") {
    globalForChatEvents.chatEventPool = pool;
  }

  return pool;
}

function parseChatEvent(rawPayload: string | null): ChatEventPayload | null {
  if (!rawPayload) return null;

  try {
    const parsed = JSON.parse(rawPayload) as Partial<ChatEventPayload>;
    const type = parsed.type;

    if ((type !== "message-created" && type !== "message-read") || !parsed.bookingId || !parsed.messageId) {
      return null;
    }

    return {
      type,
      bookingId: parsed.bookingId,
      messageId: parsed.messageId,
      emittedAt: parsed.emittedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function createChatEventListener() {
  const pool = getChatEventPool();
  const client = await pool.connect();

  client.on("notification", (notification) => {
    if (notification.channel !== CHAT_EVENT_CHANNEL) return;

    const event = parseChatEvent(notification.payload);
    if (!event) return;

    chatEventEmitter.emit(CHAT_EVENT_NAME, event);
  });

  client.on("error", (error) => {
    console.error("Chat event listener error", error);

    try {
      client.release(true);
    } catch {
      // ignore cleanup failures
    }

    if (globalForChatEvents.chatEventListenerClient === client) {
      globalForChatEvents.chatEventListenerClient = undefined;
      void ensureChatEventListener();
    }
  });

  await client.query(`LISTEN ${CHAT_EVENT_CHANNEL}`);
  globalForChatEvents.chatEventListenerClient = client;
}

export async function ensureChatEventListener() {
  if (globalForChatEvents.chatEventListenerClient) return;
  if (globalForChatEvents.chatEventInitPromise) return globalForChatEvents.chatEventInitPromise;

  globalForChatEvents.chatEventInitPromise = createChatEventListener().finally(() => {
    globalForChatEvents.chatEventInitPromise = undefined;
  });

  return globalForChatEvents.chatEventInitPromise;
}

export async function publishChatEvent(event: Omit<ChatEventPayload, "emittedAt">) {
  const payload = JSON.stringify({ ...event, emittedAt: new Date().toISOString() });
  const pool = getChatEventPool();

  await pool.query("SELECT pg_notify($1, $2)", [CHAT_EVENT_CHANNEL, payload]);
}

export function subscribeToChatEvents(listener: ChatEventListener) {
  chatEventEmitter.on(CHAT_EVENT_NAME, listener);

  return () => {
    chatEventEmitter.off(CHAT_EVENT_NAME, listener);
  };
}