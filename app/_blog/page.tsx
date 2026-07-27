import { allArticles } from './_content';
import { config } from '@/config';
import { getSEOTags } from '@/libs/seo';
import { Metadata } from 'next';
import ArticleCard from './_assets/components/ArticleCard';
import BlogLayout from './_assets/components/BlogLayout';

const ARTICLES_PER_PAGE = 6;

export const metadata: Metadata = getSEOTags({
  title: `${config.appName} Blog`,
  description: config.shortAppDescription,
  ogImageTitle: 'Stories and interviews',
});

export default async function Blog(props: { params: Promise<{ pageNo: string }> }) {
  const params = await props.params;
  const pageNo = Number(params.pageNo ?? '0');
  const fromArticleNo = pageNo * ARTICLES_PER_PAGE;
  const toArticleNo = (pageNo + 1) * ARTICLES_PER_PAGE;

  const articles = allArticles
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
    .slice(fromArticleNo, toArticleNo);

  const pagesCount = Math.ceil(articles.length / ARTICLES_PER_PAGE);

  return (
    <BlogLayout
      title="Stories and interviews"
      description="The blog is the best source of information for interviews, tips, guides, industry best practices, and news."
      pageNo={pageNo}
      pagesCount={pagesCount}
    >
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} />
      ))}
    </BlogLayout>
  );
}
