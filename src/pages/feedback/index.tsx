import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Textarea, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockClueCards } from '@/data/mockClueCards';
import { ClueCard as ClueCardType, ClueGroup, ClueStatus, ConfusionEntry } from '@/types';
import ClueCardComponent from '@/components/ClueCard';
import { getStatusText } from '@/utils/heatmap';

const FeedbackPage: React.FC = () => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [groups, setGroups] = useState<ClueGroup[]>([]);
  const [confusions, setConfusions] = useState<ConfusionEntry[]>([]);
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null);

  const availableCards = useMemo(() => {
    const groupedIds = groups.flatMap(g => g.cardIds);
    return mockClueCards.filter(c => !groupedIds.includes(c.id));
  }, [groups]);

  const handleCardSelect = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleCreateGroup = () => {
    if (selectedCards.length === 0) {
      Taro.showToast({ title: '请先选择档案卡', icon: 'none' });
      return;
    }
    const newGroup: ClueGroup = {
      id: `group-${Date.now()}`,
      cardIds: [...selectedCards],
      status: 'suspicious'
    };
    setGroups([...groups, newGroup]);
    setSelectedCards([]);
    console.log('[FeedbackPage] Create group:', newGroup);
  };

  const handleAddToGroup = (groupIdx: number) => {
    if (selectedCards.length === 0) {
      Taro.showToast({ title: '请先选择档案卡', icon: 'none' });
      return;
    }
    const newGroups = [...groups];
    const existingIds = newGroups[groupIdx].cardIds;
    const toAdd = selectedCards.filter(id => !existingIds.includes(id));
    newGroups[groupIdx] = {
      ...newGroups[groupIdx],
      cardIds: [...existingIds, ...toAdd]
    };
    setGroups(newGroups);
    setSelectedCards([]);
    setActiveGroupIdx(null);
  };

  const handleRemoveFromGroup = (groupIdx: number, cardId: string) => {
    const newGroups = [...groups];
    newGroups[groupIdx] = {
      ...newGroups[groupIdx],
      cardIds: newGroups[groupIdx].cardIds.filter(id => id !== cardId)
    };
    if (newGroups[groupIdx].cardIds.length === 0) {
      newGroups.splice(groupIdx, 1);
    }
    setGroups(newGroups);
  };

  const handleGroupStatusChange = (groupIdx: number, status: ClueStatus) => {
    const newGroups = [...groups];
    newGroups[groupIdx] = { ...newGroups[groupIdx], status };
    setGroups(newGroups);
  };

  const handleDeleteGroup = (groupIdx: number) => {
    const newGroups = groups.filter((_, idx) => idx !== groupIdx);
    setGroups(newGroups);
  };

  const handleAddConfusion = () => {
    const newEntry: ConfusionEntry = {
      id: `conf-${Date.now()}`,
      cardId: mockClueCards[0].id,
      content: ''
    };
    setConfusions([...confusions, newEntry]);
  };

  const handleUpdateConfusion = (idx: number, field: keyof ConfusionEntry, value: string) => {
    const newConfusions = [...confusions];
    newConfusions[idx] = { ...newConfusions[idx], [field]: value };
    setConfusions(newConfusions);
  };

  const handleRemoveConfusion = (idx: number) => {
    setConfusions(confusions.filter((_, i) => i !== idx));
  };

  const handleReset = () => {
    setSelectedCards([]);
    setGroups([]);
    setConfusions([]);
    setActiveGroupIdx(null);
  };

  const handleSubmit = () => {
    if (groups.length === 0) {
      Taro.showToast({ title: '请至少创建一组线索关联', icon: 'none' });
      return;
    }
    const hasEmptyGroup = groups.some(g => g.cardIds.length === 0);
    if (hasEmptyGroup) {
      Taro.showToast({ title: '请确保每组都有档案卡', icon: 'none' });
      return;
    }
    console.log('[FeedbackPage] Submit feedback:', { groups, confusions });
    Taro.showToast({ title: '提交成功，感谢反馈！', icon: 'success' });
    setTimeout(() => handleReset(), 1500);
  };

  const getCardById = (id: string): ClueCardType | undefined => mockClueCards.find(c => c.id === id);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>玩家反馈</Text>
        <Text className={styles.subtitle}>完成章节后，请关联你认为有关联的档案卡</Text>
      </View>

      <View className={styles.stepIndicator}>
        <View className={classnames(styles.stepDot, styles.done)}>
          <Text className={styles.stepDotText}>1</Text>
        </View>
        <Text className={classnames(styles.stepLabel, styles.done)}>分组</Text>
        <View className={classnames(styles.stepLine, styles.done)} />
        <View className={classnames(styles.stepDot, selectedCards.length > 0 || groups.length > 0 ? styles.done : styles.active)}>
          <Text className={styles.stepDotText}>2</Text>
        </View>
        <Text className={classnames(styles.stepLabel, selectedCards.length > 0 || groups.length > 0 ? styles.done : styles.active)}>标记</Text>
        <View className={styles.stepLine} />
        <View className={styles.stepDot}>
          <Text className={styles.stepDotText}>3</Text>
        </View>
        <Text className={styles.stepLabel}>提交</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>档案卡池</Text>
          <Text className={styles.sectionTip}>
            {selectedCards.length > 0 ? `已选 ${selectedCards.length} 张` : '点击选择档案卡'}
          </Text>
        </View>
        <View className={styles.cardsGrid}>
          {availableCards.map(card => (
            <View key={card.id} className={styles.cardWrapper}>
              <View
                className={classnames(styles.selectableCard)}
                onClick={() => handleCardSelect(card.id)}
              >
                <ClueCardComponent
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  compact
                />
                {selectedCards.includes(card.id) && (
                  <View className={styles.selectedBadge}>
                    <Text className={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
        {availableCards.length === 0 && (
          <View className={styles.addCardHint}>
            <Text className={styles.addCardHintText}>所有卡片已完成分组</Text>
          </View>
        )}
      </View>

      <View className={styles.groupsSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>线索关联分组</Text>
          <Text className={styles.sectionTip}>{groups.length} 组已创建</Text>
        </View>

        {groups.map((group, gIdx) => (
          <View key={group.id} className={styles.groupCard}>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle}>第 {gIdx + 1} 组</Text>
              <View className={styles.statusSelector}>
                {(['suspicious', 'certain', 'confused'] as ClueStatus[]).map(status => (
                  <View
                    key={status}
                    className={classnames(
                      styles.statusOption,
                      styles[status],
                      group.status === status && styles.active
                    )}
                    onClick={() => handleGroupStatusChange(gIdx, status)}
                  >
                    <Text className={classnames(styles.statusOptionText, group.status === status && styles.active)}>
                      {getStatusText(status)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.groupCards}>
              {group.cardIds.map(cardId => {
                const card = getCardById(cardId);
                return (
                  <View key={cardId} className={styles.groupedCardMini}>
                    <Text className={styles.groupedCardText}>{card?.name || cardId}</Text>
                    <View
                      className={styles.removeCardBtn}
                      onClick={() => handleRemoveFromGroup(gIdx, cardId)}
                    >
                      <Text className={styles.removeCardText}>×</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <View
                className={styles.addGroupBtn}
                style={{ flex: 1, padding: '16rpx' }}
                onClick={() => handleAddToGroup(gIdx)}
              >
                <Text className={styles.addGroupBtnText}>+ 添加已选卡片到此组</Text>
              </View>
              <View className={styles.removeGroupBtn} onClick={() => handleDeleteGroup(gIdx)}>
                <Text className={styles.removeGroupText}>删除</Text>
              </View>
            </View>
          </View>
        ))}

        {selectedCards.length > 0 && (
          <View className={styles.addGroupBtn} onClick={handleCreateGroup}>
            <Text className={styles.addGroupBtnText}>+ 将已选 {selectedCards.length} 张创建为新组</Text>
          </View>
        )}

        {selectedCards.length === 0 && groups.length === 0 && (
          <View className={styles.addCardHint}>
            <Text className={styles.addCardHintText}>先在上方选择档案卡，然后创建关联分组</Text>
          </View>
        )}
      </View>

      <View className={styles.confusionSection}>
        <View className={styles.confusionHeader}>
          <Text className={styles.confusionTitle}>困惑摘录（选填）</Text>
          <Text className={styles.confusionCount}>{confusions.length} 条</Text>
        </View>

        {confusions.map((entry, idx) => {
          const card = getCardById(entry.cardId);
          return (
            <View key={entry.id} className={styles.confusionItem}>
              <View className={styles.confusionSelect}>
                <Text className={styles.confusionSelectLabel}>关联档案卡：</Text>
                <Text className={styles.confusionSelectValue}>{card?.name || '请选择'}</Text>
              </View>
              <View className={styles.confusionSelect}>
                <Text className={styles.confusionSelectLabel}>选择卡片：</Text>
                <ScrollView scrollX className={styles.cardsGrid} style={{ display: 'flex', flexWrap: 'nowrap', gap: 8 }}>
                  {mockClueCards.slice(0, 5).map(c => (
                    <View
                      key={c.id}
                      onClick={() => handleUpdateConfusion(idx, 'cardId', c.id)}
                      style={{
                        padding: '8rpx 16rpx',
                        background: entry.cardId === c.id ? 'rgba(124, 58, 237, 0.2)' : '#252532',
                        border: entry.cardId === c.id ? '2rpx solid #7C3AED' : '2rpx solid transparent',
                        borderRadius: 8,
                        marginRight: 8,
                        flexShrink: 0
                      }}
                    >
                      <Text style={{ fontSize: 22, color: entry.cardId === c.id ? '#A78BFA' : '#9CA3AF' }}>
                        {c.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <Textarea
                className={styles.confusionInput}
                placeholder="写下你对这个线索的困惑或疑问..."
                placeholderStyle="color: #6B7280"
                value={entry.content}
                onInput={(e) => handleUpdateConfusion(idx, 'content', e.detail.value)}
              />
              <View className={styles.removeConfusionBtn} onClick={() => handleRemoveConfusion(idx)}>
                <Text className={styles.removeConfusionText}>删除此条</Text>
              </View>
            </View>
          );
        })}

        <View className={styles.addConfusionBtn} onClick={handleAddConfusion}>
          <Text className={styles.addConfusionText}>+ 添加一条困惑</Text>
        </View>
      </View>

      <View className={styles.submitBar}>
        <View className={styles.resetBtn} onClick={handleReset}>
          <Text className={styles.resetBtnText}>重置</Text>
        </View>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          <Text className={styles.submitBtnText}>提交反馈</Text>
        </View>
      </View>
    </View>
  );
};

export default FeedbackPage;
