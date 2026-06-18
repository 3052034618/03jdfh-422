import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import ConnectionHeatmap from '@/components/ConnectionHeatmap';
import ConfusionItem from '@/components/ConfusionItem';
import useAppStore from '@/store/useAppStore';
import {
  calculateHeatmap,
  aggregateConfusions,
  calculateTrueClueStats,
  calculateMisleadingStats,
  getTopConfusionCards,
  generateComparisonMetrics,
  getStrengthColor,
  generateReplayReport,
  groupSessionsByLevel,
  compareMisleadingStats,
  getStatusText,
  generateVersionTrend
} from '@/utils/heatmap';
import { getClueCardById } from '@/data/mockClueCards';
import dayjs from 'dayjs';

type TabType = 'heatmap' | 'confusion' | 'insights' | 'compare' | 'replay';
type ReplaySubTab = 'single' | 'trend';

const StatisticsPage: React.FC = () => {
  const { sessions, feedbacks, initStore, getAllLevels } = useAppStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('heatmap');
  const [replaySubTab, setReplaySubTab] = useState<ReplaySubTab>('single');
  const [compareSessionId1, setCompareSessionId1] = useState<string>('');
  const [compareSessionId2, setCompareSessionId2] = useState<string>('');
  const [selectingSlot, setSelectingSlot] = useState<'A' | 'B' | null>(null);
  const [compareLevelFilter, setCompareLevelFilter] = useState<string>('');
  const [trendLevelId, setTrendLevelId] = useState<string>('');

  useEffect(() => {
    initStore();
  }, [initStore]);

  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const firstAvailable = sessions.find(s => s.status !== 'draft');
      if (firstAvailable) setSelectedSessionId(firstAvailable.id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (sessions.length >= 2 && !compareSessionId1 && !compareSessionId2) {
      const available = sessions.filter(s => s.status !== 'draft');
      if (available.length >= 2) {
        setCompareSessionId1(available[0].id);
        setCompareSessionId2(available[1].id);
      }
    }
  }, [sessions, compareSessionId1, compareSessionId2]);

  const allLevels = useMemo(() => getAllLevels(), [getAllLevels, sessions]);

  useEffect(() => {
    if (activeTab === 'replay' && !trendLevelId && allLevels.length > 0) {
      const levelWithMultiVersions = allLevels.find(l => l.sessionCount >= 2);
      if (levelWithMultiVersions) {
        setTrendLevelId(levelWithMultiVersions.id);
      } else if (allLevels.length > 0) {
        setTrendLevelId(allLevels[0].id);
      }
    }
  }, [activeTab, allLevels, trendLevelId]);

  const session = useMemo(
    () => sessions.find(s => s.id === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const sessionFeedbacks = useMemo(
    () => feedbacks.filter(f => f.sessionId === selectedSessionId),
    [feedbacks, selectedSessionId]
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
    return calculateTrueClueStats(sessionFeedbacks, session.clueCardIds);
  }, [session, sessionFeedbacks]);

  const misleadingStats = useMemo(() => {
    if (!session) return [];
    return calculateMisleadingStats(sessionFeedbacks, session.clueCardIds);
  }, [session, sessionFeedbacks]);

  const replayReport = useMemo(() => {
    if (!session) return null;
    return generateReplayReport(session, sessionFeedbacks);
  }, [session, sessionFeedbacks]);

  const versionTrend = useMemo(() => {
    if (!trendLevelId) return null;
    return generateVersionTrend(trendLevelId, sessions, feedbacks);
  }, [trendLevelId, sessions, feedbacks]);

  const levelGroups = useMemo(() => {
    const map = groupSessionsByLevel(sessions);
    return Array.from(map.entries()).map(([levelId, sList]) => ({
      levelId,
      levelName: sList[0]?.levelName || levelId,
      sessions: sList,
      count: sList.length
    })).filter(g => g.count >= 1);
  }, [sessions]);

  const compareSessionA = useMemo(
    () => sessions.find(s => s.id === compareSessionId1),
    [sessions, compareSessionId1]
  );

  const compareSessionB = useMemo(
    () => sessions.find(s => s.id === compareSessionId2),
    [sessions, compareSessionId2]
  );

  const compareFeedbacksA = useMemo(
    () => feedbacks.filter(f => f.sessionId === compareSessionId1),
    [feedbacks, compareSessionId1]
  );

  const compareFeedbacksB = useMemo(
    () => feedbacks.filter(f => f.sessionId === compareSessionId2),
    [feedbacks, compareSessionId2]
  );

  const comparisonMetrics = useMemo(() => {
    if (!compareSessionA || !compareSessionB) return [];
    return generateComparisonMetrics(compareSessionA, compareFeedbacksA, compareSessionB, compareFeedbacksB);
  }, [compareSessionA, compareSessionB, compareFeedbacksA, compareFeedbacksB]);

  const compareTrueStatsA = useMemo(() => {
    if (!compareSessionA) return [];
    return calculateTrueClueStats(compareFeedbacksA, compareSessionA.clueCardIds).slice(0, 5);
  }, [compareSessionA, compareFeedbacksA]);

  const compareTrueStatsB = useMemo(() => {
    if (!compareSessionB) return [];
    return calculateTrueClueStats(compareFeedbacksB, compareSessionB.clueCardIds).slice(0, 5);
  }, [compareSessionB, compareFeedbacksB]);

  const compareMisleadingStatsA = useMemo(() => {
    if (!compareSessionA) return [];
    return calculateMisleadingStats(compareFeedbacksA, compareSessionA.clueCardIds);
  }, [compareSessionA, compareFeedbacksA]);

  const compareMisleadingStatsB = useMemo(() => {
    if (!compareSessionB) return [];
    return calculateMisleadingStats(compareFeedbacksB, compareSessionB.clueCardIds);
  }, [compareSessionB, compareFeedbacksB]);

  const misleadingCompare = useMemo(
    () => compareMisleadingStats(compareMisleadingStatsA, compareMisleadingStatsB),
    [compareMisleadingStatsA, compareMisleadingStatsB]
  );

  const compareConfusionA = useMemo(() => getTopConfusionCards(compareFeedbacksA, 5), [compareFeedbacksA]);
  const compareConfusionB = useMemo(() => getTopConfusionCards(compareFeedbacksB, 5), [compareConfusionB]);

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

    if (misleadingStats.length > 0 && misleadingStats[0].rate >= 0.5) {
      insightsList.push({
        title: '🎭 误导风险',
        content: `「${misleadingStats[0].cardName}」被 ${Math.round(misleadingStats[0].rate * 100)}% 的玩家错误关联，这条误导线索可能太逼真了。`
      });
    }

    if (insightsList.length === 0) {
      insightsList.push({
        title: '📊 数据总结',
        content: `本次测试共收集 ${total} 份有效反馈，数据分布均匀，线索设计整体处于合理区间。`
      });
    }

    return insightsList;
  }, [session, sessionFeedbacks, heatmapData, confusionData, misleadingStats]);

  const availableSessions = sessions.filter(s => s.status !== 'draft');

  const getRateClass = (rate: number) => {
    if (rate >= 0.7) return styles.highRate;
    if (rate >= 0.4) return styles.midRate;
    return styles.lowRate;
  };

  const handleSelectSession = (sessionId: string) => {
    if (selectingSlot === 'A') {
      setCompareSessionId1(sessionId);
    } else if (selectingSlot === 'B') {
      setCompareSessionId2(sessionId);
    }
    setSelectingSlot(null);
  };

  const handleLevelFilterSelect = (levelId: string) => {
    if (compareLevelFilter === levelId) {
      setCompareLevelFilter('');
      return;
    }
    setCompareLevelFilter(levelId);
    const group = levelGroups.find(g => g.levelId === levelId);
    if (group && group.sessions.length >= 2) {
      setCompareSessionId1(group.sessions[0].id);
      setCompareSessionId2(group.sessions[1].id);
    }
  };

  const mergeConfusionForCompare = () => {
    const map = new Map<string, { cardId: string; countA: number; countB: number; name: string }>();
    compareConfusionA.forEach(item => {
      const card = getClueCardById(item.cardId);
      map.set(item.cardId, { cardId: item.cardId, name: card?.name || item.cardName, countA: item.count, countB: 0 });
    });
    compareConfusionB.forEach(item => {
      const card = getClueCardById(item.cardId);
      if (map.has(item.cardId)) {
        map.get(item.cardId)!.countB = item.count;
      } else {
        map.set(item.cardId, { cardId: item.cardId, name: card?.name || item.cardName, countA: 0, countB: item.count });
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.countA + b.countB) - (a.countA + a.countB));
  };

  const filteredSessionsForCompare = useMemo(() => {
    if (!compareLevelFilter) return availableSessions;
    return availableSessions.filter(s => s.levelId === compareLevelFilter);
  }, [availableSessions, compareLevelFilter]);

  const renderDeltaTag = (delta: number, higherIsBetter: boolean) => {
    if (delta === 0) return <Text className={classnames(styles.trendMetricDelta, styles.same)}>-</Text>;
    const good = higherIsBetter ? delta > 0 : delta < 0;
    const bad = higherIsBetter ? delta < 0 : delta > 0;
    const cls = good ? (delta > 0 ? styles.upGood : styles.downGood) : (bad ? (delta > 0 ? styles.upBad : styles.downBad) : styles.same);
    const sign = delta > 0 ? '+' : '';
    return <Text className={classnames(styles.trendMetricDelta, cls)}>{sign}{delta}</Text>;
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
          {availableSessions.length === 0 ? (
            <Text style={{ color: '#6B7280', fontSize: 26 }}>暂无可用场次</Text>
          ) : (
            availableSessions.map(s => (
              <View
                key={s.id}
                className={classnames(styles.sessionOption, selectedSessionId === s.id && styles.active)}
                onClick={() => setSelectedSessionId(s.id)}
              >
                <Text className={classnames(styles.sessionOptionText, selectedSessionId === s.id && styles.active)}>
                  {s.name}
                </Text>
              </View>
            ))
          )}
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
        <View
          className={classnames(styles.tabItem, activeTab === 'compare' && styles.active)}
          onClick={() => setActiveTab('compare')}
        >
          <Text className={classnames(styles.tabText, activeTab === 'compare' && styles.active)}>场次对比</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'replay' && styles.active)}
          onClick={() => setActiveTab('replay')}
        >
          <Text className={classnames(styles.tabText, activeTab === 'replay' && styles.active)}>复盘报告</Text>
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
                  {trueClueStats.slice(0, 6).map(stat => (
                    <View key={stat.cardId} className={styles.trueClueItem}>
                      <View className={styles.trueClueInfo}>
                        <Text className={styles.trueClueName}>{stat.cardName}</Text>
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
                  ))}
                </View>
              )}
            </View>

            {misleadingStats.length > 0 && (
              <View>
                <Text className={styles.sectionTitle}>误导线索排行</Text>
                <View className={styles.misleadingSection}>
                  <View className={styles.misleadingList}>
                    {misleadingStats.slice(0, 5).map((stat, idx) => (
                      <View key={stat.cardId} className={styles.misleadingItem}>
                        <View className={styles.misleadingInfo}>
                          <Text className={styles.misleadingName}>{stat.cardName}</Text>
                          <Text className={styles.misleadingBadge}>误导线索</Text>
                          <Text className={styles.misleadingRate}>
                            {stat.count}/{stat.total} 人错误关联
                          </Text>
                        </View>
                        <View className={styles.misleadingRank}>{idx + 1}</View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
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

        {activeTab === 'compare' && (
          <View>
            <View className={styles.levelFilterSection}>
              <Text className={styles.levelFilterLabel}>按关卡版本筛选（自动匹配同关不同版）</Text>
              <View className={styles.levelFilterChips}>
                <View
                  className={classnames(styles.levelFilterChip, !compareLevelFilter && styles.active)}
                  onClick={() => setCompareLevelFilter('')}
                >
                  <Text className={classnames(styles.levelFilterChipText, !compareLevelFilter && styles.active)}>
                    全部场次
                  </Text>
                </View>
                {levelGroups.map(g => (
                  <View
                    key={g.levelId}
                    className={classnames(styles.levelFilterChip, compareLevelFilter === g.levelId && styles.active)}
                    onClick={() => handleLevelFilterSelect(g.levelId)}
                  >
                    <Text className={classnames(styles.levelFilterChipText, compareLevelFilter === g.levelId && styles.active)}>
                      {g.levelName}
                    </Text>
                    <Text className={styles.levelFilterChipCount}>({g.count})</Text>
                  </View>
                ))}
              </View>
              {compareLevelFilter && levelGroups.find(g => g.levelId === compareLevelFilter)?.count === 1 && (
                <Text style={{ fontSize: 24, color: '#F59E0B', marginTop: 16, display: 'block' }}>
                  该关卡仅有1个测试场次，无法自动匹配对比
                </Text>
              )}
              {compareLevelFilter && (levelGroups.find(g => g.levelId === compareLevelFilter)?.count || 0) >= 2 && (
                <Text className={styles.autoMatchHint}>
                  ✓ 已自动匹配同关卡的前后两个场次
                </Text>
              )}
            </View>

            <View className={styles.compareSection}>
              <View className={styles.compareHeader}>
                <Text className={styles.compareTitle}>选择对比场次</Text>
              </View>
              <View className={styles.compareSelectors}>
                <View
                  className={classnames(styles.compareSelector, selectingSlot === 'A' && styles.active)}
                  onClick={() => setSelectingSlot('A')}
                >
                  <Text className={styles.compareSelectorLabel}>场次 A</Text>
                  <Text className={styles.compareSelectorValue}>
                    {compareSessionA?.name || '请选择'}
                  </Text>
                </View>
                <View
                  className={classnames(styles.compareSelector, selectingSlot === 'B' && styles.active)}
                  onClick={() => setSelectingSlot('B')}
                >
                  <Text className={styles.compareSelectorLabel}>场次 B</Text>
                  <Text className={styles.compareSelectorValue}>
                    {compareSessionB?.name || '请选择'}
                  </Text>
                </View>
              </View>
            </View>

            {compareSessionA && compareSessionB && (
              <View>
                <Text className={styles.sectionTitle}>指标变化总览</Text>
                <View className={styles.compareMetrics}>
                  {comparisonMetrics.map((metric, idx) => (
                    <View key={idx} className={styles.compareMetricRow}>
                      <Text className={styles.metricName}>{metric.metric}</Text>
                      <View className={styles.metricValueWrap}>
                        <View className={styles.metricValueItem}>
                          <Text className={styles.metricValueText}>{metric.valueA}</Text>
                        </View>
                        <View className={styles.metricValueItem}>
                          <Text className={classnames(styles.metricValueText, styles.highlight)}>{metric.valueB}</Text>
                        </View>
                      </View>
                      <Text className={classnames(styles.metricChange, styles[metric.direction])}>
                        {metric.direction === 'up' ? `+${metric.change}` : metric.direction === 'down' ? `${metric.change}` : '-'}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text className={styles.sectionTitle}>真线索识别率 TOP5</Text>
                <View className={styles.compareCharts}>
                  <View className={styles.compareChartColumn}>
                    <Text className={styles.compareChartLabel}>{compareSessionA.name}</Text>
                    {compareTrueStatsA.map(stat => (
                      <View key={stat.cardId} className={styles.compareChartBar}>
                        <Text className={styles.compareChartBarName}>{stat.cardName}</Text>
                        <View className={styles.compareChartBarWrap}>
                          <View
                            className={styles.compareChartBarFill}
                            style={{ width: `${Math.round(stat.rate * 100)}%`, backgroundColor: '#7C3AED' }}
                          />
                        </View>
                        <Text className={styles.compareChartBarValue}>{Math.round(stat.rate * 100)}%</Text>
                      </View>
                    ))}
                  </View>
                  <View className={styles.compareChartColumn}>
                    <Text className={styles.compareChartLabel}>{compareSessionB.name}</Text>
                    {compareTrueStatsB.map(stat => (
                      <View key={stat.cardId} className={styles.compareChartBar}>
                        <Text className={styles.compareChartBarName}>{stat.cardName}</Text>
                        <View className={styles.compareChartBarWrap}>
                          <View
                            className={styles.compareChartBarFill}
                            style={{ width: `${Math.round(stat.rate * 100)}%`, backgroundColor: '#C026D3' }}
                          />
                        </View>
                        <Text className={styles.compareChartBarValue}>{Math.round(stat.rate * 100)}%</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Text className={styles.sectionTitle}>误导线索变化</Text>
                <View className={styles.compareCharts}>
                  <View className={styles.compareChartColumn}>
                    <Text className={styles.compareChartLabel}>
                      错误关联率（A → B）
                    </Text>
                    {misleadingCompare.length === 0 ? (
                      <Text style={{ fontSize: 26, color: '#6B7280', textAlign: 'center' }}>
                        暂无误导线索数据
                      </Text>
                    ) : (
                      misleadingCompare.map(item => (
                        <View key={item.cardId} className={styles.misleadingCompareRow}>
                          <View style={{ flex: 1 }}>
                            <Text className={styles.misleadingCompareName}>
                              {item.cardName}
                              <Text className={styles.misleadingCompareBadge}>误导</Text>
                            </Text>
                          </View>
                          <View className={styles.misleadingCompareValues}>
                            <Text className={styles.misleadingCompareValue}>
                              {Math.round(item.rateA * 100)}%
                            </Text>
                            <Text className={styles.misleadingCompareArrow}>→</Text>
                            <Text className={styles.misleadingCompareValue}>
                              {Math.round(item.rateB * 100)}%
                            </Text>
                            <Text className={classnames(styles.misleadingCompareDiff, styles[item.trend])}>
                              {item.diff === 0 ? '-' : item.diff > 0 ? `+${item.diff}%` : `${item.diff}%`}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                    {misleadingCompare.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={{ fontSize: 22, color: '#DC2626' }}>红色数字=误导变强</Text>
                        <Text style={{ fontSize: 22, color: '#10B981' }}>绿色数字=误导已削弱</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text className={styles.sectionTitle}>困惑高频卡片变化</Text>
                <View className={styles.compareCharts}>
                  <View className={styles.compareChartColumn}>
                    <Text className={styles.compareChartLabel}>
                      {compareSessionA.name} → {compareSessionB.name}
                    </Text>
                    {mergeConfusionForCompare().map(item => {
                      const isBetter = item.countB < item.countA;
                      const isWorse = item.countB > item.countA;
                      return (
                        <View key={item.cardId} className={styles.confusionCompareRow}>
                          <View className={styles.confusionCompareCard}>
                            <Text className={styles.confusionCompareName}>{item.name}</Text>
                          </View>
                          <Text className={styles.confusionCompareValue}>{item.countA} →</Text>
                          <Text className={classnames(
                            styles.confusionCompareValue,
                            isBetter && styles.good,
                            isWorse && styles.bad
                          )}>
                            {item.countB}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <Text className={styles.sectionTitle}>连接热区变化</Text>
                <View className={styles.compareCharts}>
                  <View className={styles.compareChartColumn}>
                    <Text className={styles.compareChartLabel}>{compareSessionA.name}</Text>
                    <Text className={styles.compareChartSubLabel}>
                      共 {calculateHeatmap(compareFeedbacksA, compareSessionA.clueCardIds).connections.length} 组关联
                    </Text>
                    {calculateHeatmap(compareFeedbacksA, compareSessionA.clueCardIds)
                      .connections
                      .sort((a, b) => b.strength - a.strength)
                      .slice(0, 5)
                      .map(conn => {
                        const cardFrom = getClueCardById(conn.from);
                        const cardTo = getClueCardById(conn.to);
                        return (
                          <View key={`${conn.from}-${conn.to}`} className={styles.compareChartBar}>
                            <Text className={styles.compareChartBarName}>
                              {cardFrom?.name || conn.from} ⇄ {cardTo?.name || conn.to}
                            </Text>
                            <View className={styles.compareChartBarWrap}>
                              <View
                                className={styles.compareChartBarFill}
                                style={{
                                  width: `${Math.round(conn.strength * 100)}%`,
                                  backgroundColor: getStrengthColor(conn.strength)
                                }}
                              />
                            </View>
                            <Text className={styles.compareChartBarValue}>{Math.round(conn.strength * 100)}%</Text>
                          </View>
                        );
                      })}
                  </View>
                  <View className={styles.compareChartColumn}>
                    <Text className={styles.compareChartLabel}>{compareSessionB.name}</Text>
                    <Text className={styles.compareChartSubLabel}>
                      共 {calculateHeatmap(compareFeedbacksB, compareSessionB.clueCardIds).connections.length} 组关联
                    </Text>
                    {calculateHeatmap(compareFeedbacksB, compareSessionB.clueCardIds)
                      .connections
                      .sort((a, b) => b.strength - a.strength)
                      .slice(0, 5)
                      .map(conn => {
                        const cardFrom = getClueCardById(conn.from);
                        const cardTo = getClueCardById(conn.to);
                        return (
                          <View key={`${conn.from}-${conn.to}`} className={styles.compareChartBar}>
                            <Text className={styles.compareChartBarName}>
                              {cardFrom?.name || conn.from} ⇄ {cardTo?.name || conn.to}
                            </Text>
                            <View className={styles.compareChartBarWrap}>
                              <View
                                className={styles.compareChartBarFill}
                                style={{
                                  width: `${Math.round(conn.strength * 100)}%`,
                                  backgroundColor: getStrengthColor(conn.strength)
                                }}
                              />
                            </View>
                            <Text className={styles.compareChartBarValue}>{Math.round(conn.strength * 100)}%</Text>
                          </View>
                        );
                      })}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'replay' && (
          <View>
            <View className={styles.replaySubTabs}>
              <View
                className={classnames(styles.replaySubTab, replaySubTab === 'single' && styles.active)}
                onClick={() => setReplaySubTab('single')}
              >
                <Text className={classnames(styles.replaySubTabText, replaySubTab === 'single' && styles.active)}>
                  单场复盘
                </Text>
              </View>
              <View
                className={classnames(styles.replaySubTab, replaySubTab === 'trend' && styles.active)}
                onClick={() => setReplaySubTab('trend')}
              >
                <Text className={classnames(styles.replaySubTabText, replaySubTab === 'trend' && styles.active)}>
                  版本趋势
                </Text>
              </View>
            </View>

            {replaySubTab === 'single' && (
              <View>
                {!session ? (
                  <View className={styles.emptyTip}>
                    <Text className={styles.emptyTipText}>请先选择测试场次</Text>
                  </View>
                ) : !replayReport ? (
                  <View className={styles.emptyTip}>
                    <Text className={styles.emptyTipText}>暂无数据</Text>
                  </View>
                ) : (
                  <View>
                    <View className={styles.replayDataGrid}>
                      <View className={styles.replayDataChip}>
                        <Text className={styles.replayDataLabel}>场次</Text>
                        <Text className={styles.replayDataValue}>{replayReport.sessionName}</Text>
                      </View>
                      <View className={styles.replayDataChip}>
                        <Text className={styles.replayDataLabel}>关卡</Text>
                        <Text className={styles.replayDataValue}>{replayReport.levelName}</Text>
                      </View>
                      <View className={styles.replayDataChip}>
                        <Text className={styles.replayDataLabel}>反馈</Text>
                        <Text className={styles.replayDataValue}>{replayReport.submittedPlayers}/{replayReport.totalPlayers}</Text>
                      </View>
                    </View>

                    <View className={styles.replayCard}>
                      <Text className={styles.replayCardTitle}>📋 整体评估</Text>
                      <Text className={styles.replayAssessment}>
                        {replayReport.summary.overallAssessment}
                      </Text>
                    </View>

                    {replayReport.summary.trueClueHighlights.length > 0 && (
                      <View className={styles.replayCard}>
                        <Text className={styles.replayCardTitle}>🔍 真线索识别分析</Text>
                        <View className={styles.replayBulletList}>
                          {replayReport.summary.trueClueHighlights.map((h, i) => (
                            <Text key={i} className={styles.replayBulletItem}>{h}</Text>
                          ))}
                        </View>
                      </View>
                    )}

                    {replayReport.summary.misleadingAlerts.length > 0 && (
                      <View className={styles.replayCard}>
                        <Text className={styles.replayCardTitle}>🎭 误导线索预警</Text>
                        <View className={styles.replayBulletList}>
                          {replayReport.summary.misleadingAlerts.map((a, i) => (
                            <Text key={i} className={styles.replayBulletItem}>{a}</Text>
                          ))}
                        </View>
                      </View>
                    )}

                    {replayReport.topConnections.length > 0 && (
                      <View className={styles.replayCard}>
                        <Text className={styles.replayCardTitle}>🔥 连接热区 TOP5</Text>
                        {replayReport.topConnections.map((conn, idx) => {
                          const fromCard = getClueCardById(conn.from);
                          const toCard = getClueCardById(conn.to);
                          const color = getStrengthColor(conn.strength);
                          return (
                            <View key={`${conn.from}-${conn.to}`} style={{ marginBottom: 16 }}>
                              <Text style={{ fontSize: 26, color: '#D1D5DB' }}>
                                {idx + 1}. {fromCard?.name || conn.from} ⇄ {toCard?.name || conn.to}
                              </Text>
                              <Text style={{ fontSize: 24, color, marginLeft: 16 }}>
                                强度 {Math.round(conn.strength * 100)}% | 确定{conn.statusCounts.certain} 可疑{conn.statusCounts.suspicious} 没看懂{conn.statusCounts.confused}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {replayReport.confusionAggregates.length > 0 && (
                      <View className={styles.replayCard}>
                        <Text className={styles.replayCardTitle}>❓ 困惑焦点</Text>
                        <View className={styles.replayBulletList}>
                          {replayReport.summary.confusionFocus.map((c, i) => (
                            <Text key={i} className={styles.replayBulletItem}>{c}</Text>
                          ))}
                        </View>
                      </View>
                    )}

                    <View className={styles.replayCard}>
                      <Text className={styles.replayCardTitle}>📌 行动建议</Text>
                      {replayReport.summary.actionItems.map((item, i) => (
                        <View key={i} className={styles.replayActionItem}>
                          <Text className={styles.replayActionNum}>{i + 1}.</Text>
                          <Text>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {replaySubTab === 'trend' && (
              <View>
                <View className={styles.trendSelectSection}>
                  <Text className={styles.levelFilterLabel}>选择关卡查看版本趋势</Text>
                  <View className={styles.levelFilterChips}>
                    {allLevels.map(level => (
                      <View
                        key={level.id}
                        className={classnames(styles.levelFilterChip, trendLevelId === level.id && styles.active)}
                        onClick={() => setTrendLevelId(level.id)}
                      >
                        <Text className={classnames(styles.levelFilterChipText, trendLevelId === level.id && styles.active)}>
                          {level.name}
                        </Text>
                        <Text className={styles.levelFilterChipCount}>({level.sessionCount}v)</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {!versionTrend || versionTrend.sessions.length === 0 ? (
                  <View className={styles.emptyTip}>
                    <Text className={styles.emptyTipText}>该关卡暂无足够测试场次展示趋势</Text>
                  </View>
                ) : (
                  <View>
                    <View className={styles.trendOverallCard}>
                      <Text className={styles.trendOverallTitle}>
                        {versionTrend.levelName} · 整体改版效果
                      </Text>
                      <View className={styles.trendOverallRow}>
                        <Text className={styles.trendOverallLabel}>真线索识别率变化</Text>
                        <Text className={classnames(styles.trendOverallValue, {
                          [styles.good]: versionTrend.overallChange.trueRate > 0,
                          [styles.bad]: versionTrend.overallChange.trueRate < 0
                        })} style={{
                          color: versionTrend.overallChange.trueRate > 0 ? '#10B981' : versionTrend.overallChange.trueRate < 0 ? '#DC2626' : '#9CA3AF'
                        }}>
                          {versionTrend.overallChange.trueRate === 0 ? '-' : `${versionTrend.overallChange.trueRate > 0 ? '+' : ''}${versionTrend.overallChange.trueRate}%`}
                        </Text>
                      </View>
                      <View className={styles.trendOverallRow}>
                        <Text className={styles.trendOverallLabel}>误导关联率变化</Text>
                        <Text className={styles.trendOverallValue} style={{
                          color: versionTrend.overallChange.misleadingRate < 0 ? '#10B981' : versionTrend.overallChange.misleadingRate > 0 ? '#DC2626' : '#9CA3AF'
                        }}>
                          {versionTrend.overallChange.misleadingRate === 0 ? '-' : `${versionTrend.overallChange.misleadingRate > 0 ? '+' : ''}${versionTrend.overallChange.misleadingRate}%`}
                        </Text>
                      </View>
                      <View className={styles.trendOverallRow}>
                        <Text className={styles.trendOverallLabel}>困惑数量变化</Text>
                        <Text className={styles.trendOverallValue} style={{
                          color: versionTrend.overallChange.confusion < 0 ? '#10B981' : versionTrend.overallChange.confusion > 0 ? '#DC2626' : '#9CA3AF'
                        }}>
                          {versionTrend.overallChange.confusion === 0 ? '-' : `${versionTrend.overallChange.confusion > 0 ? '+' : ''}${versionTrend.overallChange.confusion}`}
                        </Text>
                      </View>
                    </View>

                    <View className={styles.trendTimeline}>
                      {versionTrend.sessions.map((point, idx) => {
                        const prevPoint = idx > 0 ? versionTrend.sessions[idx - 1] : null;
                        const dTrue = prevPoint ? Math.round((point.avgTrueRate - prevPoint.avgTrueRate) * 100) : 0;
                        const dMisleading = prevPoint ? Math.round((point.avgMisleadingRate - prevPoint.avgMisleadingRate) * 100) : 0;
                        const dConfusion = prevPoint ? point.confusionTotal - prevPoint.confusionTotal : 0;
                        return (
                          <View key={point.sessionId} className={styles.trendVersionItem}>
                            <View className={styles.trendVersionHeader}>
                              <Text className={styles.trendVersionBadge}>v{point.version}</Text>
                              <Text className={styles.trendVersionName}>{point.sessionName}</Text>
                              <Text className={styles.trendVersionTime}>
                                {dayjs(point.createdAt).format('MM-DD HH:mm')}
                              </Text>
                            </View>
                            {point.batch && (
                              <Text style={{ fontSize: 22, color: '#C026D3', marginBottom: 8 }}>
                                批次：{point.batch}
                              </Text>
                            )}
                            <View className={styles.trendMetricsGrid}>
                              <View className={styles.trendMetric}>
                                <Text className={styles.trendMetricLabel}>真线索识别</Text>
                                <Text className={classnames(styles.trendMetricValue)}>
                                  {Math.round(point.avgTrueRate * 100)}%
                                </Text>
                                {prevPoint && renderDeltaTag(dTrue, true)}
                              </View>
                              <View className={styles.trendMetric}>
                                <Text className={styles.trendMetricLabel}>误导关联</Text>
                                <Text className={styles.trendMetricValue}>
                                  {Math.round(point.avgMisleadingRate * 100)}%
                                </Text>
                                {prevPoint && renderDeltaTag(dMisleading, false)}
                              </View>
                              <View className={styles.trendMetric}>
                                <Text className={styles.trendMetricLabel}>困惑总数</Text>
                                <Text className={styles.trendMetricValue}>
                                  {point.confusionTotal}
                                </Text>
                                {prevPoint && renderDeltaTag(dConfusion, false)}
                              </View>
                              <View className={styles.trendMetric}>
                                <Text className={styles.trendMetricLabel}>提交人数</Text>
                                <Text className={styles.trendMetricValue}>
                                  {point.submittedPlayers}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {selectingSlot && (
        <View className={styles.sessionSelectModal} onClick={() => setSelectingSlot(null)}>
          <View className={styles.sessionSelectContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.sessionSelectTitle}>选择场次 {selectingSlot}</Text>
            <ScrollView scrollY className={styles.sessionSelectList}>
              {filteredSessionsForCompare.map(s => (
                <View
                  key={s.id}
                  className={classnames(
                    styles.sessionSelectItem,
                    (selectingSlot === 'A' && s.id === compareSessionId1) ||
                    (selectingSlot === 'B' && s.id === compareSessionId2)
                      ? styles.active
                      : ''
                  )}
                  onClick={() => handleSelectSession(s.id)}
                >
                  <Text className={styles.sessionSelectItemName}>{s.name}</Text>
                  <Text className={styles.sessionSelectItemLevel}>{s.levelName}</Text>
                </View>
              ))}
            </ScrollView>
            <View className={styles.cancelSelectBtn} onClick={() => setSelectingSlot(null)}>
              <Text className={styles.cancelSelectText}>取消</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default StatisticsPage;
