import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { authors } from '../../_content/authors';
import { allArticles } from '../../_content';
import { Metadata } from 'next';
import ArticleCard from '../../_assets/components/ArticleCard';
import BlogLayout from '../../_assets/components/BlogLayout';

const ARTICLES_PER_PAGE = 6;

export async function generateMetadata(props: {
  params: Promise<{ authorId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const author = authors.find((author) => author.slug === params.authorId);

  if (!author) {
    return getSEOTags({
      title: 'Author not found',
      description: 'Author not found',
    });
  }

  return getSEOTags({
    title: `${author.name}, Author at ${config.appName}'s Blog`,
    description: `These are all the articles that ${author.name} has written for ${config.appName}'s Blog`,
  });
}

export default async function Author(props: {
  params: Promise<{ authorId: string; pageNo: string }>;
}) {
  const params = await props.params;
  const pageNo = Number(params.pageNo ?? '0');
  const fromArticleNo = pageNo * ARTICLES_PER_PAGE;
  const toArticleNo = (pageNo + 1) * ARTICLES_PER_PAGE;

  const author = authors.find((author) => author.slug === params.authorId);
  if (!author) return <div>Author not found</div>;

  const articles = allArticles
    .filter((article) => article.author.slug === author.slug)
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
    .slice(fromArticleNo, toArticleNo);

  const pagesCount = Math.ceil(articles.length / ARTICLES_PER_PAGE);

  return (
    <BlogLayout
      title={`${author.name}'s Articles`}
      description={author.description}
      pageNo={pageNo}
      pagesCount={pagesCount}
    >
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} />
      ))}
    </BlogLayout>
  );
}
