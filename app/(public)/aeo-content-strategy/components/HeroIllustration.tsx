import { cx } from '@/utils/cx';
import { Feather, MessageTextCircle02, Tool01 } from '@untitledui/icons';
import { ChatbotLogoImage } from '@/app/(private)/project/[projectId]/components/ChatbotLogoImage';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';

type LogoId = 'google' | 'chatgpt' | 'perplexity';

const LOGO_TO_CHATBOT_ID: Record<LogoId, ChatbotId> = {
  google: ChatbotId.GoogleAIOverview,
  chatgpt: ChatbotId.ChatGPT,
  perplexity: ChatbotId.Perplexity,
};

const PlaceholderLogo = ({ className }: { className?: string }) => (
  <div
    className={cx('flex shrink-0 items-center justify-center rounded-full bg-gray-600', className)}
  >
    <div className="size-1/2 rounded-full bg-gray-400" />
  </div>
);

type StatCardProps = {
  title: string;
  count: number;
  countDelta: number;
  pages: number;
  pagesDelta: number;
  logoId?: LogoId;
  className?: string;
};

const StatCard = ({
  title,
  count,
  countDelta,
  pages,
  pagesDelta,
  logoId,
  className,
}: StatCardProps) => {
  const chatbotId = logoId ? LOGO_TO_CHATBOT_ID[logoId] : null;

  return (
    <div className={cx('w-30 rounded-2xl bg-gray-800 px-3.5 py-2.5 shadow-xl', className)}>
      <p className="text-[11px] font-medium text-gray-300">{title}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        {chatbotId ? (
          <ChatbotLogoImage
            chatbotId={chatbotId}
            tooltip={title}
            className={cx('size-7', chatbotId === ChatbotId.ChatGPT && 'invert dark:invert-0')}
          />
        ) : (
          <PlaceholderLogo className="size-7 self-center" />
        )}
        <span className="text-[22px] leading-tight font-bold text-white">{count}</span>
        <span className="text-brand-400 text-xs font-medium">+{countDelta}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[11px] text-gray-400">Pages</span>
        <span className="text-[11px] font-semibold text-white">{pages}</span>
        <span className="text-brand-400 text-[11px] font-medium">+{pagesDelta}</span>
      </div>
    </div>
  );
};

type RowCardProps = {
  badgeIcon: React.ReactNode;
  badgeLabel: string;
  badgeClasses: string;
  actionText: string;
  barClass: string;
  barWidth: number;
};

const RowCard = ({
  badgeIcon,
  badgeLabel,
  badgeClasses,
  actionText,
  barClass,
  barWidth,
}: RowCardProps) => (
  <table className="bg-primary ring-secondary w-full overflow-hidden rounded-xl shadow-sm ring-1">
    <thead>
      <tr className="border-secondary border-b">
        <th className="w-22 px-4 py-0.5 text-left">
          <span className="text-tertiary text-[11px] font-medium">Type</span>
        </th>
        <th className="px-4 py-0.5 text-left">
          <span className="text-tertiary text-[11px] font-medium">Action</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="px-4 py-2.5 align-top">
          <span
            className={cx(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
              badgeClasses
            )}
          >
            {badgeIcon}
            {badgeLabel}
          </span>
        </td>
        <td className="min-w-0 px-4 py-2.5 align-top">
          <p className="text-primary truncate text-[13px] font-medium">{actionText}</p>
          <div className="bg-tertiary mt-1.5 h-2 rounded-full">
            <div
              className={cx('h-full rounded-full', barClass)}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
);

export const HeroIllustration = () => (
  <div className="relative size-full min-h-82" aria-hidden="true">
    <div className="absolute top-5 right-40 z-10 w-[55%]">
      <RowCard
        badgeIcon={<Feather className="size-3.5" />}
        badgeLabel="Create"
        badgeClasses="bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200"
        actionText="Best Trail Running Shoes of 2025"
        barClass="bg-brand-400"
        barWidth={65}
      />
    </div>
    <div className="absolute top-31 left-40 z-10 w-[55%]">
      <RowCard
        badgeIcon={<Tool01 className="size-3.5" />}
        badgeLabel="Optimize"
        badgeClasses="bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200"
        actionText="What are the most comfortable running shoes?"
        barClass="bg-quaternary"
        barWidth={80}
      />
    </div>
    <div className="absolute top-57 right-44 z-10 w-[55%]">
      <RowCard
        badgeIcon={<MessageTextCircle02 className="size-3.5" />}
        badgeLabel="Engage"
        badgeClasses="bg-utility-sky-50 text-utility-sky-700 ring-utility-sky-200"
        actionText="What are your favorite running shoes?"
        barClass="bg-quaternary"
        barWidth={65}
      />
    </div>

    <StatCard
      title="Google AI"
      count={12}
      countDelta={10}
      pages={7}
      pagesDelta={5}
      logoId="google"
      className="absolute top-4 right-4 z-20"
    />
    <StatCard
      title="ChatGPT"
      count={98}
      countDelta={79}
      pages={93}
      pagesDelta={37}
      logoId="chatgpt"
      className="absolute top-30 left-4 z-20"
    />
    <StatCard
      title="Perplexity"
      count={5}
      countDelta={4}
      pages={7}
      pagesDelta={6}
      logoId="perplexity"
      className="absolute top-56 right-8 z-20"
    />
  </div>
);
