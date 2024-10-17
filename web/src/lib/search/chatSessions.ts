export async function createChatSession(
  assistantId?: number | null,
  teamspaceId?: number | null
) {
  const url = teamspaceId
    ? `/api/chat/create-chat-session?teamspace_id=${teamspaceId}`
    : "/api/chat/create-chat-session";

  const chatSessionResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistant_id: assistantId,
    }),
  });

  return chatSessionResponse;
}
