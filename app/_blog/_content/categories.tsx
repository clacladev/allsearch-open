import { config } from '@/config';

export type CategoryType = {
  slug: string;
  title: string;
  titleShort?: string;
  description: string;
  descriptionShort?: string;
};

export type CategorySlug = 'feature' | 'guide';

// All the blog categories data display in the /blog/category/[categoryI].js pages.
export const categories: CategoryType[] = [
  {
    // The slug to use in the URL, from the categorySlugs object above.
    slug: 'feature',
    // The title to display the category title (h1), the category badge, the category filter, and more. Less than 60 characters.
    title: 'New Features',
    // A short version of the title above, display in small components like badges. 1 or 2 words
    titleShort: 'Features',
    // The description of the category to display in the category page. Up to 160 characters.
    description: `Here are the latest features we've added to ${config.appName}. I'm constantly improving our product to help you think better.`,
    // A short version of the description above, only displayed in the <Header /> on mobile. Up to 60 characters.
    descriptionShort: `Latest features added to ${config.appName}.`,
  },
  {
    slug: 'guide',
    title: 'Guides',
    titleShort: 'Guides',
    description: `Here are guides to help you level up your skills.`,
    descriptionShort: `Guides to help you level up your skills.`,
  },
];
