import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

let cachedTitles: Record<string, string> | null = null;
let isFetching = false;
let fetchPromise: Promise<void> | null = null;

export function useItemTitles() {
  const [itemTitles, setItemTitles] = useState<Record<string, string>>(cachedTitles || {});

  useEffect(() => {
    if (cachedTitles) return;

    const fetchTitles = async () => {
      try {
        const [exams, liveTests, tests, subjects, studyMaterials] = await Promise.all([
          getDocs(collection(db, 'exams')),
          getDocs(collection(db, 'liveTests')),
          getDocs(collection(db, 'tests')),
          getDocs(collection(db, 'subjects')),
          getDocs(collection(db, 'study_material'))
        ]);

        const map: Record<string, string> = {};
        exams.forEach(doc => map[doc.id] = doc.data().title || doc.data().name);
        liveTests.forEach(doc => map[doc.id] = doc.data().title || doc.data().name);
        tests.forEach(doc => map[doc.id] = doc.data().title || doc.data().name);
        subjects.forEach(doc => map[doc.id] = doc.data().title || doc.data().name);
        studyMaterials.forEach(doc => map[doc.id] = doc.data().title || doc.data().name);

        cachedTitles = map;
        setItemTitles(map);
      } catch (error) {
        console.error("Failed to fetch item titles for lookup:", error);
      } finally {
        isFetching = false;
      }
    };

    if (!isFetching) {
      isFetching = true;
      fetchPromise = fetchTitles();
    } else if (fetchPromise) {
      fetchPromise.then(() => {
        if (cachedTitles) setItemTitles({...cachedTitles});
      });
    }

  }, []);

  const getItemTitle = (id: string | null | undefined, fallback: string | undefined) => {
    if (id === "PREMIUM_PASS") return "Premium Pass";
    if (!id) return fallback || 'Unknown Item';
    
    const foundTitle = itemTitles[id];
    if (foundTitle) return foundTitle;
    
    // Fallbacks if not found
    if (fallback && fallback !== "Exam Purchase" && fallback !== "Purchase") return fallback;
    return id; // worst case, show the ID
  };

  return { itemTitles, getItemTitle };
}
