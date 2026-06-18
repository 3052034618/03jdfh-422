import { TestSession } from '@/types';

export const mockSessions: TestSession[] = [
  {
    id: 'session-001',
    name: '第三章·地下室回声内测',
    levelName: '第三章：地下室回声',
    levelId: 'level-003',
    createdAt: '2026-06-18T14:30:00Z',
    createdBy: '测试员小王',
    status: 'active',
    players: [
      { id: 'p-001', name: '玩家A', code: 'P001', hasSubmitted: true },
      { id: 'p-002', name: '玩家B', code: 'P002', hasSubmitted: true },
      { id: 'p-003', name: '玩家C', code: 'P003', hasSubmitted: true },
      { id: 'p-004', name: '玩家D', code: 'P004', hasSubmitted: false },
      { id: 'p-005', name: '玩家E', code: 'P005', hasSubmitted: true }
    ],
    clueCardIds: ['card-001', 'card-002', 'card-003', 'card-004', 'card-005', 'card-006', 'card-007', 'card-008', 'card-009', 'card-010']
  },
  {
    id: 'session-002',
    name: '第二章·废弃诊所测试',
    levelName: '第二章：废弃诊所',
    levelId: 'level-002',
    createdAt: '2026-06-15T10:00:00Z',
    createdBy: '测试员小李',
    status: 'completed',
    players: [
      { id: 'p-101', name: '内测玩家01', code: 'T101', hasSubmitted: true },
      { id: 'p-102', name: '内测玩家02', code: 'T102', hasSubmitted: true },
      { id: 'p-103', name: '内测玩家03', code: 'T103', hasSubmitted: true },
      { id: 'p-104', name: '内测玩家04', code: 'T104', hasSubmitted: true }
    ],
    clueCardIds: ['card-001', 'card-002', 'card-003', 'card-005', 'card-006', 'card-009', 'card-010']
  },
  {
    id: 'session-003',
    name: '第一章·红鞋子试玩',
    levelName: '第一章：红鞋子',
    levelId: 'level-001',
    createdAt: '2026-06-10T09:00:00Z',
    createdBy: '测试员小王',
    status: 'completed',
    players: [
      { id: 'p-201', name: '玩家Alpha', code: 'A001', hasSubmitted: true },
      { id: 'p-202', name: '玩家Beta', code: 'A002', hasSubmitted: true },
      { id: 'p-203', name: '玩家Gamma', code: 'A003', hasSubmitted: true }
    ],
    clueCardIds: ['card-001', 'card-003', 'card-006', 'card-009', 'card-010']
  },
  {
    id: 'session-004',
    name: '新章节·院长办公室（待测试）',
    levelName: '第四章：院长办公室',
    levelId: 'level-004',
    createdAt: '2026-06-19T08:00:00Z',
    createdBy: '测试员小张',
    status: 'draft',
    players: [],
    clueCardIds: []
  }
];

export const getSessionById = (id: string): TestSession | undefined => {
  return mockSessions.find(s => s.id === id);
};
