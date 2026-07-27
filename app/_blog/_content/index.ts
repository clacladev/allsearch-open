/* eslint-disable @typescript-eslint/no-require-imports */

import type { JSX } from 'react';
import { StaticImageData } from 'next/image';
import { AuthorType } from './authors';
import { CategoryType } from './categories';

export type ArticleType = {
  slug: string;
  title: string;
  description: string;
  keywords: string;
  categories: CategoryType[];
  author: AuthorType;
  publishedAt: string;
  image: {
    src?: StaticImageData;
    urlRelative: string;
    alt: string;
  };
  content: JSX.Element;
};

// List of all the articles
export const allArticles: ArticleType[] = [require('./2025-07-30-why-i-built-xxx').default];
