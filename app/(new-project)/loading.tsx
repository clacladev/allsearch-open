import { RouteLoading } from '@/components/shared/route-loading';

export default function Loading() {
  return (
    <div className="mx-auto flex h-full w-full justify-center">
      <RouteLoading label="Loading..." />
    </div>
  );
}
