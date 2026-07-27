import { getSEOTags } from '@/libs/seo';
import { config } from '@/config';
import { categories } from '../../_content/categories';
import { allArticles } from '../../_content';
import { Metadata } from 'next';
import ArticleCard from '../../_assets/components/ArticleCard';
import BlogLayout from '../../_assets/components/BlogLayout';

const ARTICLES_PER_PAGE = 6;

export async function generateMetadata(props: {
  params: Promise<{ categoryId: string; pageNo: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const category = categories.find((category) => category.slug === params.categoryId);

  if (!category) {
    return getSEOTags({
      title: 'Category not found',
      description: 'Category not found',
    });
  }

  return getSEOTags({
    title: `${category.title} | Blog by ${config.appName}`,
    description: category.description,
  });
}

export default async function Category(props: {
  params: Promise<{ categoryId: string; pageNo: string }>;
}) {
  const params = await props.params;
  const pageNo = Number(params.pageNo ?? '0');
  const fromArticleNo = pageNo * ARTICLES_PER_PAGE;
  const toArticleNo = (pageNo + 1) * ARTICLES_PER_PAGE;

  const category = categories.find((category) => category.slug === params.categoryId);
  if (!category) return <div>Category not found</div>;

  const articles = allArticles
    .filter((article) => article.categories.map((c) => c.slug).includes(category.slug))
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
    .slice(fromArticleNo, toArticleNo);

  const pagesCount = Math.ceil(articles.length / ARTICLES_PER_PAGE);

  return (
    <BlogLayout
      title={`${category.title} Articles`}
      description={category.description}
      pageNo={pageNo}
      pagesCount={pagesCount}
    >
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} />
      ))}
    </BlogLayout>
  );
}
