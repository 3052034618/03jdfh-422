import { PlayerFeedback, ClueGroup, ConfusionEntry } from '@/types';

const generateGroups = (seed: number): ClueGroup[] => {
  const baseGroups: ClueGroup[][] = [
    [
      { id: 'g1', cardIds: ['card-001', 'card-002', 'card-003'], status: 'certain', note: '这三个明显是一条线的' },
      { id: 'g2', cardIds: ['card-005', 'card-009'], status: 'suspicious' },
      { id: 'g3', cardIds: ['card-006', 'card-010'], status: 'certain' }
    ],
    [
      { id: 'g1', cardIds: ['card-001', 'card-002'], status: 'suspicious' },
      { id: 'g2', cardIds: ['card-003', 'card-005', 'card-006'], status: 'certain' },
      { id: 'g3', cardIds: ['card-004', 'card-007'], status: 'confused' }
    ],
    [
      { id: 'g1', cardIds: ['card-001', 'card-003', 'card-010'], status: 'certain' },
      { id: 'g2', cardIds: ['card-002', 'card-005', 'card-009'], status: 'suspicious' },
      { id: 'g3', cardIds: ['card-008'], status: 'confused', note: '这个视频是什么意思？' }
    ],
    [
      { id: 'g1', cardIds: ['card-001', 'card-002', 'card-003', 'card-006'], status: 'certain' },
      { id: 'g2', cardIds: ['card-005', 'card-009', 'card-010'], status: 'suspicious' },
      { id: 'g3', cardIds: ['card-004', 'card-007', 'card-008'], status: 'confused' }
    ]
  ];
  return baseGroups[seed % baseGroups.length];
};

const generateConfusions = (seed: number): ConfusionEntry[] => {
  const allConfusions: ConfusionEntry[][] = [
    [
      { id: 'c1', cardId: 'card-008', content: '完全没看懂这个手机视频想表达什么，和主线有关系吗？' },
      { id: 'c2', cardId: 'card-004', content: '生锈钥匙到底开哪个门？游戏里没找到对应的锁。' }
    ],
    [
      { id: 'c1', cardId: 'card-007', content: '破碎药瓶为什么反复出现？是想暗示护士有问题吗？' },
      { id: 'c2', cardId: 'card-002', content: '录音里的低语听不清，能不能加字幕？' }
    ],
    [
      { id: 'c1', cardId: 'card-010', content: '"红鞋子"童谣是什么意思？和儿童画里的女孩有关系吗？' },
      { id: 'c2', cardId: 'card-009', content: '院长照片背面写的"她"是谁？是护士还是那个戴面具的女人？' },
      { id: 'c3', cardId: 'card-004', content: '这把钥匙感觉完全没用上，是不是假线索？' }
    ],
    [
      { id: 'c1', cardId: 'card-008', content: '走廊鬼影和主线剧情有什么关联？感觉是纯jump scare。' },
      { id: 'c2', cardId: 'card-007', content: '镇定剂药瓶的出现时机很奇怪，是想误导玩家吗？' }
    ]
  ];
  return allConfusions[seed % allConfusions.length];
};

const playerNames = ['玩家A', '玩家B', '玩家C', '玩家D', '玩家E', '内测玩家01', '内测玩家02', '内测玩家03', '内测玩家04', '玩家Alpha', '玩家Beta', '玩家Gamma'];

export const mockFeedbacks: PlayerFeedback[] = [
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `fb-s1-${i}`,
    sessionId: 'session-001',
    playerId: `p-00${i + 1}`,
    playerName: playerNames[i],
    groups: generateGroups(i),
    confusions: generateConfusions(i),
    submittedAt: `2026-06-18T${15 + i}:${10 + i * 5}:00Z`
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `fb-s2-${i}`,
    sessionId: 'session-002',
    playerId: `p-10${i + 1}`,
    playerName: playerNames[5 + i],
    groups: generateGroups(i + 1),
    confusions: generateConfusions(i + 1),
    submittedAt: `2026-06-15T${11 + i}:00:00Z`
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `fb-s3-${i}`,
    sessionId: 'session-003',
    playerId: `p-20${i + 1}`,
    playerName: playerNames[9 + i],
    groups: generateGroups(i + 2),
    confusions: generateConfusions(i + 2),
    submittedAt: `2026-06-10T${10 + i}:30:00Z`
  }))
];

export const getFeedbacksBySessionId = (sessionId: string): PlayerFeedback[] => {
  return mockFeedbacks.filter(f => f.sessionId === sessionId);
};
