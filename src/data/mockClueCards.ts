import { ClueCard } from '@/types';

export const mockClueCards: ClueCard[] = [
  {
    id: 'card-001',
    name: '儿童画',
    category: '物证',
    description: '地下室发现的蜡笔画，画着戴面具的女人',
    isTrueClue: true
  },
  {
    id: 'card-002',
    name: '地下室录音',
    category: '音频',
    description: '断续的摇篮曲，夹杂低语声',
    isTrueClue: true
  },
  {
    id: 'card-003',
    name: '护士日记',
    category: '文档',
    description: '记载着失踪儿童的治疗记录',
    isTrueClue: true
  },
  {
    id: 'card-004',
    name: '生锈钥匙',
    category: '物证',
    description: '旧诊所三楼储物柜的钥匙',
    isTrueClue: false
  },
  {
    id: 'card-005',
    name: '保安证词',
    category: '证词',
    description: '"那晚我看见院长进了地下室"',
    isTrueClue: true
  },
  {
    id: 'card-006',
    name: '旧报纸剪报',
    category: '文档',
    description: '20年前孤儿院火灾的新闻报道',
    isTrueClue: true
  },
  {
    id: 'card-007',
    name: '破碎药瓶',
    category: '物证',
    description: '标签模糊的镇定剂药瓶碎片',
    isTrueClue: false
  },
  {
    id: 'card-008',
    name: '手机视频',
    category: '视频',
    description: '玩家录制的走廊鬼影片段',
    isTrueClue: false
  },
  {
    id: 'card-009',
    name: '院长照片',
    category: '照片',
    description: '背面写着"她知道真相"',
    isTrueClue: true
  },
  {
    id: 'card-010',
    name: '童谣歌词',
    category: '文档',
    description: '手写的残缺童谣，提及"红鞋子"',
    isTrueClue: true
  }
];

export const getClueCardById = (id: string): ClueCard | undefined => {
  return mockClueCards.find(card => card.id === id);
};
