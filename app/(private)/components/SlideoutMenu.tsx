import { Placeholder } from '@untitledui/icons';
import { SlideoutMenu as SlideoutMenuComponent } from '@/components/application/slideout-menus/slideout-menu';
import { Button } from '@/components/base/buttons/button';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

export interface SlideoutMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const SlideoutMenu = ({
  isOpen,
  setIsOpen,
  title,
  description,
  icon,
  isLoading,
  action,
  actionTitle,
  closeTitle,
  content,
  footerAction,
  footerActionLabel,
  footerActionLoading,
}: SlideoutMenuProps & {
  title: string;
  description: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  action?: () => void;
  actionTitle?: string;
  closeTitle?: string;
  content: React.ReactNode;
  footerAction?: () => void;
  footerActionLabel?: string;
  footerActionLoading?: boolean;
}) => {
  return (
    <SlideoutMenuComponent.Trigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <SlideoutMenuComponent isDismissable>
        <SlideoutMenuComponent.Header
          onClose={() => setIsOpen(false)}
          className="relative flex w-full items-start gap-4 px-4 pt-6 md:px-6"
        >
          <FeaturedIcon size="md" color="gray" theme="modern" icon={icon ?? Placeholder} />

          <section className="flex flex-col gap-0.5">
            <h1 className="text-md text-primary font-semibold md:text-lg">{title}</h1>
            <p className="text-tertiary text-sm">{description}</p>
          </section>
        </SlideoutMenuComponent.Header>

        <SlideoutMenuComponent.Content>{content}</SlideoutMenuComponent.Content>

        <SlideoutMenuComponent.Footer className="flex w-full justify-end gap-3">
          <Button
            size="md"
            color="secondary"
            onClick={footerAction && footerActionLabel ? footerAction : () => setIsOpen(false)}
            isDisabled={footerActionLoading}
          >
            {footerActionLoading ? (
              <LoadingIndicator size="xs" />
            ) : (
              footerActionLabel ?? closeTitle ?? 'Cancel'
            )}
          </Button>
          {!!actionTitle && (
            <Button size="md" onClick={action} disabled={isLoading}>
              {isLoading ? <LoadingIndicator size="xs" /> : actionTitle}
            </Button>
          )}
        </SlideoutMenuComponent.Footer>
      </SlideoutMenuComponent>
    </SlideoutMenuComponent.Trigger>
  );
};
