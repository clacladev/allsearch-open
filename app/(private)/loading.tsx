import { MainContainer } from './components/Containers';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';

export default function Loading() {
  return (
    <MainContainer>
      <div className="mx-auto flex h-screen w-full max-w-4xl justify-center space-y-10 p-4 py-12">
        <LoadingIndicator label="Loading..." />
      </div>
    </MainContainer>
  );
}
