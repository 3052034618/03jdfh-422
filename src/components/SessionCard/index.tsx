import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { TestSession } from '@/types';
import dayjs from 'dayjs';

interface SessionCardProps {
  session: TestSession;
}

const statusConfig = {
  active: { text: '进行中', color: 'active' },
  completed: { text: '已完成', color: 'completed' },
  draft: { text: '草稿', color: 'draft' }
} as const;

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const submittedCount = session.players.filter(p => p.hasSubmitted).length;
  const status = statusConfig[session.status];
  const progress = session.players.length > 0 ? (submittedCount / session.players.length) * 100 : 0;

  const handleClick = () => {
    console.log('[SessionCard] Click session:', session.id);
    Taro.navigateTo({ url: `/pages/session-detail/index?id=${session.id}` });
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.name}>{session.name}</Text>
        <View className={classnames(styles.status, styles[status.color])}>
          <Text className={styles.statusText}>{status.text}</Text>
        </View>
      </View>

      <View className={styles.meta}>
        <Text className={styles.level}>{session.levelName}</Text>
        <Text className={styles.date}>{dayjs(session.createdAt).format('MM-DD HH:mm')}</Text>
      </View>

      {session.players.length > 0 && (
        <View className={styles.progressSection}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressText}>反馈进度</Text>
            <Text className={styles.progressCount}>{submittedCount}/{session.players.length}</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progress}%` }} />
          </View>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.creator}>创建者：{session.createdBy}</Text>
        <Text className={styles.arrow}>→</Text>
      </View>
    </View>
  );
};

export default SessionCard;
