import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  currentItems: T[];
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  handlePageChange: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePagination<T>({
  items,
  itemsPerPage,
  initialPage = 1
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const paginationData = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);
    
    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      currentItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [items, itemsPerPage, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(paginationData.totalPages);
  const goToNextPage = () => handlePageChange(currentPage + 1);
  const goToPrevPage = () => handlePageChange(currentPage - 1);

  return {
    currentPage,
    totalPages: paginationData.totalPages,
    totalItems: paginationData.totalItems,
    currentItems: paginationData.currentItems,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    setCurrentPage,
    handlePageChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage: paginationData.hasNextPage,
    hasPrevPage: paginationData.hasPrevPage
  };
}

export default usePagination;