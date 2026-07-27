-- Add missing indexes on foreign key columns to improve join and filter performance.

-- competitors
CREATE INDEX idx_competitors_author_id ON public.competitors (author_id);
CREATE INDEX idx_competitors_organization_id ON public.competitors (organization_id);
CREATE INDEX idx_competitors_project_id ON public.competitors (project_id);

-- projects
CREATE INDEX idx_projects_organization_id ON public.projects (organization_id);
CREATE INDEX idx_projects_author_id ON public.projects (author_id);

-- topics
CREATE INDEX idx_topics_author_id ON public.topics (author_id);
CREATE INDEX idx_topics_project_id ON public.topics (project_id);

-- prompts
CREATE INDEX idx_prompts_author_id ON public.prompts (author_id);
CREATE INDEX idx_prompts_organization_id ON public.prompts (organization_id);
CREATE INDEX idx_prompts_project_id ON public.prompts (project_id);
CREATE INDEX idx_prompts_topic_id ON public.prompts (topic_id);
