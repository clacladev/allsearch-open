import Link from 'next/link';
import Image from 'next/image';
import { ArticleType } from '../../_content';
import { ArrowUpRight } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Badge } from '@/components/base/badges/badges';

const ArticleCard = ({
  article,
  imageClassName,
  titleClassName,
  className,
}: {
  article: ArticleType;
  imageClassName?: string;
  titleClassName?: string;
  className?: string;
}) => (
  <article className={cx('flex flex-col gap-4', className)}>
    <a href={`/blog/${article.slug}`} className="overflow-hidden rounded-2xl" tabIndex={-1}>
      <Image
        src={article.image.src ?? ''}
        alt={article.title}
        className={cx('aspect-[1.5] w-full object-cover', imageClassName)}
      />
    </a>

    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <p className="text-brand-secondary text-sm font-semibold">
          {article.author.name} • <time>{article.publishedAt}</time>
        </p>
        <div className="flex w-full flex-col gap-1">
          <Link
            href={`/blog/${article.slug}`}
            className={cx(
              'text-primary outline-focus-ring flex justify-between gap-x-4 rounded-md text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
              titleClassName
            )}
          >
            {article.title}
            <ArrowUpRight
              className="text-fg-quaternary mt-0.5 size-6 shrink-0"
              aria-hidden="true"
            />
          </Link>
          <p className="text-md text-tertiary line-clamp-2">{article.description}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {article.categories.map((category) => (
          <Link
            key={category.slug}
            href={`/blog/category/${category.slug}`}
            className="outline-focus-ring rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Badge size="md">{category.title}</Badge>
          </Link>
        ))}
      </div>
    </div>
  </article>
);

export default ArticleCard;
