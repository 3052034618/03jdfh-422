import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import ConnectionHeatmap from '@/components/ConnectionHeatmap';
import ConfusionItem from '@/components/ConfusionItem';
import { mockSessions } from '@/data/mockSessions';
import { mockFeedbacks } from '@/data/mockFeedback';
import { calculateHeatmap, aggregateConfusions } from '@/utils/heatmap';

type TabType = 'heatmap' | 'confusion' | 'insights';

const StatisticsPage: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState('session-001');
  const [activeTab, setActiveTab] = useState<TabType>('heatmap');

  const session = useMemo(
    () => mockSessions.find(s => s.id === selectedSessionId),
    [selectedSessionId]
  );

  const sessionFeedbacks = useMemo(
    () => mockFeedbacks.filter(f => f.sessionId === selectedSessionId),
    [selectedSessionId]
  );

  const heatmapData = useMemo(() => {
    if (!session) return { cards: [], connections: [], totalPlayers: 0 };
    return calculateHeatmap(sessionFeedbacks, session.clueCardIds);
  }, [session, sessionFeedbacks]);

  const confusionData = useMemo(
    () => aggregateConfusions(sessionFeedbacks),
    [sessionFeedbacks]
  );

  const trueClueStats = useMemo(() => {
    if (!session) return [];
    const total = sessionFeedbacks.length;
    if (total === 0) return [];

    const cardConnectCount = new Map<string, number>();
    sessionFeedbacks.forEach(fb => {
      fb.groups.forEach(g => {
        g.cardIds.forEach(id => {
          if (session.clueCardIds.includes(id)) {
            cardConnectCount.set(id, (cardConnectCount.get(id) || 0) + 1);
          }
        });
      });
    });

    return session.clueCardIds
      .map(id => {
        const count = cardConnectCount.get(id) || 0;
        return { cardId: id, rate: total > 0 ? count / total : 0, count, total };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [session, sessionFeedbacks]);

  const insights = useMemo(() => {
    if (!session || sessionFeedbacks.length === 0) return [];

    const insightsList: { title: string; content: string }[] = [];
    const total = sessionFeedbacks.length;

    const topConn = [...heatmapData.connections].sort((a, b) => b.strength - a.strength)[0];
    if (topConn && topConn.strength >= 0.6) {
      insightsList.push({
        title: '🔥 强共识线索',
        content: `超过 ${Math.round(topConn.strength * 100)}% 的玩家将两张卡片建立了关联，说明这条线索引导非常清晰，玩家理解度高。`
      });
    }

    const weakConns = heatmapData.connections.filter(c => c.strength < 0.2);
    if (weakConns.length > 2) {
      insightsList.push({
        title: '⚠️ 弱关联提示',
        content: `有 ${weakConns.length} 组关联仅被不到 20% 的玩家识别到，可能需要加强这些线索之间的叙事连接。`
      });
    }

    if (confusionData.length > 0 && confusionData[0].count >= 3) {
      insightsList.push({
        title: '❓ 高频困惑点',
        content: `「${confusionData[0].cardName}」累计收到 ${confusionData[0].count} 条困惑反馈，建议策划讨论是否需要增加引导说明。`
      });
    }

    const certainAvg = heatmapData.connections.reduce((sum, c) => sum + c.statusCounts.certain, 0) /
      Math.max(heatmapData.connections.length, 1);
    if (certainAvg < 1) {
      insightsList.push({
        title: '🧐 信心不足',
        content: '整体来看，玩家标记"确定"状态的连接较少，多数处于"可疑"状态，可能是线索铺垫不足导致玩家不敢下结论。'
      });
    }

    if (insightsList.length === 0) {
      insightsList.push({
        title: '📊 数据总结',
        content: `本次测试共收集 ${total} 份有效反馈，数据分布均匀，线索设计整体处于合理区间。`
      });
    }

    return insightsList;
  }, [session, sessionFeedbacks, heatmapData, confusionData]);

  const completedSessions = mockSessions.filter(s => s.status !== 'draft');

  const getRateClass = (rate: number) => {
    if (rate >= 0.7) return styles.highRate;
    if (rate >= 0.4) return styles.midRate;
    return styles.lowRate;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>结果汇总</Text>
        <Text className={styles.subtitle}>查看玩家线索理解数据与困惑摘录</Text>
      </View>

      <View className={styles.sessionSelect}>
        <Text className={styles.selectLabel}>选择测试场次</Text>
        <ScrollView scrollX className={styles.sessionOptions}>
          {completedSessions.map(s => (
            <View
              key={s.id}
              className={classnames(styles.sessionOption, selectedSessionId === s.id && styles.active)}
              onClick={() => setSelectedSessionId(s.id)}
            >
              <Text className={classnames(styles.sessionOptionText, selectedSessionId === s.id && styles.active)}>
                {s.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {session && (
        <View className={styles.overviewCards}>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{session.players.filter(p => p.hasSubmitted).length}</Text>
            <Text className={styles.overviewLabel}>有效反馈</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{session.clueCardIds.length}</Text>
            <Text className={styles.overviewLabel}>线索卡</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{heatmapData.connections.length}</Text>
            <Text className={styles.overviewLabel}>连接类型</Text>
          </View>
        </View>
      )}

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'heatmap' && styles.active)}
          onClick={() => setActiveTab('heatmap')}
        >
          <Text className={classnames(styles.tabText, activeTab === 'heatmap' && styles.active)}>连接热区</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'confusion' && styles.active)}
          onClick={() => setActiveTab('confusion')}
        >
          <Text className={classnames(styles.tabText, activeTab === 'confusion' && styles.active)}>困惑摘录</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'insights' && styles.active)}
          onClick={() => setActiveTab('insights')}
        >
          <Text className={classnames(styles.tabText, activeTab === 'insights' && styles.active)}>数据洞察</Text>
        </View>
      </View>

      <ScrollView scrollY>
        {activeTab === 'heatmap' && (
          <View>
            <ConnectionHeatmap data={heatmapData} sessionId={selectedSessionId} />

            <Text className={styles.sectionTitle}>真线索识别率</Text>
            <View className={styles.trueClueSection}>
              {trueClueStats.length === 0 ? (
                <View className={styles.emptyTip}>
                  <Text className={styles.emptyTipText}>暂无数据</Text>
                </View>
              ) : (
                <View className={styles.trueClueList}>
                  {trueClueStats.slice(0, 6).map(stat => {
                    const card = heatmapData.cards.find(c => c.id === stat.cardId);
                    return (
                      <View key={stat.cardId} className={styles.trueClueItem}>
                        <View className={styles.trueClueInfo}>
                          <Text className={styles.trueClueName}>{card?.name || stat.cardId}</Text>
                          <Text className={styles.trueClueRate}>
                            {stat.count}/{stat.total} 人关联
                          </Text>
                        </View>
                        <View className={styles.rateBarWrap}>
                          <View
                            className={classnames(styles.rateBarFill, getRateClass(stat.rate))}
                            style={{ width: `${Math.round(stat.rate * 100)}%` }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'confusion' && (
          <View>
            {confusionData.length === 0 ? (
              <View className={styles.emptyTip}>
                <Text className={styles.emptyTipText}>暂无困惑反馈</Text>
              </View>
            ) : (
              confusionData.map(item => (
                <ConfusionItem key={item.cardId} data={item} />
              ))
            )}
          </View>
        )}

        {activeTab === 'insights' && (
          <View>
            {insights.map((insight, idx) => (
              <View key={idx} className={styles.insightCard}>
                <Text className={styles.insightTitle}>{insight.title}</Text>
                <Text className={styles.insightContent}>{insight.content}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StatisticsPage;
