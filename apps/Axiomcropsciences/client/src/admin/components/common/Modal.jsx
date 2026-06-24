import { createPortal } from "react-dom";
import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children
}) {
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const mainEl = document.querySelector(".admin-main main");
      const originalMainOverflow = mainEl ? mainEl.style.overflowY : "";
      if (mainEl) {
        mainEl.style.overflowY = "hidden";
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (mainEl) {
          mainEl.style.overflowY = originalMainOverflow;
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const target = document.querySelector(".admin-layout") || document.body;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>

          <button
            className="btn-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    target
  );
}