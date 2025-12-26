
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, type DocumentData, type Query } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

// A custom hook to memoize a Firestore query
function useMemoizedQuery(queryOrPath: string | Query<DocumentData> | null): Query<DocumentData> | null {
    const { firestore } = useFirestore();

    const queryMemo = useMemo(() => {
        if (!firestore || !queryOrPath) return null;

        if (typeof queryOrPath === 'string') {
            return query(collection(firestore, queryOrPath));
        }
        return queryOrPath;
    }, [firestore, queryOrPath]);

    return queryMemo;
}

export function useCollection<T extends { id: string }>(pathOrQuery: string | Query<DocumentData> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedQuery = useMemoizedQuery(pathOrQuery);

  useEffect(() => {
    if (!memoizedQuery) {
        setLoading(false);
        setData([]);
        return;
    }
    
    setLoading(true);
    
    const unsubscribe = onSnapshot(memoizedQuery, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          return { id: doc.id, ...docData } as T
      });
      setData(documents);
      setLoading(false);
      setError(null);
    }, 
    (err) => {
      console.error("useCollection error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, [memoizedQuery]);

  return { data, loading, error };
}
