export type ClueStatus = 'suspicious' | 'certain' | 'confused';

export interface ClueCard {
  id: string;
  name: string;
  category: string;
  description: string;
  isTrueClue: boolean;
}

export interface ClueGroup {
  id: string;
  cardIds: string[];
  status: ClueStatus;
  note?: string;
}

export interface PlayerFeedback {
  id: string;
  sessionId: string;
  playerId: string;
  playerName: string;
  groups: ClueGroup[];
  confusions: ConfusionEntry[];
  submittedAt: string;
}

export interface ConfusionEntry {
  id: string;
  cardId: string;
  content: string;
}

export interface TestSession {
  id: string;
  name: string;
  levelName: string;
  levelId: string;
  version: number;
  batch?: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'completed' | 'draft';
  players: PlayerInfo[];
  clueCardIds: string[];
}

export interface LevelInfo {
  id: string;
  name: string;
  lastVersion: number;
  sessionCount: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  code: string;
  hasSubmitted: boolean;
}

export interface ConnectionData {
  from: string;
  to: string;
  count: number;
  strength: number;
  statusCounts: {
    suspicious: number;
    certain: number;
    confused: number;
  };
}

export interface HeatmapData {
  cards: ClueCard[];
  connections: ConnectionData[];
  totalPlayers: number;
}

export interface ConfusionAggregate {
  cardId: string;
  cardName: string;
  entries: { content: string; playerName: string }[];
  count: number;
}
