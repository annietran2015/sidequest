import { create } from 'zustand';
import type { Quest, QuestStatus } from '@/types';

interface QuestState {
  activeQuests: Quest[]; // Incoming quests where user is recipient
  sentQuests: Quest[];   // Quests sent by user
  questLog: Quest[];     // All historical quests (completed, missed, cancelled)
  setActiveQuests: (quests: Quest[]) => void;
  setSentQuests: (quests: Quest[]) => void;
  setQuestLog: (quests: Quest[]) => void;
  addQuest: (quest: Quest) => void;
  updateQuestStatus: (questId: string, status: QuestStatus) => void;
  removeActiveQuest: (questId: string) => void;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  activeQuests: [],
  sentQuests: [],
  questLog: [],

  setActiveQuests: (quests) => {
    set({ activeQuests: quests });
  },

  setSentQuests: (quests) => {
    set({ sentQuests: quests });
  },

  setQuestLog: (quests) => {
    set({ questLog: quests });
  },

  addQuest: (quest) => {
    set((state) => ({
      sentQuests: [quest, ...state.sentQuests],
    }));
  },

  updateQuestStatus: (questId, status) => {
    const updateInArray = (arr: Quest[]): Quest[] =>
      arr.map((q) => (q.id === questId ? { ...q, status } : q));

    set((state) => {
      const updatedActive = updateInArray(state.activeQuests);
      const updatedSent = updateInArray(state.sentQuests);

      // If status is terminal, move from active to log
      const isTerminal = status === 'completed' || status === 'missed' || status === 'cancelled';
      const movedToLog = isTerminal
        ? updatedActive.filter((q) => q.id === questId)
        : [];
      const filteredActive = isTerminal
        ? updatedActive.filter((q) => q.id !== questId)
        : updatedActive;

      const updatedLog = isTerminal
        ? [
            ...movedToLog.map((q) => ({ ...q, status })),
            ...updateInArray(state.questLog),
          ]
        : updateInArray(state.questLog);

      return {
        activeQuests: filteredActive,
        sentQuests: updatedSent,
        questLog: updatedLog,
      };
    });
  },

  removeActiveQuest: (questId) => {
    set((state) => ({
      activeQuests: state.activeQuests.filter((q) => q.id !== questId),
    }));
  },
}));
