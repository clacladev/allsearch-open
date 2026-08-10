'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resumeStepForDraft, routeForStep, useNewProjectContext } from './NewProjectContext';

/** `/new-project` used to server-redirect straight to /brand, which threw away the position of a
 * restored draft (the draft is localStorage, invisible to the server). The provider renders its
 * children only once hydration has run, so by the time this mounts `getCorrectStep()` already
 * reflects the restored draft. `replace`, not `push`: this stands in for a server redirect and
 * must not leave /new-project in history. */
export default function ResumeDraft() {
  const router = useRouter();
  const { getCorrectStep } = useNewProjectContext();

  useEffect(() => {
    router.replace(routeForStep(resumeStepForDraft(getCorrectStep())));
  }, []);

  return null;
}
