
export type PersonaCategory = 'FAMOUS' | 'EXPERT' | 'ANIME' | 'CUSTOM';

export interface Persona {
  id: string;
  name: string;
  category: PersonaCategory;
  expertise: string;
  traits: string[];
  communicationStyle: string;
  avatarUrl: string;
  color: string;
  systemPromptFragment?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdBy: string;
  hasUserVoted?: boolean; // Track if the local user has participated
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
  type: 'TEXT' | 'POLL' | 'SYSTEM';
  pollData?: Poll;
}

export interface Conversation {
  id: string;
  name: string;
  createdAt: number;
  lastMessageAt: number;
  personaIds: string[];
  messages: Message[];
}

export interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  personas: Persona[];
  view: ViewState;
}

export enum ViewState {
  HOME = 'HOME',
  CREATE_GROUP = 'CREATE_GROUP',
  CREATE_PERSONA = 'CREATE_PERSONA',
  CHAT = 'CHAT'
}
