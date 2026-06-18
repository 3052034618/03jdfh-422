import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ClueCard as ClueCardType } from '@/types';

interface ClueCardProps {
  card: ClueCardType;
  selected?: boolean;
  grouped?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const ClueCardComponent: React.FC<ClueCardProps> = ({ card, selected, grouped, onClick, compact }) => {
  return (
    <View
      className={classnames(
        styles.card,
        selected && styles.selected,
        grouped && styles.grouped,
        compact && styles.compact
      )}
      onClick={onClick}
    >
      <View className={styles.header}>
        <Text className={styles.category}>{card.category}</Text>
        {card.isTrueClue && (
          <View className={styles.trueTag}>
            <Text className={styles.trueTagText}>真线索</Text>
          </View>
        )}
      </View>
      <Text className={styles.name}>{card.name}</Text>
      {!compact && (
        <Text className={styles.description}>{card.description}</Text>
      )}
    </View>
  );
};

export default ClueCardComponent;
