export function createMessage({ chatId, senderId, text }) {
  return {
    id: crypto.randomUUID(),
    chatId,
    senderId,
    text,
    timestamp: Date.now()
  };
}
