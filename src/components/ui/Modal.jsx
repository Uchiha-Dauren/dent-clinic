import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  returnFocusRef,
}) {
  const { t } = useT();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal-content"
          onCloseAutoFocus={(e) => {
            if (returnFocusRef?.current) {
              e.preventDefault();
              returnFocusRef.current.focus();
            }
          }}
        >
          <Dialog.Close className="icon-button modal-close" aria-label={t('common.close')}>
            <X size={21} />
          </Dialog.Close>
          <Dialog.Title className="modal-title">{title}</Dialog.Title>
          <Dialog.Description className="modal-description">{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
