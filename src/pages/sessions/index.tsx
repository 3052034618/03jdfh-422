import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import SessionCard from '@/components/SessionCard';
import { mockSessions } from '@/data/mockSessions';
import { TestSession } from '@/types';

type FilterType = 'all' | 'active' | 'completed' | 'draft';

const SessionsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    levelName: ''
  });

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return mockSessions;
    return mockSessions.filter(s => s.status === filter);
  }, [filter]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '进行中' },
    { key: 'completed', label: '已完成' },
    { key: 'draft', label: '草稿' }
  ];

  const handleCreate = () => {
    console.log('[SessionsPage] Open create modal');
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.levelName.trim()) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    const newSession: TestSession = {
      id: `session-${Date.now()}`,
      name: formData.name,
      levelName: formData.levelName,
      levelId: `level-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: '当前测试员',
      status: 'draft',
      players: [],
      clueCardIds: []
    };
    console.log('[SessionsPage] Create session:', newSession);
    Taro.showToast({ title: '创建成功', icon: 'success' });
    setShowModal(false);
    setFormData({ name: '', levelName: '' });
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
            <Text className={styles.modalTitle}>创建测试场次</Text>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>场次名称</Text>
              <Input
                className={styles.formInput}
                placeholder="例如：第三章·地下室回声内测"
                placeholderStyle="color: #6B7280"
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>关卡名称</Text>
              <Input
                className={styles.formInput}
                placeholder="例如：第三章：地下室回声"
                placeholderStyle="color: #6B7280"
                value={formData.levelName}
                onInput={(e) => setFormData({ ...formData, levelName: e.detail.value })}
              />
            </View>

            <View className={styles.modalFooter}>
              <View className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                <Text className={styles.cancelBtnText}>取消</Text>
              </View>
              <View className={styles.confirmBtn} onClick={handleSubmit}>
                <Text className={styles.confirmBtnText}>确认创建</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default SessionsPage;
