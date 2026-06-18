import React, { useMemo, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import useAppStore from '@/store/useAppStore';
import { getClueCardById, getStrengthColor, getStatusText } from '@/utils/heatmap';

const HeatmapDetailPage: React.FC = () => {
  const router = useRouter();
  const sessionId = (router.params.sessionId as string) || 'session-001';
  const fromId = (router.params.from as string) || 'card-001';
  const toId = (router.params.to as string) || 'card-002';
  const { feedbacks, initStore } = useAppStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const fromCard = useMemo(() => getClueCardById(fromId), [fromId]);
  const toCard = useMemo(() => getClueCardById(toId), [toId]);

  const { count, total, statusCounts, players } = useMemo(() => {
    const sessionFeedbacks = feedbacks.filter(f => f.sessionId === sessionId);
    let count = 0;
    const statusCounts = { certain: 0, suspicious: 0, confused: 0 };
    const players: { name: string; status: 'certain' | 'suspicious' | 'confused' }[] = [];

    sessionFeedbacks.forEach(fb => {
      fb.groups.forEach(g => {
        if (g.cardIds.includes(fromId) && g.cardIds.includes(toId)) {
          count++;
          statusCounts[g.status]++;
          players.push({ name: fb.playerName, status: g.status });
        }
      });
    });

    return { count, total: sessionFeedbacks.length, statusCounts, players };
  }, [feedbacks, sessionId, fromId, toId]);

  const strength = total > 0 ? count / total : 0;
  const percentage = Math.round(strength * 100);
  const color = getStrengthColor(strength);

  return (
    <View className={styles.page}>
      <View className={styles.connectionHeader}>
        <View className={styles.connectionPair}>
          <View className={styles.cardBox}>
            <Text className={styles.cardBoxName}>{fromCard?.name || fromId}</Text>
            <Text className={styles.cardBoxDesc}>{fromCard?.description || ''}</Text>
          </View>
          <Text className={styles.connectSymbol}>⇄</Text>
          <View className={styles.cardBox}>
            <Text className={styles.cardBoxName}>{toCard?.name || toId}</Text>
            <Text className={styles.cardBoxDesc}>{toCard?.description || ''}</Text>
          </View>
        </View>

        <View className={styles.strengthSection}>
          <Text className={styles.strengthLabel}>连接强度</Text>
          <Text className={styles.strengthValue} style={{ color }}>{percentage}%</Text>
          <View className={styles.strengthBar}>
            <View
              className={styles.strengthFill}
              style={{ width: `${percentage}%`, background: color }}
            />
          </View>
        </View>

        <View className={styles.statusBreakdown}>
          <View className={styles.statusItem} style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
            <Text className={styles.statusItemValue} style={{ color: '#DC2626' }}>
              {statusCounts.certain}
            </Text>
            <Text className={styles.statusItemLabel}>确定</Text>
          </View>
          <View className={styles.statusItem} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <Text className={styles.statusItemValue} style={{ color: '#F59E0B' }}>
              {statusCounts.suspicious}
            </Text>
            <Text className={styles.statusItemLabel}>可疑</Text>
          </View>
          <View className={styles.statusItem} style={{ background: 'rgba(107, 114, 128, 0.15)' }}>
            <Text className={styles.statusItemValue} style={{ color: '#9CA3AF' }}>
              {statusCounts.confused}
            </Text>
            <Text className={styles.statusItemLabel}>没看懂</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>建立此关联的玩家 ({players.length}/{total})</Text>
      <View className={styles.playerList}>
        {players.length === 0 ? (
          <Text style={{ color: '#6B7280', fontSize: 28, textAlign: 'center' }}>暂无数据</Text>
        ) : (
          players.map((p, idx) => (
            <View key={idx} className={styles.playerRow}>
              <Text className={styles.playerName}>{p.name}</Text>
              <Text
                style={{
                  fontSize: 24,
                  padding: '4rpx 14rpx',
                  borderRadius: 8,
                  background:
                    p.status === 'certain' ? 'rgba(220, 38, 38, 0.15)' :
                    p.status === 'suspicious' ? 'rgba(245, 158, 11, 0.15)' :
                    'rgba(107, 114, 128, 0.2)',
                  color:
                    p.status === 'certain' ? '#DC2626' :
                    p.status === 'suspicious' ? '#F59E0B' :
                    '#9CA3AF'
                }}
              >
                {getStatusText(p.status)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default HeatmapDetailPage;
