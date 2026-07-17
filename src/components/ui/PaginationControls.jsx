import React from 'react';
import { Button } from './Button';

export const PaginationControls = ({ currentPage, totalPages, onPageChange, theme = 'light' }) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page === '...' || page === currentPage) return;
    onPageChange(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (theme === 'dark') {
    return (
      <div className="flex justify-end mt-4">
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="bg-gray-900 text-white hover:bg-gray-800 transition-colors border-0"
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1 mx-2">
            {getPageNumbers().map((page, idx) => (
              <button
                key={idx}
                onClick={() => handlePageChange(page)}
                disabled={page === '...'}
                className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-colors ${
                  page === '...' ? 'cursor-default text-gray-500 bg-transparent' :
                  currentPage === page 
                    ? 'bg-gray-900 text-white font-medium hover:bg-gray-800' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-gray-900 text-white hover:bg-gray-800 transition-colors border-0"
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <Button
              key={`ellipsis-${idx}`}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-default"
              disabled
            >
              ...
            </Button>
          ) : (
            <Button
              key={idx}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          )
        ))}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};
