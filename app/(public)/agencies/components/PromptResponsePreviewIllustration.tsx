import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BrandPositionBadge } from '@/app/(private)/project/[projectId]/sources/components/BrandPositionBadge';
import { ChatbotLogoImage } from '@/app/(private)/project/[projectId]/components/ChatbotLogoImage';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { ProjectIcon } from '@/app/(private)/components/project/ProjectIcon';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import { PROJECT_BRAND_COLOR } from '@/libs/utils/brandColor';
import { cx } from '@/utils/cx';

export type PreviewBrand = {
  id: string;
  name: string;
  hostname: string;
  icon_url?: string;
  color?: string;
  isProject?: boolean;
};

export type PreviewSource = {
  url: string;
  cleanUrl: string;
  title?: string;
};

export type PromptResponsePreviewIllustrationProps = {
  promptName: string;
  responseText: string;
  chatbotId: ChatbotId;
  projectIdRank: number;
  brands: PreviewBrand[];
  citedSources: PreviewSource[];
  usedSources: PreviewSource[];
  highlights?: string[];
  className?: string;
  style?: React.CSSProperties;
};

export function PromptResponsePreviewIllustration({
  promptName,
  responseText,
  chatbotId,
  projectIdRank,
  brands,
  citedSources,
  usedSources,
  highlights = [],
  className,
  style,
}: PromptResponsePreviewIllustrationProps) {
  return (
    <div
      style={style}
      className={cx(
        'bg-primary border-border-secondary relative flex w-full flex-row overflow-hidden rounded-2xl border shadow-sm',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6 pr-4 max-h-[80vh]">
        <div className="flex flex-col gap-1">
          <p className="text-tertiary text-xs font-semibold tracking-wide uppercase">Prompt</p>
          <h2 className="text-primary text-lg font-semibold">{promptName}</h2>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-tertiary text-xs font-semibold tracking-wide uppercase">Response</p>
          <div className="prose prose-sm text-secondary max-w-none">
            <MarkdownResponseText
              text={responseText}
              highlights={highlights}
              chatbotId={chatbotId}
              sources={citedSources}
            />
          </div>
        </div>
      </div>

      <div className="border-border-secondary bg-secondary/30 flex w-60 shrink-0 flex-col overflow-y-auto border-l p-6 max-h-[80vh]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ChatbotLogoImage chatbotId={chatbotId} />
            <BrandPositionBadge projectIdRank={projectIdRank} />
          </div>
          <StaticBrandsIconsStack brands={brands} />
        </div>

        <hr className="bg-border-secondary my-4 h-px w-full border-none" aria-hidden="true" />

        <div className="divide-border-secondary flex flex-col divide-y">
          {!!citedSources.length && (
            <div className="py-4 first:pt-0 last:pb-0">
              <SourcesList title="Cited sources" sources={citedSources} />
            </div>
          )}
          {!!usedSources.length && (
            <div className="py-4 first:pt-0 last:pb-0">
              <SourcesList title="Used sources" sources={usedSources} />
            </div>
          )}
          {!citedSources.length && !usedSources.length && (
            <p className="text-tertiary text-sm">No sources available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const StaticBrandsIconsStack = ({ brands }: { brands: PreviewBrand[] }) => {
  const MAX_ICONS = 6;
  const hasOverflow = brands.length > MAX_ICONS;
  const visibleBrands = hasOverflow ? brands.slice(0, MAX_ICONS - 1) : brands;
  const hiddenCount = brands.length - visibleBrands.length;

  if (!brands.length) return null;

  const brandsNamesList = brands.map((b) => b.name).join(', ');

  return (
    <Tooltip title="Brands mentions in order" description={brandsNamesList}>
      <div className="flex -space-x-2">
        {visibleBrands.map((brand) => (
          <ProjectIcon
            key={brand.id}
            size="xs"
            className="ring-bg-primary ring-[1.5px]"
            alt={brand.name ?? brand.hostname}
            src={brand.icon_url}
            placeholder={(brand.name ?? brand.hostname)?.slice(0, 2)}
            color={brand.isProject ? PROJECT_BRAND_COLOR : brand.color}
          />
        ))}
        {hasOverflow && (
          <ProjectIcon
            size="xs"
            className="ring-bg-primary ring-[1.5px]"
            placeholder={`+${hiddenCount}`}
          />
        )}
      </div>
    </Tooltip>
  );
};

function processPerplexityCitations(text: string, sources: PreviewSource[]): string {
  return text.replace(/\[(\d+)\]/g, (match, index) => {
    // 1-based index in some contexts, but usually perplexity is 1-based [1], [2]. Let's match original behavior.
    const sourceIndex = parseInt(index, 10);
    const sourceObj = sources[sourceIndex - 1] || sources[sourceIndex];

    if (sourceObj?.url) {
      return ` [${index}](${sourceObj.url})`;
    }

    return match;
  });
}

const MarkdownResponseText = ({
  text,
  highlights,
  chatbotId,
  sources,
}: {
  text: string;
  highlights?: string[];
  chatbotId: string;
  sources: PreviewSource[];
}) => {
  const processedText =
    chatbotId === 'perplexity' ? processPerplexityCitations(text, sources) : text;

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer nofollow">
            {highlightChildren(children, highlights)}
          </a>
        ),
        p: ({ children, ...props }) => <p {...props}>{highlightChildren(children, highlights)}</p>,
        li: ({ children, ...props }) => (
          <li {...props}>{highlightChildren(children, highlights)}</li>
        ),
        td: ({ children, ...props }) => (
          <td {...props}>{highlightChildren(children, highlights)}</td>
        ),
        th: ({ children, ...props }) => (
          <th {...props}>{highlightChildren(children, highlights)}</th>
        ),
        strong: ({ children, ...props }) => (
          <strong {...props}>{highlightChildren(children, highlights)}</strong>
        ),
        em: ({ children, ...props }) => (
          <em {...props}>{highlightChildren(children, highlights)}</em>
        ),
      }}
    >
      {processedText}
    </Markdown>
  );
};

function highlightChildren(children: React.ReactNode, keywords?: string[]): React.ReactNode {
  if (!keywords?.length) return children;

  const pattern = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      const parts = child.split(regex);
      if (parts.length === 1) return child;
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="dark:bg-brand-600 bg-brand-300 text-primary rounded px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props?.children) {
      return React.cloneElement(child, {}, highlightChildren(child.props.children, keywords));
    }
    return child;
  });
}

const SourcesList = ({ title, sources }: { title: string; sources: PreviewSource[] }) => (
  <div className="flex flex-col gap-2">
    <p className="text-tertiary text-xs font-medium">{title}</p>
    <ul className="flex flex-col gap-2.5">
      {sources.map((source) => (
        <li key={source.cleanUrl}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group flex min-w-0 flex-col"
          >
            {source.title && (
              <span className="text-primary group-hover:text-brand-secondary truncate text-sm font-medium">
                {source.title}
              </span>
            )}
            <span className="text-tertiary truncate text-xs">{source.cleanUrl}</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export function ExamplePromptResponsePreviewIllustrationCheperModel() {
  return (
    <PromptResponsePreviewIllustration
      className="h-200"
      promptName="What are the most durable flip flops for beach and daily wear?"
      responseText={`Short answer - if you want flip-flops that last for beach days and everyday wear, the top durable options are:

- OluKai Ohana - durable, thick molded EVA footbed with good arch support and a grippy outsole; a go-to for all-day wear. ([nationalgeographic.com](https://www.nationalgeographic.com/lifestyle/article/best-flip-flops?utm_source=openai))
- Teva Mush II - designed for water/beach use (quick-drying EVA, grippy Durabrasion rubber outsole), very durable for wet, sandy conditions. ([nationalgeographic.com](https://www.nationalgeographic.com/lifestyle/article/best-flip-flops?utm_source=openai))
- Rainbow Sandals (Premier/Leather) - leather construction and heavy-duty assembly (many owners report multi-year life; brand known for repairability/longevity). ([wellrigged.com](https://www.wellrigged.com/longest-lasting-flip-flops/?utm_source=openai))
- Chaco Classic Flip - built like an outdoor sandal with a firm, supportive footbed and rugged sole, good for lots of walking and hard use. ([self.com](https://www.self.com/story/best-flip-flops?utm_source=openai))
- Reef (e.g., Fanning/Cushion Bounce) - cushioned, well-built flip-flops with durable outsoles and water-ready materials; popular beach/daily choice. ([siliconupdates.com](https://siliconupdates.com/10-best-flip-flops-that-are-actually-worth-buying-in-2025/?utm_source=openai))

Quick buying checklist (what to look for when prioritizing durability)
- Outsole material and tread - thicker rubber outsoles (Durabrasion, Vibram or similar) resist wear and give traction.
- Strap construction - molded or sewn straps that are anchored through the sole (rather than only glued) last longer; reinforced toe posts are less likely to break.
- Footbed density - a firmer, higher-density EVA or rubber footbed holds up better to daily wear than very soft foam that compresses quickly.
- Water resistance (for beach use) - choose synthetic rubber/EVA or treated leather and quick-dry straps to avoid rot and delamination.
- Warranty/repairability - brands like Rainbow and some higher-end makers offer repair or long warranties; that extends lifespan.

Care tips to make them last
- Rinse salt/sand off after beach days and let them air-dry out of direct sun.
- Avoid leaving foam soles baking on hot pavement or in a hot car for long periods (heat can accelerate breakdown).
- If straps loosen or glue fails, many leather or stitched models can be repaired rather than replaced.
- Rotate two pairs if you wear them daily - that halves the wear rate.

If you want, tell me: your budget, whether you prefer leather or synthetic, and if you need lots of arch support or plan long walks - I'll narrow this to the best pick for you and suggest specific models and sizes.`}
      chatbotId={ChatbotId.ChatGPT}
      projectIdRank={1}
      highlights={['OluKai', 'Reef']}
      brands={[
        {
          id: '1',
          name: 'OluKai',
          hostname: 'olukai.com',
          isProject: true,
        },
        {
          id: '2',
          name: 'Reef',
          hostname: 'reef.com',
          color: '#8B5CF6',
        },
      ]}
      citedSources={[
        {
          url: 'https://www.nationalgeographic.com/lifestyle/article/best-flip-flops',
          cleanUrl: 'nationalgeographic.com/lifestyle/article/best-flip-flops',
          title: 'The best flip-flops for 2025 | National Geographic',
        },
        {
          url: 'https://www.wellrigged.com/longest-lasting-flip-flops',
          cleanUrl: 'wellrigged.com/longest-lasting-flip-flops',
          title: '7 Longest Lasting Flip Flops | Well Rigged',
        },
        {
          url: 'https://www.self.com/story/best-flip-flops',
          cleanUrl: 'self.com/story/best-flip-flops',
          title:
            "If You Don't Already Have a Go-To Pair of Flip-Flops, You've Come to the Right Place",
        },
        {
          url: 'https://siliconupdates.com/10-best-flip-flops-that-are-actually-worth-buying-in-2025',
          cleanUrl: 'siliconupdates.com/10-best-flip-flops-that-are-actually-worth-buying-in-2025',
          title: '10 Best Flip Flops That Are Actually Worth Buying in 2025 - Silicon Updates',
        },
      ]}
      usedSources={[
        {
          url: 'https://www.travelandleisure.com/style/shoes/most-comfortable-flip-flops',
          cleanUrl: 'travelandleisure.com/style/shoes/most-comfortable-flip-flops',
          title:
            "We Tested 40 Pairs of Flip-flops at the Beach and Beyond-Here Are the 12 We're Keeping",
        },
      ]}
    />
  );
}

export function ExamplePromptResponsePreviewIllustrationRealModel() {
  return (
    <PromptResponsePreviewIllustration
      className="h-200"
      promptName="What are the most durable flip flops for beach and daily wear?"
      responseText={`Here's a detailed, well-cited guide to the most durable and comfortable flip-flops for both beach and daily wear:

**Top Picks for Durability and Everyday Use**

1. **OluKai Ohana**
   - Widely recognized for its durable build, ergonomic support, and water-friendly design-making it ideal for beach days and regular use. Reviews highlight its thick, rigid sole, reliable arch support, and excellent traction, even when wet ([travelandleisure.com](https://www.travelandleisure.com/style/shoes/most-comfortable-flip-flops?utm_source=openai)).
   - Users report 3-5 years of consistent wear, affirming long-term value ([siliconupdates.com](https://siliconupdates.com/10-best-flip-flops-that-are-actually-worth-buying-in-2025/?utm_source=openai)).

2. **Sanuk Yoga Mat II**
   - Known for exceptional durability; many users report wearing pairs for over 3 years of daily use ([sagewisereviews.com](https://www.sagewisereviews.com/categories/flip-flops?utm_source=openai)).
   - Features a memory-foam footbed that molds to the foot and quick-dry, water-resistant construction-great for the beach or errands ([sagewisereviews.com](https://www.sagewisereviews.com/categories/flip-flops?utm_source=openai)).

3. **Havaianas Top**
   - A classic choice with a minimalist rubber build that's nearly indestructible. Made of dense, long-lasting rubber with a grippy textured footbed ([sagewisereviews.com](https://www.sagewisereviews.com/categories/flip-flops?utm_source=openai)).
   - Highly affordable and water-ready-perfect for sandy or poolside wear ([sagewisereviews.com](https://www.sagewisereviews.com/categories/flip-flops?utm_source=openai)).

4. **Cobian Hobgood Draino**
   - Offers durable construction, solid arch support, and strong traction-even for extended wear and wet environments ([sagewisereviews.com](https://www.sagewisereviews.com/categories/flip-flops?utm_source=openai)).
   - Designed to accommodate wider feet and is easy to clean-though very heavy daily use may eventually affect the sole ([sagewisereviews.com](https://www.sagewisereviews.com/categories/flip-flops?utm_source=openai)).

5. **Chaco Flip EcoTread**
   - A rugged "flip-flop on steroids": uses a durable LUVSEAT midsole and recycled rubber outsole with lugged traction ([backpackers.com](https://backpackers.com/outdoor-guides/best-flip-flops/?utm_source=openai)).
   - Built for longevity and outdoor wear-excellent on rocky or wet surfaces ([backpackers.com](https://backpackers.com/outdoor-guides/best-flip-flops/?utm_source=openai)).

6. **Reef Fanning / Cushion Breeze**
   - **Fanning**: Features a strong synthetic nubuck strap, contoured EVA footbed with arch support, durable outsole, and a fun built-in bottle opener. Great traction on wet surfaces and solid overall construction ([edwinvonholy.com](https://edwinvonholy.com/2025/05/21/top-10-most-comfortable-flip-flops-in-2025/?utm_source=openai)).
   - **Cushion Breeze**: Extremely supportive and cushioned, with ergonomic arch support and a durable rubber-sponge outsole. Acclaimed by users with plantar fasciitis for all-day wear ([prevention.com](https://www.prevention.com/beauty/style/a65036815/reef-cushion-breeze-womens-flip-flop-amazon/?utm_source=openai)).

7. **KuaiLu Flip Flops**
   - Budget-friendly (< $20) and surprisingly supportive with EVA memory foam footbeds and high arch support. Reviewers report wearing them for miles-even users with plantar fasciitis experienced no pain ([southernliving.com](https://www.southernliving.com/amazon-kuailu-flip-flops-deal-june-2025-11751915?utm_source=openai)).

---

**Other Noteworthy Options (Supporting Anatomy & Health)**
- **Aetrex Maui**: APMA-approved for foot health; features foam sole with midfoot support and heel cushioning-great for high-arched feet or long walking ([self.com](https://www.self.com/story/best-flip-flops?utm_source=openai)).
- **Merrell Hut Ultra Flip**: Also APMA-approved; plush foam footbed with breathable strap and slip-resistant sole-excellent comfort and support ([worldglamz.com](https://worldglamz.com/flip-flops-for-beach-according-to-podiatrists-in-2024/?utm_source=openai)).
- **Rainbow Single Layer Leather**: Classic leather flip-flops known for longevity and molding to your foot (backed by warranty)-ideal for fans of leather construction ([healthline.com](https://www.healthline.com/health/best-flip-flops?utm_source=openai)).

---

**Quick Comparison Table (Text-Based)**

Flip-Flop | Durability | Best Use Highlights
---|---|---
OluKai Ohana | High (3-5 years) | Water, beach, daily wear, great arch support
Sanuk Yoga Mat II | Very High (3+ years) | Casual wear, cushioned memory-foam feel
Havaianas Top | Excellent (rubber) | Budget, beach, quick errands
Cobian Hobgood Draino | High | Wide fit, water-resistant, daily walking
Chaco Flip EcoTread | Very High | Outdoor, rugged terrains
Reef Fanning / Breeze | High | Beachy use, comfortable for foot issues
KuaiLu | Good (budget) | Arch support on a budget
Aetrex Maui / Merrell Hut | High | Orthotic support & long walks
Rainbow Leather | High | Durable leather with lifetime warranty

---

**Recommendations Based on Your Needs:**

- For **maximum durability and arch support**, **OluKai Ohana** or **Chaco EcoTread** stand out.
- For **cushioned comfort and long-term wear**, **Sanuk Yoga Mat II** is excellent.
- For a **budget option with arch support**, **KuaiLu** offers great value.
- If you want **stylish leather** that lasts, consider **Rainbow** or **OluKai 'Aukai** (leather version) ([vogue.com](https://www.vogue.com/article/the-darker-side-of-flip-flops?utm_source=openai)).
- For **foot health and podiatric support**, **Aetrex Maui** or **Merrell Hut Ultra** are strong picks.

---

Each of these flip-flops balances durability, support, and performance in different ways. Let me know if you'd like help narrowing the list by gender, arch type, or style preference!`}
      chatbotId={ChatbotId.Perplexity}
      projectIdRank={1}
      highlights={['OluKai', 'Sanuk', 'Havaianas', 'Reef', 'KuaiLu', 'Maui', 'Cobian', 'Chaco']}
      brands={[
        {
          id: '1',
          name: 'OluKai',
          hostname: 'olukai.com',
          color: '#F59E0B',
        },
        {
          id: '2',
          name: 'Sanuk',
          hostname: 'sanuk.com',
          color: '#8B5CF6',
        },
        {
          id: '3',
          name: 'Reef',
          hostname: 'reef.com',
          isProject: true,
        },
        {
          id: '4',
          name: 'Havaianas',
          hostname: 'havaianas.com',
          color: '#F97316',
        },
        {
          id: '5',
          name: 'KuaiLu',
          hostname: 'kuailu.com',
          color: '#14B8A6',
        },
        {
          id: '6',
          name: 'Aetrex Maui',
          hostname: 'aetrex.com',
          color: '#3B82F6',
        },
      ]}
      citedSources={[
        {
          url: 'https://www.travelandleisure.com/style/shoes/most-comfortable-flip-flops',
          cleanUrl: 'travelandleisure.com/style/shoes/most-comfortable-flip-flops',
          title:
            "We Tested 40 Pairs of Flip-flops at the Beach and Beyond-Here Are the 12 We're Keeping",
        },
        {
          url: 'https://siliconupdates.com/10-best-flip-flops-that-are-actually-worth-buying-in-2025',
          cleanUrl: 'siliconupdates.com/10-best-flip-flops-that-are-actually-worth-buying-in-2025',
          title: '10 Best Flip Flops That Are Actually Worth Buying in 2025 - Silicon Updates',
        },
        {
          url: 'https://www.sagewisereviews.com/categories/flip-flops',
          cleanUrl: 'sagewisereviews.com/categories/flip-flops',
          title: 'Best Flip Flops for 2026 | Sagewise Reviews',
        },
        {
          url: 'https://backpackers.com/outdoor-guides/best-flip-flops',
          cleanUrl: 'backpackers.com/outdoor-guides/best-flip-flops',
          title: 'The Best Flip Flops of 2023 | Backpackers.com',
        },
        {
          url: 'https://edwinvonholy.com/2025/05/21/top-10-most-comfortable-flip-flops-in-2025',
          cleanUrl: 'edwinvonholy.com/2025/05/21/top-10-most-comfortable-flip-flops-in-2025',
          title: 'Top 10 Most Comfortable Flip Flops in 2025',
        },
        {
          url: 'https://www.prevention.com/beauty/style/a65036815/reef-cushion-breeze-womens-flip-flop-amazon',
          cleanUrl:
            'prevention.com/beauty/style/a65036815/reef-cushion-breeze-womens-flip-flop-amazon',
          title:
            "Amazon Shoppers Can't Stop Raving About These Flip-Flops With 'Amazing Arch Support'",
        },
        {
          url: 'https://www.southernliving.com/amazon-kuailu-flip-flops-deal-june-2025-11751915',
          cleanUrl: 'southernliving.com/amazon-kuailu-flip-flops-deal-june-2025-11751915',
          title:
            "Our Editors Reveal The Amazon Prime Day Deals They're Actually Buying-Starting At Just $3",
        },
        {
          url: 'https://www.self.com/story/best-flip-flops',
          cleanUrl: 'self.com/story/best-flip-flops',
          title:
            "If You Don't Already Have a Go-To Pair of Flip-Flops, You've Come to the Right Place",
        },
        {
          url: 'https://worldglamz.com/flip-flops-for-beach-according-to-podiatrists-in-2024',
          cleanUrl: 'worldglamz.com/flip-flops-for-beach-according-to-podiatrists-in-2024',
          title:
            'The Best Flip-Flops for the Beach, Running Errands, and Beyond, According to Podiatrists - WorldGlamz',
        },
        {
          url: 'https://www.healthline.com/health/best-flip-flops',
          cleanUrl: 'healthline.com/health/best-flip-flops',
          title: '10 Best Flip-Flops for Every Day: Walk, Lounge, Arch Support & More',
        },
        {
          url: 'https://www.vogue.com/article/the-darker-side-of-flip-flops',
          cleanUrl: 'vogue.com/article/the-darker-side-of-flip-flops',
          title: 'The darker side of flip flops',
        },
      ]}
      usedSources={[
        {
          url: 'https://footwind.net/best-comfortable-flip-flops',
          cleanUrl: 'footwind.net/best-comfortable-flip-flops',
          title: '8 Best Comfortable Flip Flops of 2026',
        },
        {
          url: 'https://people.com/clarks-sea-breeze-flip-flops-amazon-prime-day-deal-2025-11743832',
          cleanUrl: 'people.com/clarks-sea-breeze-flip-flops-amazon-prime-day-deal-2025-11743832',
        },
        {
          url: 'https://www.news.com.au/checkout/fashion-and-accessories/shoes/best-summer-sandals/news-story/4d9f0c8045c3dc36647ccbd7b6bb6d93',
          cleanUrl:
            'news.com.au/checkout/fashion-and-accessories/shoes/best-summer-sandals/news-story/4d9f0c8045c3dc36647ccbd7b6bb6d93',
        },
        {
          url: 'https://www.nationalgeographic.com/lifestyle/article/best-flip-flops',
          cleanUrl: 'nationalgeographic.com/lifestyle/article/best-flip-flops',
        },
        {
          url: 'https://www.independent.co.uk/extras/indybest/fashion-beauty/womens-shoes/best-flip-flops-b2772259.html',
          cleanUrl:
            'independent.co.uk/extras/indybest/fashion-beauty/womens-shoes/best-flip-flops-b2772259.html',
          title: "12 best flip flops to nail this summer's minimalist shoe trend",
        },
        {
          url: 'https://bestwalkingfeet.com/best-flip-flops-for-men-and-women',
          cleanUrl: 'bestwalkingfeet.com/best-flip-flops-for-men-and-women',
          title: 'Best Flip-Flops For Men and Women',
        },
        {
          url: 'https://marieclaire.co.uk/life/health-fitness/stylish-supportive-flip-flops',
          cleanUrl: 'marieclaire.co.uk/life/health-fitness/stylish-supportive-flip-flops',
          title:
            "As Serial Flip Flops Wearers, It's Officially: These Are the 6 Most Stylish and Genuinely Supportive Pairs RN",
        },
        {
          url: 'https://en.wikipedia.org/wiki/Havaianas',
          cleanUrl: 'en.wikipedia.org/wiki/Havaianas',
          title: 'Havaianas - Wikipedia',
        },
      ]}
    />
  );
}
