import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import SessionCard from '@/components/SessionCard';
import { mockClueCards } from '@/data/mockClueCards';
import useAppStore from '@/store/useAppStore';
import { TestSession, PlayerInfo, LevelInfo } from '@/types';

type FilterType = 'all' | 'active' | 'completed' | 'draft';
type LevelMode = 'existing' | 'new';

interface PlayerDraft {
  key: string;
  name: string;
  code: string;
}

const SessionsPage: React.FC = () => {
  const { sessions, initStore, createSession, addPlayerToSession, getAllLevels, getNextLevelVersion } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showModal, setShowModal] = useState(false);
  const [levelMode, setLevelMode] = useState<LevelMode>('new');
  const [formData, setFormData] = useState({
    name: '',
    levelName: '',
    batch: ''
  });
  const [selectedExistingLevelId, setSelectedExistingLevelId] = useState<string>('');
  const [playerDrafts, setPlayerDrafts] = useState<PlayerDraft[]>([
    { key: `k-${Date.now()}-0`, name: '', code: '' }
  ]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  useEffect(() => {
    initStore();
  }, [initStore]);

  const allLevels = useMemo(() => getAllLevels(), [getAllLevels, sessions]);

  const nextVersion = useMemo(() => {
    if (levelMode === 'existing' && selectedExistingLevelId) {
      return getNextLevelVersion(selectedExistingLevelId);
    }
    return 1;
  }, [levelMode, selectedExistingLevelId, getNextLevelVersion, sessions]);

  const selectedLevel = useMemo(
    () => allLevels.find(l => l.id === selectedExistingLevelId),
    [allLevels, selectedExistingLevelId]
  );

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions;
    return sessions.filter(s => s.status === filter);
  }, [sessions, filter]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '进行中' },
    { key: 'completed', label: '已完成' },
    { key: 'draft', label: '草稿' }
  ];

  const handleCreate = () => {
    console.log('[SessionsPage] Open create modal');
    setFormData({ name: '', levelName: '', batch: '' });
    setLevelMode(allLevels.length > 0 ? 'existing' : 'new');
    setSelectedExistingLevelId('');
    setPlayerDrafts([{ key: `k-${Date.now()}-0`, name: '', code: '' }]);
    setSelectedCardIds(mockClueCards.slice(0, 7).map(c => c.id));
    setShowModal(true);
  };

  const handleAddPlayer = () => {
    setPlayerDrafts([
      ...playerDrafts,
      { key: `k-${Date.now()}-${playerDrafts.length}`, name: '', code: '' }
    ]);
  };

  const handleRemovePlayer = (key: string) => {
    if (playerDrafts.length <= 1) return;
    setPlayerDrafts(playerDrafts.filter(p => p.key !== key));
  };

  const handleUpdatePlayer = (key: string, field: 'name' | 'code', value: string) => {
    setPlayerDrafts(
      playerDrafts.map(p => (p.key === key ? { ...p, [field]: value } : p))
    );
  };

  const handleToggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
    } else {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const handleSelectExistingLevel = (levelId: string) => {
    setSelectedExistingLevelId(levelId);
    const level = allLevels.find(l => l.id === levelId);
    if (level) {
      setFormData(prev => ({ ...prev, levelName: level.name }));
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请填写场次名称', icon: 'none' });
      return;
    }
    if (levelMode === 'new' && !formData.levelName.trim()) {
      Taro.showToast({ title: '请填写关卡名称', icon: 'none' });
      return;
    }
    if (levelMode === 'existing' && !selectedExistingLevelId) {
      Taro.showToast({ title: '请选择已有或新建关卡', icon: 'none' });
      return;
    }
    const validPlayers = playerDrafts.filter(
      p => p.name.trim() !== '' && p.code.trim() !== ''
    );
    if (validPlayers.length === 0) {
      Taro.showToast({ title: '请至少添加一位玩家', icon: 'none' });
      return;
    }
    if (selectedCardIds.length === 0) {
      Taro.showToast({ title: '请至少选择一张档案卡', icon: 'none' });
      return;
    }

    let levelId: string;
    let levelName: string;
    if (levelMode === 'existing' && selectedLevel) {
      levelId = selectedLevel.id;
      levelName = selectedLevel.name;
    } else {
      levelId = `level-${Date.now()}`;
      levelName = formData.levelName;
    }

    const newSession: TestSession = createSession({
      name: formData.name,
      levelName,
      levelId,
      version: nextVersion,
      batch: formData.batch.trim() || undefined,
      players: [],
      clueCardIds: selectedCardIds
    });

    validPlayers.forEach(p => {
      addPlayerToSession(newSession.id, { name: p.name.trim(), code: p.code.trim() });
    });

    console.log('[SessionsPage] Session created:', newSession, 'with players:', validPlayers);
    Taro.showToast({
      title: `创建成功（v${nextVersion}）`,
      icon: 'success'
    });
    setShowModal(false);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>测试场次</Text>
        <Text className={styles.subtitle}>管理内测场次，追踪玩家反馈进度</Text>
      </View>

      <ScrollView scrollX className={styles.filterBar}>
        {filters.map(f => (
          <View
            key={f.key}
            className={classnames(styles.filterItem, filter === f.key && styles.active)}
            onClick={() => setFilter(f.key)}
          >
            <Text className={classnames(styles.filterText, filter === f.key && styles.active)}>
              {f.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY>
        {filteredSessions.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无测试场次</Text>
          </View>
        ) : (
          filteredSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </ScrollView>

      <View className={styles.createBtn} onClick={handleCreate}>
        <Text className={styles.createBtnText}>+ 创建新场次</Text>
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={(e) => { e.stopPropagation(); setShowModal(false); }}>
          <View className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <ScrollView scrollY className={styles.modalScroll}>
              <Text className={styles.modalTitle}>创建测试场次</Text>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>场次名称</Text>
                <Input
                  className={styles.formInput}
                  placeholder="例如：第三章·地下室回声内测 v2"
                  placeholderStyle="color: #6B7280"
                  value={formData.name}
                  onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>关卡来源</Text>
                <View className={styles.levelModeTabs}>
                  <View
                    className={classnames(styles.levelModeTab, levelMode === 'existing' && styles.active)}
                    onClick={() => setLevelMode('existing')}
                  >
                    <Text className={classnames(styles.levelModeTabText, levelMode === 'existing' && styles.active)}>
                      已有关卡（新版本）
                    </Text>
                  </View>
                  <View
                    className={classnames(styles.levelModeTab, levelMode === 'new' && styles.active)}
                    onClick={() => setLevelMode('new')}
                  >
                    <Text className={classnames(styles.levelModeTabText, levelMode === 'new' && styles.active)}>
                      新建关卡
                    </Text>
                  </View>
                </View>

                {levelMode === 'existing' && (
                  <View>
                    {allLevels.length === 0 ? (
                      <Text style={{ fontSize: 26, color: '#6B7280' }}>暂未创建关卡，请切换到"新建关卡"</Text>
                    ) : (
                      <View className={styles.existingLevelList}>
                        {allLevels.map(level => (
                          <View
                            key={level.id}
                            className={classnames(styles.existingLevelItem, selectedExistingLevelId === level.id && styles.active)}
                            onClick={() => handleSelectExistingLevel(level.id)}
                          >
                            <View>
                              <Text className={styles.existingLevelName}>{level.name}</Text>
                              <Text className={styles.existingLevelMeta}>
                                共 {level.sessionCount} 次测试 · 当前最高版本 v{level.lastVersion}
                              </Text>
                            </View>
                            <View className={classnames(styles.existingLevelBadge, selectedExistingLevelId === level.id && styles.active)}>
                              {selectedExistingLevelId === level.id ? '✓ 已选' : '点击选择'}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                    {selectedLevel && (
                      <View className={styles.versionInfo}>
                        <Text className={styles.versionInfoText}>
                          ✓ 已选「{selectedLevel.name}」，将创建为 v{nextVersion}（前一版本为 v{selectedLevel.lastVersion}）
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {levelMode === 'new' && (
                  <View>
                    <Input
                      className={styles.formInput}
                      placeholder="例如：第三章：地下室回声"
                      placeholderStyle="color: #6B7280"
                      value={formData.levelName}
                      onInput={(e) => setFormData({ ...formData, levelName: e.detail.value })}
                    />
                    <View className={styles.versionInfo}>
                      <Text className={styles.versionInfoText}>
                        ✓ 新关卡将创建为 v1
                      </Text>
                    </View>
                  </View>
                )}

                <Text className={styles.formLabel} style={{ marginTop: 16 }}>测试批次（可选）</Text>
                <Input
                  className={styles.batchInput}
                  placeholder="例如：初始版本 / 优化版本 / Bug修复版"
                  placeholderStyle="color: #6B7280"
                  value={formData.batch}
                  onInput={(e) => setFormData({ ...formData, batch: e.detail.value })}
                />
              </View>

              <View className={styles.playersSection}>
                <View className={styles.playersHeader}>
                  <Text className={styles.playersLabel}>内测玩家（姓名 + 编号）</Text>
                  <Text className={styles.playersCount}>
                    {playerDrafts.filter(p => p.name && p.code).length} 位已填写
                  </Text>
                </View>

                {playerDrafts.map((player, idx) => (
                  <View key={player.key} className={styles.playerRow}>
                    <Input
                      className={styles.playerInput}
                      placeholder={`玩家${idx + 1}姓名`}
                      placeholderStyle="color: #6B7280"
                      value={player.name}
                      onInput={(e) => handleUpdatePlayer(player.key, 'name', e.detail.value)}
                    />
                    <Input
                      className={styles.playerInput}
                      placeholder={`编号`}
                      placeholderStyle="color: #6B7280"
                      value={player.code}
                      onInput={(e) => handleUpdatePlayer(player.key, 'code', e.detail.value)}
                    />
                    <View
                      className={styles.removePlayerBtn}
                      onClick={() => handleRemovePlayer(player.key)}
                    >
                      <Text className={styles.removePlayerText}>×</Text>
                    </View>
                  </View>
                ))}

                <View className={styles.addPlayerBtn} onClick={handleAddPlayer}>
                  <Text className={styles.addPlayerText}>+ 再加一位玩家</Text>
                </View>
              </View>

              <View className={styles.clueCardsSection}>
                <View className={styles.clueCardsHeader}>
                  <Text className={styles.clueCardsLabel}>本关档案卡</Text>
                  <Text className={styles.clueCardsCount}>{selectedCardIds.length} 张已选</Text>
                </View>
                <View className={styles.clueCardsGrid}>
                  {mockClueCards.map(card => (
                    <View
                      key={card.id}
                      className={classnames(
                        styles.clueCardChip,
                        selectedCardIds.includes(card.id) && styles.active
                      )}
                      onClick={() => handleToggleCard(card.id)}
                    >
                      <Text className={classnames(
                        styles.clueCardChipText,
                        selectedCardIds.includes(card.id) && styles.active
                      )}>
                        {card.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.modalFooter}>
                <View className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  <Text className={styles.cancelBtnText}>取消</Text>
                </View>
                <View className={styles.confirmBtn} onClick={handleSubmit}>
                  <Text className={styles.confirmBtnText}>确认创建</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default SessionsPage;
