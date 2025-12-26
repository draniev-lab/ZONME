
"use client";

import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, type DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

// Custom hook to memoize DocumentReference
function useMemoizedDocRef(collectionName: string, docId?: string | null): DocumentReference | null {
    const { firestore } = useFirestore();

    const docRefMemo = useMemo(() => {
        if (!firestore || !collectionName || !docId) return null;
        return doc(firestore, collectionName, docId);
    }, [firestore, collectionName, docId]);

    return docRefMemo;
}


export function useDoc<T>(collectionName: string, docId?: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedDocRef = useMemoizedDocRef(collectionName, docId);

  useEffect(() => {
    if (!memoizedDocRef) {
        setLoading(false);
        setData(null);
        return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(memoizedDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
      // Create and emit a detailed permission error
      const permissionError = new FirestorePermissionError({
        path: memoizedDocRef.path,
        operation: 'get', // onSnapshot is a 'get' or 'listen' operation
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();

  }, [memoizedDocRef]);

  return { data, loading, error };
}
