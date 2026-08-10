import { describe, expect, it } from 'bun:test';
import {
  NewProjectStep,
  resumeStepForDraft,
  routeForStep,
} from '@/app/(new-project)/new-project/components/NewProjectContext';

describe('resumeStepForDraft', () => {
  it('leaves Brand, Topics, Prompts and Competitors unchanged', () => {
    expect(resumeStepForDraft(NewProjectStep.Brand)).toBe(NewProjectStep.Brand);
    expect(resumeStepForDraft(NewProjectStep.Topics)).toBe(NewProjectStep.Topics);
    expect(resumeStepForDraft(NewProjectStep.Prompts)).toBe(NewProjectStep.Prompts);
    expect(resumeStepForDraft(NewProjectStep.Competitors)).toBe(NewProjectStep.Competitors);
  });

  it('clamps Save down to Competitors', () => {
    expect(resumeStepForDraft(NewProjectStep.Save)).toBe(NewProjectStep.Competitors);
  });

  it('never routes a resumed draft to /new-project/save', () => {
    expect(routeForStep(resumeStepForDraft(NewProjectStep.Save))).toBe('/new-project/competitors');
  });
});
