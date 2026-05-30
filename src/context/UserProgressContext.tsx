// src/context/UserProgressContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { subscribeToUserStats, updateUserStreak } from "@/lib/db";

interface UserProgress {
  streak: number;
  lastRescueDate: string;
}

interface UserProgressContextProps extends UserProgress {
  incrementStreak: () => void;
  resetStreak: () => void;
}

const defaultProgress: UserProgress = {
  streak: 0,
  lastRescueDate: "",
};

const UserProgressContext = createContext<UserProgressContextProps>({
  ...defaultProgress,
  incrementStreak: () => {},
  resetStreak: () => {},
});

export const UserProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<number>(0);
  const [lastRescueDate, setLastRescueDate] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setStreak(0);
      setLastRescueDate("");
      return;
    }
    const unsubscribe = subscribeToUserStats(user.uid, (stats) => {
      if (stats) {
        setStreak(stats.streak || 0);
        setLastRescueDate(stats.lastRescueDate || "");
      }
    });
    return () => unsubscribe();
  }, [user]);

  const incrementStreak = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    if (lastRescueDate === today) {
      return;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const newStreak = lastRescueDate === yesterdayStr ? streak + 1 : 1;
    
    // Determine tier
    let tier = "Newbie";
    if (newStreak >= 30) tier = "Elite Forest";
    else if (newStreak >= 15) tier = "Sprout";
    else if (newStreak >= 5) tier = "Seed";

    // Optimistic update
    setStreak(newStreak);
    setLastRescueDate(today);

    // Sync to Firestore
    await updateUserStreak(user.uid, newStreak, today, tier);
  };

  const resetStreak = async () => {
    if (!user) return;
    setStreak(0);
    setLastRescueDate("");
    await updateUserStreak(user.uid, 0, "", "Newbie");
  };

  return (
    <UserProgressContext.Provider value={{ streak, lastRescueDate, incrementStreak, resetStreak }}>
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = () => useContext(UserProgressContext);
