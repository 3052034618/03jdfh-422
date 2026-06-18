import { ConnectionData, HeatmapData, PlayerFeedback, ClueCard, ConfusionAggregate, TestSession } from '@/types';
import { getClueCardById } from '@/data/mockClueCards';

export { getClueCardById };

export const calculateHeatmap = (feedbacks: PlayerFeedback[], cardIds: string[]): HeatmapData => {
  const connectionMap = new Map<string, ConnectionData>();
  const cards: ClueCard[] = [];

  cardIds.forEach(id => {
    const card = getClueCardById(id);
    if (card) cards.push(card);
  });

  feedbacks.forEach(feedback => {
    feedback.groups.forEach(group => {
      const ids = group.cardIds.sort();
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = `${ids[i]}-${ids[j]}`;
          if (!connectionMap.has(key)) {
            connectionMap.set(key, {
              from: ids[i],
              to: ids[j],
              count: 0,
              strength: 0,
              statusCounts: { suspicious: 0, certain: 0, confused: 0 }
            });
          }
          const conn = connectionMap.get(key)!;
          conn.count++;
          conn.statusCounts[group.status]++;
        }
      }
    });
  });

  const totalPlayers = feedbacks.length;
  const connections = Array.from(connectionMap.values()).map(conn => ({
    ...conn,
    strength: totalPlayers > 0 ? conn.count / totalPlayers : 0
  }));

  return { cards, connections, totalPlayers };
};

export const aggregateConfusions = (feedbacks: PlayerFeedback[]): ConfusionAggregate[] => {
  const map = new Map<string, ConfusionAggregate>();

  feedbacks.forEach(feedback => {
    feedback.confusions.forEach(entry => {
      const card = getClueCardById(entry.cardId);
      if (!card) return;

      if (!map.has(entry.cardId)) {
        map.set(entry.cardId, {
          cardId: entry.cardId,
          cardName: card.name,
          entries: [],
          count: 0
        });
      }

      const agg = map.get(entry.cardId)!;
      agg.entries.push({ content: entry.content, playerName: feedback.playerName });
      agg.count++;
    });
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
};

export const getStrengthColor = (strength: number): string => {
  if (strength >= 0.7) return '#DC2626';
  if (strength >= 0.4) return '#C026D3';
  if (strength >= 0.2) return '#7C3AED';
  return '#4B5563';
};

export const getStatusText = (status: 'suspicious' | 'certain' | 'confused'): string => {
  const map = { suspicious: '可疑', certain: '确定', confused: '没看懂' };
  return map[status];
};

export interface CardRecognitionStats {
  cardId: string;
  cardName: string;
  isTrueClue: boolean;
  count: number;
  rate: number;
  total: number;
}

export const calculateTrueClueStats = (
  feedbacks: PlayerFeedback[],
  cardIds: string[]
): CardRecognitionStats[] => {
  const total = feedbacks.length;
  if (total === 0) return [];

  const cardConnectCount = new Map<string, number>();
  feedbacks.forEach(fb => {
    fb.groups.forEach(g => {
      g.cardIds.forEach(id => {
        if (cardIds.includes(id)) {
          cardConnectCount.set(id, (cardConnectCount.get(id) || 0) + 1);
        }
      });
    });
  });

  return cardIds
    .map(id => {
      const card = getClueCardById(id);
      const count = cardConnectCount.get(id) || 0;
      return {
        cardId: id,
        cardName: card?.name || id,
        isTrueClue: card?.isTrueClue || false,
        count,
        rate: total > 0 ? count / total : 0,
        total
      };
    })
    .filter(s => s.isTrueClue)
    .sort((a, b) => b.rate - a.rate);
};

export const calculateMisleadingStats = (
  feedbacks: PlayerFeedback[],
  cardIds: string[]
): CardRecognitionStats[] => {
  const total = feedbacks.length;
  if (total === 0) return [];

  const cardConnectCount = new Map<string, number>();
  feedbacks.forEach(fb => {
    fb.groups.forEach(g => {
      g.cardIds.forEach(id => {
        if (cardIds.includes(id)) {
          cardConnectCount.set(id, (cardConnectCount.get(id) || 0) + 1);
        }
      });
    });
  });

  return cardIds
    .map(id => {
      const card = getClueCardById(id);
      const count = cardConnectCount.get(id) || 0;
      return {
        cardId: id,
        cardName: card?.name || id,
        isTrueClue: card?.isTrueClue || false,
        count,
        rate: total > 0 ? count / total : 0,
        total
      };
    })
    .filter(s => !s.isTrueClue && s.rate > 0)
    .sort((a, b) => b.rate - a.rate);
};

export const getTopConfusionCards = (
  feedbacks: PlayerFeedback[],
  limit: number = 5
): { cardId: string; cardName: string; count: number }[] => {
  const agg = aggregateConfusions(feedbacks);
  return agg.slice(0, limit).map(a => ({
    cardId: a.cardId,
    cardName: a.cardName,
    count: a.count
  }));
};

export const getFeedbackByPlayer = (
  feedbacks: PlayerFeedback[],
  sessionId: string,
  playerId: string
): PlayerFeedback | undefined => {
  return feedbacks.find(f => f.sessionId === sessionId && f.playerId === playerId);
};

export interface ComparisonResult {
  metric: string;
  valueA: number | string;
  valueB: number | string;
  change: number;
  direction: 'up' | 'down' | 'same';
}

export const generateComparisonMetrics = (
  sessionA: TestSession,
  feedbacksA: PlayerFeedback[],
  sessionB: TestSession,
  feedbacksB: PlayerFeedback[]
): ComparisonResult[] => {
  const heatmapA = calculateHeatmap(feedbacksA, sessionA.clueCardIds);
  const heatmapB = calculateHeatmap(feedbacksB, sessionB.clueCardIds);
  const trueStatsA = calculateTrueClueStats(feedbacksA, sessionA.clueCardIds);
  const trueStatsB = calculateTrueClueStats(feedbacksB, sessionB.clueCardIds);

  const avgTrueRateA = trueStatsA.length > 0
    ? trueStatsA.reduce((sum, s) => sum + s.rate, 0) / trueStatsA.length
    : 0;
  const avgTrueRateB = trueStatsB.length > 0
    ? trueStatsB.reduce((sum, s) => sum + s.rate, 0) / trueStatsB.length
    : 0;

  const avgStrengthA = heatmapA.connections.length > 0
    ? heatmapA.connections.reduce((sum, c) => sum + c.strength, 0) / heatmapA.connections.length
    : 0;
  const avgStrengthB = heatmapB.connections.length > 0
    ? heatmapB.connections.reduce((sum, c) => sum + c.strength, 0) / heatmapB.connections.length
    : 0;

  const confusionCountA = feedbacksA.reduce((sum, f) => sum + f.confusions.length, 0);
  const confusionCountB = feedbacksB.reduce((sum, f) => sum + f.confusions.length, 0);

  const certainRateA = heatmapA.totalPlayers > 0
    ? heatmapA.connections.reduce((sum, c) => sum + c.statusCounts.certain, 0) /
      (heatmapA.connections.length * heatmapA.totalPlayers)
    : 0;
  const certainRateB = heatmapB.totalPlayers > 0
    ? heatmapB.connections.reduce((sum, c) => sum + c.statusCounts.certain, 0) /
      (heatmapB.connections.length * heatmapB.totalPlayers)
    : 0;

  const calcChange = (a: number, b: number) => {
    const diff = b - a;
    return {
      change: Math.round(diff * 100),
      direction: diff > 0.01 ? 'up' : diff < -0.01 ? 'down' : 'same'
    };
  };

  return [
    {
      metric: '参与玩家数',
      valueA: heatmapA.totalPlayers,
      valueB: heatmapB.totalPlayers,
      ...calcChange(heatmapA.totalPlayers, heatmapB.totalPlayers)
    },
    {
      metric: '真线索平均识别率',
      valueA: `${Math.round(avgTrueRateA * 100)}%`,
      valueB: `${Math.round(avgTrueRateB * 100)}%`,
      ...calcChange(avgTrueRateA, avgTrueRateB)
    },
    {
      metric: '连接平均强度',
      valueA: `${Math.round(avgStrengthA * 100)}%`,
      valueB: `${Math.round(avgStrengthB * 100)}%`,
      ...calcChange(avgStrengthA, avgStrengthB)
    },
    {
      metric: '确定状态占比',
      valueA: `${Math.round(certainRateA * 100)}%`,
      valueB: `${Math.round(certainRateB * 100)}%`,
      ...calcChange(certainRateA, certainRateB)
    },
    {
      metric: '困惑反馈总数',
      valueA: confusionCountA,
      valueB: confusionCountB,
      ...calcChange(confusionCountA, confusionCountB)
    }
  ];
};
