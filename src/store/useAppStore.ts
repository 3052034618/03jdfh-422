import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { TestSession, PlayerInfo, PlayerFeedback } from '@/types';
import { mockSessions } from '@/data/mockSessions';
import { mockFeedbacks } from '@/data/mockFeedback';

const STORAGE_KEY_SESSIONS = 'horror_test_sessions';
const STORAGE_KEY_FEEDBACKS = 'horror_test_feedbacks';

interface AppState {
  sessions: TestSession[];
  feedbacks: PlayerFeedback[];
  initStore: () => void;
  createSession: (session: Omit<TestSession, 'id' | 'createdAt' | 'createdBy' | 'status'>) => TestSession;
  addPlayerToSession: (sessionId: string, player: Omit<PlayerInfo, 'id' | 'hasSubmitted'>) => void;
  markPlayerSubmitted: (sessionId: string, playerId: string) => void;
  addFeedback: (feedback: Omit<PlayerFeedback, 'id' | 'submittedAt'>) => void;
  getSessionById: (id: string) => TestSession | undefined;
  getFeedbacksBySessionId: (sessionId: string) => PlayerFeedback[];
}

const persistSessions = (sessions: TestSession[]) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('[Store] persistSessions failed:', e);
  }
};

const persistFeedbacks = (feedbacks: PlayerFeedback[]) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_FEEDBACKS, JSON.stringify(feedbacks));
  } catch (e) {
    console.error('[Store] persistFeedbacks failed:', e);
  }
};

const loadSessions = (): TestSession[] => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY_SESSIONS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[Store] loadSessions failed:', e);
  }
  return [];
};

const loadFeedbacks = (): PlayerFeedback[] => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY_FEEDBACKS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[Store] loadFeedbacks failed:', e);
  }
  return [];
};

const useAppStore = create<AppState>((set, get) => ({
  sessions: [],
  feedbacks: [],

  initStore: () => {
    const savedSessions = loadSessions();
    const savedFeedbacks = loadFeedbacks();

    if (savedSessions.length > 0) {
      set({ sessions: savedSessions, feedbacks: savedFeedbacks });
    } else {
      set({ sessions: [...mockSessions], feedbacks: [...mockFeedbacks] });
      persistSessions(mockSessions);
      persistFeedbacks(mockFeedbacks);
    }
  },

  createSession: (data) => {
    const newSession: TestSession = {
      ...data,
      id: `session-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: '当前测试员',
      status: 'active'
    };
    const sessions = [...get().sessions, newSession];
    set({ sessions });
    persistSessions(sessions);
    return newSession;
  },

  addPlayerToSession: (sessionId, player) => {
    const sessions = get().sessions.map(s => {
      if (s.id === sessionId) {
        const newPlayer: PlayerInfo = {
          ...player,
          id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          hasSubmitted: false
        };
        return { ...s, players: [...s.players, newPlayer] };
      }
      return s;
    });
    set({ sessions });
    persistSessions(sessions);
  },

  markPlayerSubmitted: (sessionId, playerId) => {
    const sessions = get().sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          players: s.players.map(p =>
            p.id === playerId ? { ...p, hasSubmitted: true } : p
          )
        };
      }
      return s;
    });
    set({ sessions });
    persistSessions(sessions);
  },

  addFeedback: (data) => {
    const newFeedback: PlayerFeedback = {
      ...data,
      id: `fb-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };
    const feedbacks = [...get().feedbacks, newFeedback];
    set({ feedbacks });
    persistFeedbacks(feedbacks);
    get().markPlayerSubmitted(data.sessionId, data.playerId);
    return newFeedback;
  },

  getSessionById: (id) => get().sessions.find(s => s.id === id),

  getFeedbacksBySessionId: (sessionId) => get().feedbacks.filter(f => f.sessionId === sessionId)
}));

export default useAppStore;
