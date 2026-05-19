import { useState, useEffect, useMemo } from 'react';

export function usePagination<T>(items: T[], pageSize = 50) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const paged = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { paged, page, setPage, totalPages, pageSize };
}
