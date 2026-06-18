import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { ConfusionAggregate } from '@/types';

interface ConfusionItemProps {
  data: ConfusionAggregate;
  expanded?: boolean;
}

const ConfusionItem: React.FC<ConfusionItemProps> = ({ data, expanded = false }) => {
  const [showAll, setShowAll] = React.useState(expanded);
  const displayEntries = showAll ? data.entries : data.entries.slice(0, 2);

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.cardInfo}>
          <Text className={styles.cardName}>{data.cardName}</Text>
          <View className={styles.countBadge}>
            <Text className={styles.countText}>{data.count}条困惑</Text>
          </View>
        </View>
      </View>

      <View className={styles.entries}>
        {displayEntries.map((entry, idx) => (
          <View key={idx} className={styles.entry}>
            <View className={styles.quoteMark}>
              <Text className={styles.quoteText}>"</Text>
            </View>
            <View className={styles.entryContent}>
              <Text className={styles.entryText}>{entry.content}</Text>
              <Text className={styles.entryPlayer}>—— {entry.playerName}</Text>
            </View>
          </View>
        ))}
      </View>

      {data.entries.length > 2 && (
        <View className={styles.toggleBtn} onClick={() => setShowAll(!showAll)}>
          <Text className={styles.toggleText}>
            {showAll ? '收起' : `展开全部 ${data.entries.length} 条`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ConfusionItem;
