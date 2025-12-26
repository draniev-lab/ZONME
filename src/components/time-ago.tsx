
"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimeAgoProps {
  date: Date | undefined;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (date) {
      setTimeAgo(formatDistanceToNow(date, { addSuffix: true, locale: fr }));
    }
  }, [date]);

  if (!date) {
    return null;
  }

  return (
    <p className={className}>
      {timeAgo}
    </p>
  );
}
