import React, { useMemo, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import useAppStore from '@/store/useAppStore';
import dayjs from 'dayjs';

const statusMap = {
  active: { label: '进行中', cls: 'active' },
  completed: { label: '已完成', cls: 'completed' },
  draft: { label: '草稿', cls: 'draft' }
};

const SessionDetailPage: React.FC = () => {
  const router = useRouter();
  const sessionId = router.params.id || 'session-001';
  const { sessions, initStore, getSessionById } = useAppStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const session = useMemo(
    () => sessions.find(s => s.id === sessionId) || getSessionById(sessionId as string),
    [sessions, sessionId, getSessionById]
  );

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
        {session.players.length === 0 ? (
          <View className={styles.playerItem}>
            <Text style={{ color: '#6B7280', fontSize: 28 }}>暂无玩家</Text>
          </View>
        ) : (
          <View className={styles.playerList}>
            {session.players.map(player => (
              <View key={player.id} className={styles.playerItem}>
                <View className={styles.playerInfo}>
                  <Text className={styles.playerName}>{player.name}</Text>
                  <Text className={styles.playerCode}>编号：{player.code}</Text>
                </View>
                <View className={classnames(styles.submitStatus, player.hasSubmitted ? styles.done : styles.pending)}>
                  <Text className={styles.statusLabel}>
                    {player.hasSubmitted ? '已提交' : '待提交'}
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
    </View>
  );
};

export default SessionDetailPage;
