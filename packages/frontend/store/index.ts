import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Poll, Candidate } from "@/utils/interfaces";

interface GlobalState {
  candidates: Candidate[];
  poll: Poll | null;
  regModal: string;
  setCandidates: (candidates: Candidate[]) => void;
  setPoll: (poll: Poll) => void;
  setRegModal: (value: string) => void;
}

export const useStore = create<GlobalState>()(
  devtools((set) => ({
    candidates: [],
    poll: null,
    regModal: "",
    setCandidates: (candidates) => set({ candidates }),
    setPoll: (poll) => set({ poll }),
    setRegModal: (value) => set({ regModal: value }),
  }))
);
