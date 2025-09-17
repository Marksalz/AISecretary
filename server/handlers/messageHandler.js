// import { askGemini } from "../ai/gemini.js";
// import {
//   normalize,
//   isEventRequest,
//   isEventQuery,
// } from "../utils/messageUtils.js";
// import {
//   handleEventRequest,
//   handleEventQuery,
// } from "../services/eventHandler.js";

// export async function handleMessage(
//   message,
//   conversationHistory = [],
//   user = {}
// ) {
//   const normalizedMsg = normalize(message);
//   const isFollowUp = conversationHistory.some((msg) => msg.requiresMoreInfo);

//   if (isEventRequest(normalizedMsg) || isFollowUp) {
//     return handleEventRequest(message, user);
//   }

//   if (isEventQuery(normalizedMsg)) {
//     return handleEventQuery();
//   }

//   // fallback chat
//   const prompt = `You are a friendly AI assistant for a chat application that also manages a user's calendar.
// - Always answer naturally and informally, as if chatting with a friend.
// - Keep responses short, clear, and engaging.

// User: "${message}"
// AI:`;

//   const answer = await askGemini(prompt);

//   return {
//     success: true,
//     data: {
//       type: "chat_response",
//       message: answer,
//     },
//   };
// }
