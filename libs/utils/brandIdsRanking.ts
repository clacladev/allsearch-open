import { CompetitorRow } from '../database/Competitors/types';
import { ProjectRow } from '../database/Projects/types';

export function getBrandIdsRankingsInText(
  text: string,
  project: ProjectRow,
  competitors: CompetitorRow[]
): string[] {
  const workText = text.toLowerCase();

  // Defines a map of brand id -> brand name, aliases, hostname
  const brandsMap = new Map<string, string[]>();
  brandsMap.set(project.id, getBrandVariations(project.name, project.aliases, project.hostname));
  competitors.forEach((competitor) => {
    brandsMap.set(
      competitor.id,
      getBrandVariations(competitor.name, competitor.aliases, competitor.hostname)
    );
  });

  // Find the earliest position of each brand
  const brandPositions = new Map<string, number>();
  brandsMap.entries().forEach(([brandId, values]) => {
    let position = Infinity;
    values.forEach((value) => {
      const index = getFirstWholeWordMatchPosition(workText, value);
      if (index !== -1 && index < position) {
        position = index;
      }
    });
    brandPositions.set(brandId, position);
  });

  // Sort brand ids by their position
  const brandRanking = brandPositions
    .entries()
    .toArray()
    .filter(([, position]) => position !== Infinity)
    .sort((a, b) => a[1] - b[1])
    .map((a) => a[0]);

  return brandRanking;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getFirstWholeWordMatchPosition(workText: string, value: string) {
  if (!value) return -1;

  const escapedValue = escapeRegex(value);
  const regex = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapedValue})(?=$|[^\\p{L}\\p{N}])`, 'gu');
  const match = regex.exec(workText);
  if (!match) return -1;
  return match.index + match[1].length;
}

function makeBrandNameVariations(brandName: string | null | undefined) {
  if (!brandName) return [];
  const main = brandName.toLowerCase();
  const dashed = main.replace(/ /g, '-');
  const underscored = main.replace(/ /g, '_');
  const oneword = main.replace(/ /g, '');
  const dashToSpaces = main.replace(/-/g, ' ');
  const underscoreToSpaces = main.replace(/_/g, ' ');
  const dotToSpaces = main.replace(/\./g, ' ');
  return [main, dashed, underscored, oneword, dashToSpaces, underscoreToSpaces, dotToSpaces];
}

export function getBrandVariations(
  name: string | null | undefined,
  aliases: string[],
  domain: string
) {
  const variations = [
    ...makeBrandNameVariations(name),
    ...aliases.flatMap(makeBrandNameVariations),
    domain.toLowerCase(),
  ];
  return Array.from(new Set(variations));
}
