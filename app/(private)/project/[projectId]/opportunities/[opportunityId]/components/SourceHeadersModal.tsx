import { SourceItem } from '@/libs/database/Sources/types';
import { PageHeading } from '@/libs/utils/urlAnalysis';
import { DialogTrigger as AriaDialogTrigger } from 'react-aria-components';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { CloseButton } from '@/components/base/buttons/close-button';
import { CopyButton } from '@/app/(private)/components/CopyButton';
import { LinkExternal01 } from '@untitledui/icons';
import { SourceHeadingsList } from '../../../sources/components/SourceHeadingsList';

const headingsToMarkdown = (headings: PageHeading[]) =>
  headings.map((h) => `${h.tag.toUpperCase()}: ${h.text}`).join('\n');

export const SourceHeadersModal = ({
  source,
  isOpen,
  setIsOpen,
}: {
  source: SourceItem;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const headings = source.headings ?? [];

  return (
    <AriaDialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <ModalOverlay isDismissable>
        <Modal className="max-w-xl">
          <Dialog>
            <div className="bg-primary relative flex w-full flex-col overflow-hidden rounded-2xl shadow-xl">
              <CloseButton
                onClick={() => setIsOpen(false)}
                theme="light"
                size="lg"
                className="absolute top-3 right-3 z-10"
              />

              <div className="flex flex-col gap-4 p-6">
                <div className="flex flex-col gap-1 pr-8">
                  <p className="text-tertiary text-xs font-semibold tracking-wide uppercase">
                    Headers structure
                  </p>
                  <h2 className="text-primary line-clamp-1 text-lg font-semibold">
                    {source.title ?? source.cleanUrl}
                  </h2>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-tertiary hover:text-secondary flex items-center gap-1 text-xs transition-colors"
                  >
                    {source.cleanUrl}
                    <LinkExternal01 className="size-3" />
                  </a>
                </div>

                {headings.length ? (
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <CopyButton text={headingsToMarkdown(headings)} />
                    </div>
                    <SourceHeadingsList headings={headings} className="max-h-96 overflow-y-auto" />
                  </div>
                ) : (
                  <p className="text-tertiary text-sm">No headings found for this source.</p>
                )}
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </AriaDialogTrigger>
  );
};
