import Button from "../../../components/common/Button";

export default function ProductBulkActions({
  selectedRows = 0
}) {
  if (!selectedRows) return null;

  return (
    <div className="bulk-actions">

      <span>
        {selectedRows} Selected
      </span>

      <div className="bulk-actions-buttons">

        <Button variant="secondary">
          Activate
        </Button>

        <Button variant="secondary">
          Deactivate
        </Button>

        <Button variant="danger">
          Delete
        </Button>

      </div>

    </div>
  );
}