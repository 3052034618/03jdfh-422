import { ConnectionData, HeatmapData, PlayerFeedback, ClueCard, ConfusionAggregate } from '@/types';
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
