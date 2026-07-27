import type { JSX } from 'react';
import { StaticImageData } from 'next/image';
import claudioImg from '@/app/_blog/_assets/images/authors/claudio.jpg';
import { X } from '@/components/foundations/social-icons';

export type AuthorType = {
  slug: string;
  name: string;
  job: string;
  description: string;
  avatar: StaticImageData | string;
  socials?: {
    name: string;
    icon: JSX.Element;
    url: string;
  }[];
};

export type AuthorSlug = 'claudio';

// All the blog authors data display in the /blog/author/[authorId].js pages.
export const authors: AuthorType[] = [
  {
    // The slug to use in the URL, from the authorSlugs object above.
    slug: 'claudio',
    // The name to display in the author's bio. Up to 60 characters.
    name: 'Claudio',
    // The job to display in the author's bio. Up to 60 characters.
    job: 'AllSearch Founder',
    // The description of the author to display in the author's bio. Up to 160 characters.
    description: 'Claudio is a software engineer and builder',
    // The avatar of the author to display in the author's bio and avatar badge. It's better to use a local image, but you can also use an external image (https://...)
    avatar: claudioImg,
    // A list of social links to display in the author's bio.
    socials: [
      {
        name: 'Twitter',
        icon: <X />,
        url: 'https://twitter.com/clacladev',
      },
    ],
  },
];
