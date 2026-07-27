import { AppLogo, AppLogoMinimal } from '@/app/(public)/components/AppLogo';

export default function FormHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 flex flex-col gap-6 md:gap-20">
      <AppLogo className="max-md:hidden" />
      <AppLogoMinimal className="size-10 md:hidden" />
      <div className="flex flex-col gap-2 md:gap-3">
        <h1 className="text-display-xs text-primary md:text-display-md font-semibold">{title}</h1>
        <p className="text-md text-tertiary">{description}</p>
      </div>
    </div>
  );
}
