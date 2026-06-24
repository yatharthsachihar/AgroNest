import Modal from "./Modal";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <div className="confirm-dialog">

        <p>
          {description}
        </p>

        <div className="confirm-actions">

          <button
            className="btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn-delete"
            onClick={onConfirm}
          >
            Confirm
          </button>

        </div>

      </div>
    </Modal>
  );
}