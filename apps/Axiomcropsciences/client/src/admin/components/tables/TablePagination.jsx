import {
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";

export default function TablePagination({
  page = 1,
  totalPages = 1,
  onPrevious,
  onNext
}) {
  return (
    <div className="table-pagination">

      <button
        onClick={onPrevious}
        disabled={page === 1}
      >
        <FiChevronLeft />
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={page === totalPages}
      >
        <FiChevronRight />
      </button>

    </div>
  );
}