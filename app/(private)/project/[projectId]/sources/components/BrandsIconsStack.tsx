import { ProjectIcon } from '@/app/(private)/components/project/ProjectIcon';
import { Tooltip } from '@/app/(private)/components/Tooltip';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { getBrandColor, PROJECT_BRAND_COLOR } from '@/libs/utils/brandColor';

type Brand = {
  name: string | null | undefined;
  hostname: string;
  icon_url: string | null | undefined;
};

export const getBrandNamesList = (
  brandIdsRanking: string[],
  competitors: CompetitorRow[],
  project: ProjectRow
) =>
  brandIdsRanking
    .map((brandId) =>
      brandId === project.id
        ? project.name
        : (competitors.find((c) => c.id === brandId)?.name ?? 'Unknown')
    )
    .join(', ');

type BrandsIconsStackProps = {
  brandIdsRanking: string[];
  competitors: CompetitorRow[];
  project: ProjectRow;
};

const MAX_ICONS = 6;

export const BrandsIconsStack = ({
  brandIdsRanking,
  competitors,
  project,
}: BrandsIconsStackProps) => {
  const hasOverflow = brandIdsRanking.length > MAX_ICONS;
  const visibleIds = hasOverflow ? brandIdsRanking.slice(0, MAX_ICONS - 1) : brandIdsRanking;
  const hiddenCount = brandIdsRanking.length - visibleIds.length;

  return (
    <div className="flex -space-x-2">
      {visibleIds.map((brandId) => {
        const competitor = competitors.find((c) => c.id === brandId);
        const brand: Brand | undefined = project.id === brandId ? project : competitor;
        if (!brand) return null;
        return (
          <ProjectIcon
            key={brandId}
            size="xs"
            className="ring-bg-primary ring-[1.5px]"
            alt={brand.name ?? brand.hostname}
            src={brand.icon_url}
            placeholder={(brand.name ?? brand.hostname)?.slice(0, 2)}
            color={project.id === brandId ? PROJECT_BRAND_COLOR : getBrandColor(brandId)}
          />
        );
      })}
      {hasOverflow && (
        <ProjectIcon
          size="xs"
          className="ring-bg-primary ring-[1.5px]"
          placeholder={`+${hiddenCount}`}
        />
      )}
    </div>
  );
};

export const BrandsIconsStackWithTooltip = ({
  brandIdsRanking,
  competitors,
  project,
}: BrandsIconsStackProps) => {
  if (!brandIdsRanking.length) return null;

  return (
    <Tooltip
      title="Brands mentions in order"
      description={getBrandNamesList(brandIdsRanking, competitors, project)}
    >
      <BrandsIconsStack
        brandIdsRanking={brandIdsRanking}
        competitors={competitors}
        project={project}
      />
    </Tooltip>
  );
};
