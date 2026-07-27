import Link from 'next/link';
import { config } from '@/config';
import { ROUTES } from '@/libs/routes';
import { CtaButton } from '@/app/(public)/(index)/Buttons';
import { AppLogo } from '@/app/(public)/components/AppLogo';

const Header = () => {
  return (
    <header className="bg-base-200">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-3">
        <div className="flex lg:flex-1">
          <Link
            className="flex shrink-0 items-center gap-2"
            href={ROUTES.HOME}
            title={`${config.appName} homepage`}
          >
            <AppLogo />
          </Link>
        </div>

        <div className="flex flex-1 justify-end">
          <CtaButton />
        </div>
      </nav>
    </header>
  );
};

export default Header;
