import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import useAppStore from '@/store/useAppStore';
import { getFeedbackByPlayer, getStatusText } from '@/utils/heatmap';
import { getClueCardById } from '@/data/mockClueCards';
import dayjs from 'dayjs';
import { PlayerInfo, PlayerFeedback } from '@/types';

const statusMap = {
  active: { label: '进行中', cls: 'active' },
  completed: { label: '已完成', cls: 'completed' },
  draft: { label: '草稿', cls: 'draft' }
};

const SessionDetailPage: React.FC = () => {
  const router = useRouter();
  const sessionId = router.params.id || 'session-001';
  const { sessions, feedbacks, initStore, getSessionById } = useAppStore();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    initStore();
  }, [initStore]);

  const session = useMemo(
    () => sessions.find(s => s.id === sessionId) || getSessionById(sessionId as string),
    [sessions, sessionId, getSessionById]
  );

  const playerFeedback = useMemo((): PlayerFeedback | undefined => {
    if (!selectedPlayer) return undefined;
    return getFeedbackByPlayer(feedbacks, sessionId as string, selectedPlayer.id);
  }, [selectedPlayer, feedbacks, sessionId]);

  if (!session) {
    return (
      <View className={styles.page}>
        <Text>场次不存在</Text>
      </View>
    );
  }

  const submittedCount = session.players.filter(p => p.hasSubmitted).length;
  const progress = session.players.length > 0 ? (submittedCount / session.players.length) * 100 : 0;

  const handleViewStats = () => {
    console.log('[SessionDetail] View statistics for session:', sessionId);
    Taro.switchTab({ url: '/pages/statistics/index' });
  };

  const handlePlayerClick = (player: PlayerInfo) => {
    if (player.hasSubmitted) {
      setSelectedPlayer(player);
      setShowDetail(true);
    }
  };

  const getStatusBadgeClass = (status: 'suspicious' | 'certain' | 'confused') => {
    const map = {
      suspicious: 'rgba(245, 158, 11, 0.15)',
      certain: 'rgba(16, 185, 129, 0.15)',
      confused: 'rgba(220, 38, 38, 0.15)'
    };
    const colorMap = {
      suspicious: '#F59E0B',
      certain: '#10B981',
      confused: '#DC2626'
    };
    return { bg: map[status], color: colorMap[status] };
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{session.name}</Text>
          <View className={classnames(styles.statusBadge, styles[statusMap[session.status].cls])}>
            <Text className={styles.statusText}>{statusMap[session.status].label}</Text>
          </View>
        </View>
        <View className={styles.metaList}>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>关卡名称</Text>
            <Text className={styles.metaValue}>{session.levelName}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>创建者</Text>
            <Text className={styles.metaValue}>{session.createdBy}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>创建时间</Text>
            <Text className={styles.metaValue}>{dayjs(session.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>线索卡数量</Text>
            <Text className={styles.metaValue}>{session.clueCardIds.length} 张</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>反馈进度</Text>
        <View className={styles.progressCard}>
          <View className={styles.progressInfo}>
            <Text className={styles.progressLabel}>已提交 / 总人数</Text>
            <Text className={styles.progressValue}>{submittedCount} / {session.players.length}</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progress}%` }} />
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>玩家列表</Text>
        <Text style={{ fontSize: 24, color: '#6B7280', marginBottom: 20, display: 'block' }}>
          点击已提交的玩家可查看详情
        </Text>
        {session.players.length === 0 ? (
          <View className={styles.playerItem}>
            <Text style={{ color: '#6B7280', fontSize: 28 }}>暂无玩家</Text>
          </View>
        ) : (
          <View className={styles.playerList}>
            {session.players.map(player => (
              <View
                key={player.id}
                className={classnames(
                  styles.playerItem,
                  player.hasSubmitted && styles.clickable
                )}
                onClick={() => handlePlayerClick(player)}
              >
                <View className={styles.playerInfo}>
                  <Text className={styles.playerName}>{player.name}</Text>
                  <Text className={styles.playerCode}>编号：{player.code}</Text>
                </View>
                <View className={classnames(styles.submitStatus, player.hasSubmitted ? styles.done : styles.pending)}>
                  <Text className={styles.statusLabel}>
                    {player.hasSubmitted ? '已提交 · 点击查看' : '待提交'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.actionBtn} onClick={handleViewStats}>
        <Text className={styles.actionBtnText}>查看统计结果</Text>
      </View>

      {showDetail && selectedPlayer && (
        <View className={styles.playerDetailModal} onClick={() => setShowDetail(false)}>
          <View className={styles.playerDetailContent} onClick={e => e.stopPropagation()}>
            <View className={styles.playerDetailHeader}>
              <Text className={styles.playerDetailTitle}>玩家反馈详情</Text>
              <View className={styles.playerDetailClose} onClick={() => setShowDetail(false)}>
                <Text>×</Text>
              </View>
            </View>

            <ScrollView scrollY className={styles.playerDetailBody}>
              <View className={styles.playerDetailSection}>
                <Text className={styles.playerDetailSectionTitle}>基本信息</Text>
                <View className={styles.playerDetailInfoRow}>
                  <Text className={styles.playerDetailInfoLabel}>玩家姓名</Text>
                  <Text className={styles.playerDetailInfoValue}>{selectedPlayer.name}</Text>
                </View>
                <View className={styles.playerDetailInfoRow}>
                  <Text className={styles.playerDetailInfoLabel}>玩家编号</Text>
                  <Text className={styles.playerDetailInfoValue}>{selectedPlayer.code}</Text>
                </View>
                <View className={styles.playerDetailInfoRow}>
                  <Text className={styles.playerDetailInfoLabel}>提交状态</Text>
                  <Text className={styles.playerDetailInfoValue} style={{ color: '#10B981' }}>
                    {selectedPlayer.hasSubmitted ? '已提交' : '未提交'}
                  </Text>
                </View>
                {playerFeedback && (
                  <View className={styles.playerDetailInfoRow}>
                    <Text className={styles.playerDetailInfoLabel}>提交时间</Text>
                    <Text className={styles.playerDetailInfoValue}>
                      {dayjs(playerFeedback.submittedAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </View>
                )}
              </View>

              <View className={styles.playerDetailSection}>
                <Text className={styles.playerDetailSectionTitle}>关联分组</Text>
                {!playerFeedback || playerFeedback.groups.length === 0 ? (
                  <View className={styles.emptyDetailTip}>
                    <Text>暂无分组数据</Text>
                  </View>
                ) : (
                  playerFeedback.groups.map((group, idx) => {
                    const badgeStyle = getStatusBadgeClass(group.status);
                    return (
                      <View key={idx} className={styles.groupItem}>
                        <View className={styles.groupHeader}>
                          <Text style={{ fontSize: 26, color: '#D1D5DB' }}>分组 {idx + 1}</Text>
                          <Text
                            style={{
                              fontSize: 24,
                              padding: '4rpx 12rpx',
                              borderRadius: 8,
                              background: badgeStyle.bg,
                              color: badgeStyle.color
                            }}
                          >
                            {getStatusText(group.status)}
                          </Text>
                        </View>
                        <View className={styles.groupCards}>
                          {group.cardIds.map(cardId => {
                            const card = getClueCardById(cardId);
                            return (
                              <Text key={cardId} className={styles.groupCardTag}>
                                {card?.name || cardId}
                                {card?.isTrueClue === false ? ' ⚠️' : ''}
                              </Text>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              <View className={styles.playerDetailSection}>
                <Text className={styles.playerDetailSectionTitle}>困惑内容</Text>
                {!playerFeedback || playerFeedback.confusions.length === 0 ? (
                  <View className={styles.emptyDetailTip}>
                    <Text>该玩家未填写困惑内容</Text>
                  </View>
                ) : (
                  playerFeedback.confusions.map((entry, idx) => {
                    const card = getClueCardById(entry.cardId);
                    return (
                      <View key={idx} className={styles.confusionItem}>
                        <Text className={styles.confusionCard}>
                          📋 {card?.name || entry.cardId}
                        </Text>
                        <Text className={styles.confusionContent}>{entry.content}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default SessionDetailPage;
