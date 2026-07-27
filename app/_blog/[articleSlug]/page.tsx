import Link from 'next/link';
import Script from 'next/script';
import { allArticles } from '../_content';
import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { Metadata } from 'next';
import { Badge } from '@/components/base/badges/badges';
import Image from 'next/image';
import ArticleBottomCta from '../_assets/components/ArticleBottomCta';

const RELATED_ARTICLES_COUNT = 3;

export async function generateMetadata(props: {
  params: Promise<{ articleSlug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const article = allArticles.find((article) => article.slug === params.articleSlug)!;

  if (!article) {
    return getSEOTags({
      title: 'Article not found',
      description: 'Article not found',
    });
  }

  const title = article.title.substring(0, 60);

  return getSEOTags({
    title,
    description: article.description,
    keywords: article.keywords,
    extraTags: {
      openGraph: {
        title,
        description: article.description,
        url: `/blog/${article.slug}`,
        images: [
          {
            url: article.image.urlRelative,
            width: 1200,
            height: 660,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
    },
  });
}

export default async function Article(props: { params: Promise<{ articleSlug: string }> }) {
  const params = await props.params;
  const { articleSlug } = params;
  const article = allArticles.find((article) => article.slug === articleSlug)!;
  if (!article) return <div>Article not found</div>;

  const relatedArticles = allArticles
    .filter(
      (a) =>
        a.slug !== articleSlug &&
        a.categories.some((c) => article.categories.map((c) => c.slug).includes(c.slug))
    )
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
    .slice(0, RELATED_ARTICLES_COUNT);

  return (
    <>
      {/* SCHEMA JSON-LD MARKUP FOR GOOGLE */}
      <Script
        type="application/ld+json"
        id={`json-ld-article-${article.slug}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://${config.domainName}/blog/${article.slug}`,
            },
            name: article.title,
            headline: article.title,
            description: article.description,
            image: `https://${config.domainName}${article.image.urlRelative}`,
            datePublished: article.publishedAt,
            dateModified: article.publishedAt,
            author: {
              '@type': 'Person',
              name: article.author.name,
            },
          }),
        }}
      />

      {/* ARTICLE CONTENT */}
      <div className="bg-primary">
        <div className="bg-brand-section w-full py-16 pb-32 md:pt-24 md:pb-40">
          <div className="max-w-container mx-auto px-4 md:px-8">
            <div className="mx-auto flex w-full max-w-240 flex-col items-center text-center">
              <span className="text-primary_on-brand md:text-md text-sm font-semibold">
                {article.categories.map((category) => category.title).join(', ')}
              </span>
              <h1 className="text-display-md text-tertiary_on-brand md:text-display-lg mt-3 font-semibold">
                {article.title}
              </h1>
              <p className="text-primary_on-brand mt-4 max-w-3xl text-lg md:mt-6 md:text-xl">
                {article.description}
              </p>

              <Link href={`/blog/author/${article.author.slug}`}>
                <div className="mt-8 flex items-center gap-3 text-left">
                  <Image
                    src={article.author.avatar}
                    className="size-12 rounded-full object-cover"
                    alt={article.author.name}
                  />
                  <div>
                    <p className="text-md text-tertiary_on-brand font-semibold">
                      {article.author.name}
                    </p>
                    <p className="text-md text-primary_on-brand">
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-container mx-auto px-4 pb-16 md:px-8 md:pb-24">
          <Image
            className="mx-auto -mt-16 h-60 w-full object-cover md:-mt-24 md:h-160"
            src={
              article.image.src ?? 'https://www.untitledui.com/marketing/wireframing-pattern.webp'
            }
            alt={article.image.alt}
          />
          <div className="mx-auto pt-16 md:max-w-180 md:pt-24">
            <div className="prose mx-auto max-w-prose">{article.content}</div>

            <ArticleBottomCta />

            <div className="border-secondary -mt-px flex flex-col items-start justify-between gap-y-6 border-t pt-6 md:flex-row md:items-center">
              <div className="flex gap-2">
                {article.categories.map((category) => (
                  <Link key={category.slug} href={`/blog/category/${category.slug}`}>
                    <Badge color="sky" size="md">
                      {category.title}
                    </Badge>
                  </Link>
                ))}
              </div>

              {!!article.author.socials?.length && (
                <div className="flex items-center gap-3">
                  <span className="text-md text-primary font-semibold">{article.author.name}</span>
                  {article.author.socials.map((social) => (
                    <Link
                      key={social.url}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {social.icon}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          {!!relatedArticles.length && (
            <div className="mt-12 hidden md:block">
              <p className="text-secondary mb-2 text-sm md:mb-3">Related reading</p>
              <div className="space-y-2 md:space-y-5">
                {relatedArticles.map((article) => (
                  <div className="" key={article.slug}>
                    <p className="mb-0.5">
                      <Link
                        href={`/blog/${article.slug}`}
                        className="link link-hover hover:link-primary font-medium"
                        title={article.title}
                        rel="bookmark"
                      >
                        {article.title}
                      </Link>
                    </p>
                    <p className="text-secondary max-w-full text-sm">{article.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
