import React from 'react';
import '../../styles/Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  maxVisiblePages = 10
}) => {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // 페이지 번호 범위 계산
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // startPage 조정 (끝에서 maxVisiblePages 개수가 안 되는 경우)
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="admin-pagination">
      {/* 페이지 네비게이션 */}
      <div className="admin-pagination-nav">
        {/* 맨 처음 */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="admin-pagination-btn"
          title="맨 처음"
        >
          맨 처음
        </button>

        {/* 이전 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="admin-pagination-btn"
          title="이전"
        >
          &lt;
        </button>

        {/* 페이지 번호들 */}
        {pageNumbers.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => {
              console.log(`Pagination button clicked: ${pageNum}, current: ${currentPage}`);
              onPageChange(pageNum);
            }}
            className={`admin-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
          >
            {pageNum}
          </button>
        ))}

        {/* 다음 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="admin-pagination-btn"
          title="다음"
        >
          &gt;
        </button>

        {/* 맨 끝 */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="admin-pagination-btn"
          title="맨 끝"
        >
          맨 끝
        </button>
      </div>

      {/* 페이지 정보 */}
      <div className="admin-pagination-info">
        {startIndex + 1}-{endIndex} / 전체 {totalItems}개
      </div>
    </div>
  );
};

export default Pagination;