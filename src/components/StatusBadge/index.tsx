import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ClueStatus } from '@/types';

interface StatusBadgeProps {
  status: ClueStatus;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const textMap = {
    suspicious: '可疑',
    certain: '确定',
    confused: '没看懂'
  };

  return (
    <View className={classnames(styles.badge, styles[status], styles[size])}>
      <Text className={styles.text}>{textMap[status]}</Text>
    </View>
  );
};

export default StatusBadge;
