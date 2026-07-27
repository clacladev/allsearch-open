import { CheckCircle, Trash01 } from '@untitledui/icons';
import { DialogTrigger as AriaDialogTrigger, Heading as AriaHeading } from 'react-aria-components';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { CloseButton } from '@/components/base/buttons/close-button';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import { BackgroundPattern } from '@/components/shared-assets/background-patterns';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

type Variant = 'delete' | 'archive' | 'confirm';

export interface ModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function ConfirmModal({
  isOpen,
  setIsOpen,
  variant,
  title,
  description,
  isLoading,
  action,
  actionLabel,
}: ModalProps & {
  variant: Variant;
  title: string;
  description: string;
  isLoading: boolean;
  action: () => void;
  /** Override for the primary action button label. Defaults to the variant's noun. */
  actionLabel?: string;
}) {
  return (
    <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <ModalOverlay isDismissable>
        <Modal>
          <Dialog>
            <div className="bg-primary relative w-full overflow-hidden rounded-2xl shadow-xl sm:max-w-100">
              <CloseButton
                onClick={() => setIsOpen(false)}
                theme="light"
                size="lg"
                className="absolute top-3 right-3"
              />
              <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
                <div className="relative w-max">
                  {variant === 'delete' || variant === 'archive' ? (
                    <FeaturedIcon color="error" size="lg" theme="light" icon={Trash01} />
                  ) : variant === 'confirm' ? (
                    <FeaturedIcon color="success" size="lg" theme="light" icon={CheckCircle} />
                  ) : null}

                  <BackgroundPattern
                    pattern="circle"
                    size="sm"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                </div>
                <div className="z-10 flex flex-col gap-0.5">
                  <AriaHeading slot="title" className="text-md text-primary font-semibold">
                    {title}
                  </AriaHeading>
                  <p className="text-tertiary text-sm">{description}</p>
                </div>
              </div>
              <div className="z-10 flex flex-1 flex-col-reverse gap-3 p-4 pt-6 *:grow sm:grid sm:grid-cols-2 sm:px-6 sm:pt-8 sm:pb-6">
                <Button color="secondary" size="lg" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button color="primary-destructive" size="lg" onClick={action} disabled={isLoading}>
                  {isLoading ? (
                    <LoadingIndicator size="xs" color="error" />
                  ) : actionLabel ? (
                    actionLabel
                  ) : variant === 'delete' ? (
                    'Delete'
                  ) : variant === 'archive' ? (
                    'Archive'
                  ) : variant === 'confirm' ? (
                    'Confirm'
                  ) : null}
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </AriaDialogTrigger>
  );
}
