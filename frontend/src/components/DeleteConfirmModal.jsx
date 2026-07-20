import React from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

export default function DeleteConfirmModal({
  title = 'Delete item?',
  message = 'This action cannot be undone.',
  itemLabel = 'Selected item',
  itemName = 'Untitled item',
  itemMeta,
  note,
  cancelLabel = 'Cancel',
  confirmLabel = 'Delete',
  busy = false,
  onCancel,
  onConfirm,
}) {
  const modal = (
    <div className="delete-modal-overlay" role="presentation" onMouseDown={() => !busy && onCancel?.()}>
      <div
        className="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="delete-modal-header">
          <div className="delete-modal-icon">
            <Icon name="alertTriangle" size={18} strokeWidth={2.1} />
          </div>
          <div className="delete-modal-copy">
            <h3 id="delete-modal-title">{title}</h3>
            <p>{message}</p>
          </div>
        </div>

        <div className="delete-modal-body">
          <div className="delete-modal-summary">
            <div className="delete-modal-summary-label">{itemLabel}</div>
            <div className="delete-modal-summary-name">{itemName || 'Untitled item'}</div>
            {itemMeta && <div className="delete-modal-summary-meta">{itemMeta}</div>}
          </div>
          {note && <div className="delete-modal-note">{note}</div>}
        </div>

        <div className="delete-modal-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}
