import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { HeatmapData, ConnectionData } from '@/types';
import { getStrengthColor, getClueCardById } from '@/utils/heatmap';

interface ConnectionHeatmapProps {
  data: HeatmapData;
  sessionId?: string;
}

const ConnectionHeatmap: React.FC<ConnectionHeatmapProps> = ({ data, sessionId }) => {
  const sortedConnections = useMemo(() => {
    return [...data.connections].sort((a, b) => b.strength - a.strength);
  }, [data.connections]);

  const topConnections = sortedConnections.slice(0, 6);

  const handleClickDetail = (conn: ConnectionData) => {
    console.log('[ConnectionHeatmap] Click connection:', conn.from, conn.to);
    if (sessionId) {
      Taro.navigateTo({
        url: `/pages/heatmap-detail/index?sessionId=${sessionId}&from=${conn.from}&to=${conn.to}`
      });
    }
  };

  if (data.totalPlayers === 0) {
    return (
      <View className={styles.empty}>
        <Text className={styles.emptyText}>暂无反馈数据</Text>
      </View>
    );
  }

  return (
    <View className={styles.wrapper}>
      <View className={styles.legend}>
        <Text className={styles.legendTitle}>连接强度图例</Text>
        <View className={styles.legendItems}>
          <View className={styles.legendItem}>
            <View className={styles.legendBar} style={{ background: '#4B5563' }} />
            <Text className={styles.legendLabel}>弱 ({'<'}20%)</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendBar} style={{ background: '#7C3AED' }} />
            <Text className={styles.legendLabel}>中 (20-40%)</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendBar} style={{ background: '#C026D3' }} />
            <Text className={styles.legendLabel}>强 (40-70%)</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendBar} style={{ background: '#DC2626' }} />
            <Text className={styles.legendLabel}>极强 ({'>'}70%)</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{data.cards.length}</Text>
          <Text className={styles.statLabel}>线索卡</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{data.connections.length}</Text>
          <Text className={styles.statLabel}>连接类型</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{data.totalPlayers}</Text>
          <Text className={styles.statLabel}>参与玩家</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>热门连接 TOP {topConnections.length}</Text>

      <ScrollView scrollY className={styles.list}>
        {topConnections.map((conn, idx) => {
          const fromCard = getClueCardById(conn.from);
          const toCard = getClueCardById(conn.to);
          const percentage = Math.round(conn.strength * 100);
          const color = getStrengthColor(conn.strength);

          return (
            <View
              key={`${conn.from}-${conn.to}`}
              className={styles.connectionItem}
              onClick={() => handleClickDetail(conn)}
            >
              <View className={styles.rank} style={{ background: color }}>
                <Text className={styles.rankText}>{idx + 1}</Text>
              </View>
              <View className={styles.connectionInfo}>
                <View className={styles.cardNames}>
                  <Text className={styles.cardName}>{fromCard?.name || conn.from}</Text>
                  <Text className={styles.linkSymbol}>⇄</Text>
                  <Text className={styles.cardName}>{toCard?.name || conn.to}</Text>
                </View>
                <View className={styles.statusRow}>
                  {conn.statusCounts.certain > 0 && (
                    <View className={styles.statusChip}>
                      <Text className={styles.statusChipText} style={{ color: '#DC2626' }}>
                        确定 {conn.statusCounts.certain}
                      </Text>
                    </View>
                  )}
                  {conn.statusCounts.suspicious > 0 && (
                    <View className={styles.statusChip}>
                      <Text className={styles.statusChipText} style={{ color: '#F59E0B' }}>
                        可疑 {conn.statusCounts.suspicious}
                      </Text>
                    </View>
                  )}
                  {conn.statusCounts.confused > 0 && (
                    <View className={styles.statusChip}>
                      <Text className={styles.statusChipText} style={{ color: '#9CA3AF' }}>
                        不懂 {conn.statusCounts.confused}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View className={styles.strengthWrap}>
                <Text className={styles.strengthPercent} style={{ color }}>{percentage}%</Text>
                <View className={styles.strengthBar}>
                  <View
                    className={styles.strengthFill}
                    style={{ width: `${percentage}%`, background: color }}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ConnectionHeatmap;
