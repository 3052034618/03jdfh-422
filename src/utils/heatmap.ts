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

export interface ReplayReport {
  sessionName: string;
  levelName: string;
  totalPlayers: number;
  submittedPlayers: number;
  trueClueStats: CardRecognitionStats[];
  misleadingStats: CardRecognitionStats[];
  topConnections: ConnectionData[];
  confusionAggregates: ConfusionAggregate[];
  summary: {
    overallAssessment: string;
    trueClueHighlights: string[];
    misleadingAlerts: string[];
    confusionFocus: string[];
    actionItems: string[];
  };
}

export const generateReplayReport = (
  session: TestSession,
  feedbacks: PlayerFeedback[]
): ReplayReport => {
  const trueClueStats = calculateTrueClueStats(feedbacks, session.clueCardIds);
  const misleadingStats = calculateMisleadingStats(feedbacks, session.clueCardIds);
  const heatmap = calculateHeatmap(feedbacks, session.clueCardIds);
  const confusionAggregates = aggregateConfusions(feedbacks);
  const topConnections = [...heatmap.connections]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  const submittedPlayers = feedbacks.length;
  const totalPlayers = session.players.length;
  const avgTrueRate = trueClueStats.length > 0
    ? trueClueStats.reduce((sum, s) => sum + s.rate, 0) / trueClueStats.length
    : 0;

  let overallAssessment = '';
  if (avgTrueRate >= 0.7) {
    overallAssessment = `本关卡真线索识别率较高（${Math.round(avgTrueRate * 100)}%），玩家整体理解方向正确，线索引导设计有效。`;
  } else if (avgTrueRate >= 0.4) {
    overallAssessment = `本关卡真线索识别率中等（${Math.round(avgTrueRate * 100)}%），部分玩家能识别核心线索，但仍有较大改进空间。`;
  } else if (avgTrueRate > 0) {
    overallAssessment = `本关卡真线索识别率偏低（${Math.round(avgTrueRate * 100)}%），多数玩家未能准确识别关键线索，建议重点调整。`;
  } else {
    overallAssessment = `数据不足，无法评估。`;
  }

  const trueClueHighlights: string[] = [];
  trueClueStats.filter(s => s.rate >= 0.6).forEach(s => {
    trueClueHighlights.push(`「${s.cardName}」识别率 ${Math.round(s.rate * 100)}%，玩家理解度高，设计有效。`);
  });
  trueClueStats.filter(s => s.rate < 0.3).forEach(s => {
    trueClueHighlights.push(`「${s.cardName}」识别率仅 ${Math.round(s.rate * 100)}%，多数玩家未注意到此线索，需加强叙事铺垫。`);
  });

  const misleadingAlerts: string[] = [];
  misleadingStats.forEach(s => {
    if (s.rate >= 0.5) {
      misleadingAlerts.push(`⚠️「${s.cardName}」错误关联率高达 ${Math.round(s.rate * 100)}%，误导效果过强，建议削弱线索指向性。`);
    } else if (s.rate >= 0.2) {
      misleadingAlerts.push(`「${s.cardName}」被 ${Math.round(s.rate * 100)}% 玩家错误关联，可考虑微调。`);
    }
  });

  const confusionFocus: string[] = [];
  confusionAggregates.slice(0, 3).forEach(agg => {
    const sampleTexts = agg.entries.slice(0, 2).map(e => e.content).join('；');
    confusionFocus.push(`「${agg.cardName}」收到 ${agg.count} 条困惑（如："${sampleTexts}"）。`);
  });

  const actionItems: string[] = [];
  if (trueClueStats.filter(s => s.rate < 0.3).length > 0) {
    actionItems.push('梳理低识别率真线索的叙事位置，考虑增加前置线索或视觉引导。');
  }
  if (misleadingStats.some(s => s.rate >= 0.5)) {
    actionItems.push('对高关联率的误导线索进行削弱，减少玩家走弯路的挫败感。');
  }
  if (confusionAggregates.length > 0 && confusionAggregates[0].count >= 3) {
    actionItems.push(`优先讨论「${confusionAggregates[0].cardName}」的困惑反馈，考虑是否需要增加引导说明。`);
  }
  const strongConns = heatmap.connections.filter(c => c.strength >= 0.7);
  if (strongConns.length > 0) {
    actionItems.push('强共识连接可作为正确路线的锚点，保持当前设计。');
  }
  if (actionItems.length === 0) {
    actionItems.push('当前数据无突出问题，保持现有线索设计继续观察。');
  }

  return {
    sessionName: session.name,
    levelName: session.levelName,
    totalPlayers,
    submittedPlayers,
    trueClueStats,
    misleadingStats,
    topConnections,
    confusionAggregates,
    summary: {
      overallAssessment,
      trueClueHighlights,
      misleadingAlerts,
      confusionFocus,
      actionItems
    }
  };
};

export interface ConnectionPlayerDetail {
  playerName: string;
  playerId: string;
  status: 'suspicious' | 'certain' | 'confused';
  relatedConfusions: { cardId: string; cardName: string; content: string }[];
}

export const getConnectionPlayerDetails = (
  feedbacks: PlayerFeedback[],
  cardIdA: string,
  cardIdB: string
): ConnectionPlayerDetail[] => {
  const details: ConnectionPlayerDetail[] = [];

  feedbacks.forEach(fb => {
    fb.groups.forEach(g => {
      if (g.cardIds.includes(cardIdA) && g.cardIds.includes(cardIdB)) {
        const relatedConfusions = fb.confusions
          .filter(c => c.cardId === cardIdA || c.cardId === cardIdB)
          .map(c => {
            const card = getClueCardById(c.cardId);
            return {
              cardId: c.cardId,
              cardName: card?.name || c.cardId,
              content: c.content
            };
          });

        details.push({
          playerName: fb.playerName,
          playerId: fb.playerId,
          status: g.status,
          relatedConfusions
        });
      }
    });
  });

  return details;
};

export const groupSessionsByLevel = (
  sessions: TestSession[]
): Map<string, TestSession[]> => {
  const map = new Map<string, TestSession[]>();
  sessions
    .filter(s => s.status !== 'draft')
    .forEach(s => {
      const list = map.get(s.levelId) || [];
      list.push(s);
      map.set(s.levelId, list);
    });
  return map;
};

export interface MisleadingCompareItem {
  cardId: string;
  cardName: string;
  countA: number;
  countB: number;
  rateA: number;
  rateB: number;
  diff: number;
  trend: 'up' | 'down' | 'same';
}

export const compareMisleadingStats = (
  statsA: CardRecognitionStats[],
  statsB: CardRecognitionStats[]
): MisleadingCompareItem[] => {
  const map = new Map<string, MisleadingCompareItem>();
  const allIds = new Set([...statsA.map(s => s.cardId), ...statsB.map(s => s.cardId)]);

  allIds.forEach(id => {
    const a = statsA.find(s => s.cardId === id);
    const b = statsB.find(s => s.cardId === id);
    const card = getClueCardById(id);
    const countA = a?.count || 0;
    const countB = b?.count || 0;
    const rateA = a?.rate || 0;
    const rateB = b?.rate || 0;
    const diff = Math.round((rateB - rateA) * 100);
    const trend = diff > 5 ? 'up' : diff < -5 ? 'down' : 'same';
    map.set(id, {
      cardId: id,
      cardName: card?.name || id,
      countA, countB, rateA, rateB, diff, trend
    });
  });

  return Array.from(map.values()).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};

export interface VersionTrendPoint {
  sessionId: string;
  sessionName: string;
  version: number;
  batch?: string;
  createdAt: string;
  avgTrueRate: number;
  avgMisleadingRate: number;
  avgConnectionStrength: number;
  confusionTotal: number;
  submittedPlayers: number;
}

export interface VersionTrend {
  levelId: string;
  levelName: string;
  sessions: VersionTrendPoint[];
  overallChange: {
    trueRate: number;
    misleadingRate: number;
    confusion: number;
  };
}

export const generateVersionTrend = (
  levelId: string,
  sessions: TestSession[],
  feedbacks: PlayerFeedback[]
): VersionTrend => {
  const levelSessions = sessions
    .filter(s => s.levelId === levelId && s.status !== 'draft')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const points: VersionTrendPoint[] = levelSessions.map(session => {
    const fbs = feedbacks.filter(f => f.sessionId === session.id);
    const trueStats = calculateTrueClueStats(fbs, session.clueCardIds);
    const misleadingStats = calculateMisleadingStats(fbs, session.clueCardIds);
    const heatmap = calculateHeatmap(fbs, session.clueCardIds);
    const confusionTotal = fbs.reduce((sum, f) => sum + f.confusions.length, 0);

    return {
      sessionId: session.id,
      sessionName: session.name,
      version: session.version,
      batch: session.batch,
      createdAt: session.createdAt,
      avgTrueRate: trueStats.length > 0
        ? trueStats.reduce((s, x) => s + x.rate, 0) / trueStats.length
        : 0,
      avgMisleadingRate: misleadingStats.length > 0
        ? misleadingStats.reduce((s, x) => s + x.rate, 0) / misleadingStats.length
        : 0,
      avgConnectionStrength: heatmap.connections.length > 0
        ? heatmap.connections.reduce((s, c) => s + c.strength, 0) / heatmap.connections.length
        : 0,
      confusionTotal,
      submittedPlayers: fbs.length
    };
  });

  const first = points[0];
  const last = points[points.length - 1];

  return {
    levelId,
    levelName: levelSessions[0]?.levelName || levelId,
    sessions: points,
    overallChange: {
      trueRate: first && last ? Math.round((last.avgTrueRate - first.avgTrueRate) * 100) : 0,
      misleadingRate: first && last ? Math.round((last.avgMisleadingRate - first.avgMisleadingRate) * 100) : 0,
      confusion: first && last ? last.confusionTotal - first.confusionTotal : 0
    }
  };
};

export interface MergedConnectionPlayerDetail {
  playerName: string;
  playerId: string;
  statuses: ('suspicious' | 'certain' | 'confused')[];
  relatedConfusions: { cardId: string; cardName: string; content: string }[];
  groupCount: number;
}

export const getMergedConnectionPlayerDetails = (
  feedbacks: PlayerFeedback[],
  cardIdA: string,
  cardIdB: string
): MergedConnectionPlayerDetail[] => {
  const map = new Map<string, MergedConnectionPlayerDetail>();

  feedbacks.forEach(fb => {
    fb.groups.forEach(g => {
      if (g.cardIds.includes(cardIdA) && g.cardIds.includes(cardIdB)) {
        if (!map.has(fb.playerId)) {
          map.set(fb.playerId, {
            playerName: fb.playerName,
            playerId: fb.playerId,
            statuses: [],
            relatedConfusions: [],
            groupCount: 0
          });
        }
        const entry = map.get(fb.playerId)!;
        if (!entry.statuses.includes(g.status)) {
          entry.statuses.push(g.status);
        }
        entry.groupCount++;
      }
    });

    if (map.has(fb.playerId)) {
      const entry = map.get(fb.playerId)!;
      fb.confusions
        .filter(c => c.cardId === cardIdA || c.cardId === cardIdB)
        .forEach(c => {
          const card = getClueCardById(c.cardId);
          const exists = entry.relatedConfusions.find(
            x => x.cardId === c.cardId && x.content === c.content
          );
          if (!exists) {
            entry.relatedConfusions.push({
              cardId: c.cardId,
              cardName: card?.name || c.cardId,
              content: c.content
            });
          }
        });
    }
  });

  return Array.from(map.values());
};
