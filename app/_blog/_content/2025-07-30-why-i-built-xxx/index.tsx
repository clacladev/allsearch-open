import coverImage from '@/public/blog/2025-07-30-why-i-built-xxx/landing.jpg';
import { categories } from '../categories';
import { authors } from '../authors';
import { ArticleType } from '../index';
import ArticleMarkdown from '../../_assets/components/ArticleMarkdown';
import Script from 'next/script';

const publishedAt = '2025-07-30';
const titleId = 'why-i-built-xxx';
const slug = `${publishedAt}-${titleId}`;

const article: ArticleType = {
  // The unique slug to use in the URL. It's also used to generate the canonical URL.
  slug,
  // The title to display in the article page (h1). Less than 60 characters. It's also used to generate the meta title.
  title: 'Why I Built AllSearch: Stop Chasing Ideas, Start Solving Real Problems',
  // The description of the article to display in the article page. Up to 160 characters. It's also used to generate the meta description.
  description:
    'The story behind AllSearch and why I believe entrepreneurs should focus on validated problems instead of chasing shiny ideas.',
  keywords:
    'problem totem, problem discovery, problem finding, problem solving, problem-first development, problem-first design, problem-first marketing, problem-first sales, problem-first product development, problem-first product design, problem-first product marketing, problem-first product sales',
  // An array of categories of the article. It's used to generate the category badges, the category filter, and more.
  categories: [categories.find((c) => c.slug === 'feature')!],
  // The author of the article. It's used to generate a link to the author's bio page.
  author: authors.find((a) => a.slug === 'claudio')!,
  // The date of the article. It's used to generate the meta date.
  publishedAt,
  image: {
    // The image to display in <CardArticle /> components.
    src: coverImage,
    // The relative URL of the same image to use in the Open Graph meta tags & the Schema Markup JSON-LD. It should be the same image as the src above.
    urlRelative: `/blog/${slug}/landing.jpg`,
    alt: 'AllSearch landing page',
  },
  // The actual content of the article that will be shown under the <h1> title in the article page.
  content: (
    <>
      <div className="relative aspect-video">
        <iframe
          src="https://player.vimeo.com/video/1105781059?badge=0&autopause=0&player_id=0&app_id=58479"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
          title="AllSearch Demo 2025-07-30"
        ></iframe>
      </div>
      <Script src="https://player.vimeo.com/api/player.js"></Script>

      <ArticleMarkdown>
        {`
Hello! I'm Claudio, and today I'm launching AllSearch – a tool that helps entrepreneurs discover real problems people are desperately trying to solve, instead of chasing the next shiny idea.

## The Problem with Problem-Finding

Like many entrepreneurs, I used to fall into the "idea trap." I'd get excited about a clever solution, spend months building it, only to discover that nobody actually wanted what I'd created. Sound familiar?

The harsh reality is that 90% of startups fail, and the #1 reason isn't poor execution or lack of funding – it's building something nobody wants. We're so focused on having brilliant ideas that we forget the most important question: **What problems are people already paying to solve?**

## Why I Built AllSearch

After my own share of failed projects, I realized I was approaching entrepreneurship backwards. Instead of starting with solutions and hoping to find problems, I needed to start with validated problems and build solutions around them.

But here's the challenge: where do you find these real, validated problems? Sure, you could spend weeks manually scrolling through Reddit, Twitter, and forums, trying to spot patterns in user complaints. But that's time-consuming, inconsistent, and frankly, not scalable.

That's when I decided to build AllSearch. I wanted a tool that could analyze thousands of real user complaints across platforms like Reddit, surface genuine pain points, and rank them by urgency, frequency, and market potential.

## How AllSearch Works

AllSearch scans thousands of user discussions and complaints from Reddit (with more platforms coming soon) to surface real, unsolved problems in any market you're interested in. Here's what makes it different:

- **Real User Pain:** We analyze actual complaints and frustrations, not hypothetical problems
- **Smart Ranking:** Problems are ranked by urgency, frequency, and sentiment intensity
- **Market Validation:** See how often people mention each problem and how desperately they need solutions
- **Actionable Insights:** Get specific, prioritized problems you can start solving today

## What I Hope to Achieve

My vision for AllSearch goes beyond just another market research tool. I want to fundamentally change how entrepreneurs approach building products:

**Stop the Guessing Game:** No more building in the dark, hoping someone will want what you've created. Start with validated problems that people are already trying to solve.

**Reduce Startup Failure Rates:** If more entrepreneurs build solutions to real, validated problems, we can significantly reduce the 90% failure rate that plagues our industry.

**Create Better Products:** When you start with genuine user pain, you build products that truly matter – products that solve real problems and improve people's lives.

## The Journey Ahead

This is just the beginning. Right now, AllSearch analyzes Reddit discussions, but I'm already working on expanding to Twitter, Facebook, LinkedIn, and review sites. The goal is to create the most comprehensive problem discovery platform for entrepreneurs.

I'm also planning features like trend analysis, competitor problem mapping, and solution ideation tools. But I want to build these features based on real user feedback – practicing what I preach about problem-first development.

## A Personal Note

Building AllSearch has been both challenging and rewarding. It's forced me to confront my own biases about product development and really listen to what potential users need. Every feature in the current version exists because someone specifically asked for it or because I identified it as a genuine pain point in my research.

I believe we're at a turning point in entrepreneurship. The days of "build it and they will come" are over. The future belongs to entrepreneurs who start with problems, not solutions – who build what people need, not just what they think is cool.

## Ready to Stop Guessing?

If you're tired of chasing ideas that lead nowhere, if you want to build something people actually want, I invite you to try AllSearch. Discover the problems people are already paying to solve, and start building solutions that matter.

The entrepreneurial journey is hard enough without building the wrong thing. Let's change that, together.
`}
      </ArticleMarkdown>
    </>
  ),
};

export default article;
