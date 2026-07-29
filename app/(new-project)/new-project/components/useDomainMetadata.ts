import useSWRImmutable from 'swr/immutable';
import { RouteHelper } from '@/libs/routes';
import { appFetch } from '@/hooks/appFetch';
import { DomainMetadata } from '@/libs/utils/urlAnalysis';

export const useDomainMetadata = (inputUrl: string | undefined) =>
  useSWRImmutable(
    inputUrl ? ['domain-metadata', inputUrl] : null,
    async (): Promise<DomainMetadata | undefined> => {
      if (!inputUrl) return;
      if (inputUrl.length <= 4) throw new Error('Invalid URL');
      return appFetch<DomainMetadata>(
        RouteHelper.Api.NewProject.getDomainMetadata(inputUrl),
        undefined,
        'Invalid URL'
      );
    }
  );
