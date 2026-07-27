import { Button } from '@/components/base/buttons/button';
import { ROUTES } from '@/libs/routes';
import { openSupportOnClick } from './SupportButton';
import { config } from '@/config';
import { SVGProps } from 'react';
import { AppLogo } from './AppLogo';

type FooterSocial = {
  label: string;
  icon: (props: SVGProps<SVGSVGElement> & { size?: number }) => React.ReactNode;
  href: string;
};

const FOOTER_SOCIALS: FooterSocial[] = [
  // { label: 'X (formerly Twitter)', icon: X, href: 'https://x.com/' },
  // { label: 'LinkedIn', icon: LinkedIn, href: 'https://www.linkedin.com/' },
];

const FOOTER_NAV_LIST = [
  {
    label: 'Features',
    items: [
      { label: 'AEO Content Strategy', href: ROUTES.AEO_CONTENT_STRATEGY },
      { label: 'AI Prompt Tracking Tool', href: ROUTES.AI_PROMPT_TRACKING },
      { label: 'AI Traffic Citation & Source Tracking', href: ROUTES.AI_TRAFFIC_CITATION_TRACKING },
      { label: 'AI Visibility Tracker', href: ROUTES.AI_VISIBILITY_TRACKER },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'AI Crawlability Checker', href: ROUTES.AI_CRAWL_CHECKER },
      { label: 'AI Product Prompt Ideas', href: ROUTES.AI_PRODUCT_PROMPT_IDEAS },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'For Agencies', href: ROUTES.AGENCIES },
      { label: 'Terms', href: ROUTES.TOS },
      { label: 'Privacy', href: ROUTES.PRIVACY_POLICY },
      { label: 'Support', href: '#', onClick: openSupportOnClick },
    ],
  },
];

export const Footer = ({
  stripLinksFromHeaderAndFooter,
}: {
  stripLinksFromHeaderAndFooter?: boolean;
}) => {
  return (
    <footer className="dark-mode">
      <div className="bg-primary py-12 md:pt-16">
        <div className="max-w-container mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-12 md:flex-row md:gap-16">
            <div className="flex flex-col items-start gap-6 md:w-80 md:gap-6">
              <AppLogo className="text-secondary h-8 w-min shrink-0" />
              <p className="text-md text-tertiary">{config.shortAppDescription}</p>
              {/* <RatingBadge className="origin-top-left scale-[0.78]" /> */}
            </div>

            {!stripLinksFromHeaderAndFooter && (
              <nav className="flex-1">
                <ul className="flex flex-col gap-8 sm:flex-row md:justify-end">
                  {FOOTER_NAV_LIST.slice(0, 5).map((category) => (
                    <li key={category.label}>
                      <p className="text-quaternary text-sm font-semibold">{category.label}</p>
                      <ul className="mt-4 flex flex-col gap-3">
                        {category.items.map((item, index) => (
                          <li key={`${category.label}-${index}`}>
                            {'onClick' in item && !!item.onClick ? (
                              <Button
                                color="link-gray"
                                size="lg"
                                onClick={item.onClick}
                                className="gap-1"
                              >
                                {item.label}
                              </Button>
                            ) : (
                              <Button
                                color="link-gray"
                                size="lg"
                                href={item.href}
                                className="gap-1"
                              >
                                {item.label}
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
      <div className="bg-secondary_alt py-10 md:py-12">
        <div className="max-w-container mx-auto px-4 md:px-8">
          <div className="flex flex-col-reverse justify-between gap-6 md:flex-row">
            <p className="text-md text-quaternary">
              © {new Date().getFullYear()} {config.appName}. All rights reserved.
            </p>
            <ul className="flex gap-6">
              {FOOTER_SOCIALS.map(({ label, icon: Icon, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg-quaternary outline-focus-ring hover:text-fg-quaternary_hover transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <Icon size={24} aria-label={label} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
