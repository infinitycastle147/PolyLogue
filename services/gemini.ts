import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Persona, Message } from '../types';

let genAI: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenAI({ apiKey });
};

export interface DiscussionTurn {
  speakerId: string;
  text: string;
  type: 'TEXT' | 'POLL';
  pollQuestion?: string;
  pollOptions?: string[];
}

export interface DiscussionResponse {
  turns: DiscussionTurn[];
  shouldContinue: boolean;
}

export const generateDiscussionFlow = async (
  conversationHistory: Message[],
  activePersonas: Persona[]
): Promise<DiscussionResponse> => {
  if (!genAI) throw new Error("API Key not initialized");

  const model = "gemini-2.5-flash";

  // Construct the context for the AI
  const personaDescriptions = activePersonas.map(p => 
    `- ID: ${p.id}\n  Name: ${p.name}\n  Expertise: ${p.expertise}\n  Traits: ${p.traits.join(', ')}\n  Style: ${p.communicationStyle}\n  Background: ${p.systemPromptFragment || ''}`
  ).join('\n\n');

  // Increase context window to 50 messages to ensure characters know what happened earlier
  const recentHistory = conversationHistory.slice(-50).map(m => {
    const senderName = m.senderId === 'user' ? 'User' : (m.senderId === 'system' ? 'System' : activePersonas.find(p => p.id === m.senderId)?.name || 'Unknown');
    if (m.type === 'POLL' && m.pollData) {
       const totalVotes = m.pollData.options.reduce((acc, opt) => acc + opt.votes, 0);
       // Include results if there are votes, so AI knows the outcome
       const resultsString = totalVotes > 0 
          ? ` Results: ${m.pollData.options.map(o => `${o.text}: ${o.votes}`).join(', ')}`
          : '';
       return `${senderName} created a poll: "${m.pollData.question}"${resultsString}`;
    }
    if (m.type === 'SYSTEM') {
        return `SYSTEM EVENT: ${m.text}`;
    }
    return `${senderName}: ${m.text}`;
  }).join('\n');

  const systemInstruction = `
    You are a simulator for a multi-persona group chat. 
    You are responsible for generating the messages for the AI characters.
    
    The User is in a chat group with the following characters:
    ${personaDescriptions}

    Recent Chat History:
    ${recentHistory}

    Your Goal:
    Generate the next sequence of messages to advance the conversation naturally. 
    
    CRITICAL INSTRUCTIONS FOR INTERACTION:
    1.  **STRICT BREVITY**: All messages MUST be extremely short (1-2 sentences maximum). No speeches, no long explanations, no paragraphs. Mimic fast-paced instant messaging.
    2.  **React to Each Other**: Characters must NOT just speak to the User. They must reply to, challenge, agree with, or question *each other*. 
    3.  **Contextual Awareness**: If Character A just asked a question or made a point, Character B should address it directly.
    4.  **Poll Awareness**: If a poll was just completed (visible in history with results), characters should REACT to the result (e.g., "Looks like we are continuing", "I'm surprised by that vote").
    5.  **Variable Participation**: Some characters are chattier, others are quiet. Choose speakers based on who would logically have something to say about the last message.
    6.  **Natural Flow**: The conversation should feel like a real group chat. Rapid-fire exchanges.
    7.  **Continuation**: Set 'shouldContinue' to TRUE if the discussion is lively and characters would naturally keep talking immediately (e.g. a debate or ongoing explanation). Set FALSE only if the group is waiting for the User to interject or the topic has settled.

    Response Format (JSON Object):
    {
      "turns": [
        {
          "speakerId": "id_of_speaker",
          "text": "Message content",
          "type": "TEXT" 
        }
      ],
      "shouldContinue": true
    }
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      turns: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speakerId: { type: Type.STRING },
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['TEXT', 'POLL'] },
            pollQuestion: { type: Type.STRING, nullable: true },
            pollOptions: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true }
          },
          required: ['speakerId', 'text', 'type']
        }
      },
      shouldContinue: { type: Type.BOOLEAN }
    },
    required: ['turns', 'shouldContinue']
  };

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: {
        role: 'user',
        parts: [{ text: "Generate the next sequence of responses based on the chat history. Keep it short." }]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.9, 
      }
    });

    const text = response.text;
    if (!text) return { turns: [], shouldContinue: false };
    
    return JSON.parse(text) as DiscussionResponse;
  } catch (error) {
    console.error("Error generating discussion:", error);
    return { turns: [], shouldContinue: false };
  }
};