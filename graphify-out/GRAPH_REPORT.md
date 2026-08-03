# Graph Report - .  (2026-08-03)

## Corpus Check
- Large corpus: 673 files · ~486,551 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2302 nodes · 6402 edges · 127 communities (100 shown, 27 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.72)
- Token cost: 138,828 input · 0 output

## Community Hubs (Navigation)
- AI Crawl Checker
- Collection Run Loop
- Data Table Cell Widgets
- New Project Draft Context
- Onboarding Brand And Competitors
- Prompt Articles API
- Column Filter Components
- Base Form Inputs
- Brands Page And Filter Params
- Slide-Out Menu Panels
- AI System Prompt Contracts
- Provider Keys And Chatbot Settings
- Tabs And Badge Styles
- Settings API Routes
- Opportunities Table And Badges
- Prompt Response Queries
- Loading And Error Boundaries
- Article Outline Editor
- Overview Charts And Tables
- AI Model Providers
- Collection Run Triggers
- Metrics Charts And Downloads
- New Project Report
- Organization API And Event Bus
- Project Analysis Aggregates
- Domain Utils And Opportunities
- Chatbot Logo And Response Preview
- Date Picker Calendar
- Prompt Article UI
- Private Layout And Competitors
- Project Detail Views
- Progress Steps Component
- Prompts Queries And Views
- Background Asset Patterns
- AI Call Outcome Handling
- Input And Tooltip Primitives
- Response Sources And Sentiment
- Standard Table And Empty State
- Header And Settings Pages
- Article Schema UI
- Project And Source API Routes
- Prompt Article Persistence
- Article Outline Markdown
- Carousel Component
- Confirm Modal Views
- Progress Indicators And Close Buttons
- Pagination Component
- Database Client
- App Navigation Sidebar
- Topics And Prompts API
- Project Components
- Illustration Assets
- Chatbot Coverage Settings
- Collection And Provider Key ADRs
- URL Analysis Utils
- Projects Queries API
- Table Component
- Competitors Queries API
- Modal And Copy Button
- Button Group Controls
- Empty State Component
- Social Login Buttons
- PIN Input Component
- Testing And SQLite ADRs
- UI Replacement And Vercel Docs
- New Project AI Errors
- Project Select Views
- Slideout Menu Component
- Agent Docs Conventions
- Article PDF Export
- App Error Pages
- Base Avatar Component
- CLI Packaging ADR
- Navigation Avatar Widgets
- Article Stream Sentinels
- Pagination Variants
- Alerts And Featured Icons
- Badge Component
- Rating Stars And Badges
- Messages Context
- Project Detail Widgets
- Collection Cadence ADRs
- Auth Removal ADRs
- Article Streaming
- Pagination Buttons
- Radio Button Component
- Client Layout Providers
- Environment Config
- Section Headers
- Theme Toggle Button
- Button Component
- Checkbox Component
- Illustration Assets Two
- Illustration Assets Three
- Sidebar Navigation
- Root App Layout
- Social Icons Set One
- User Location Parsing
- Square Icon Component
- Project Detail Fragments
- Content Divider
- Social Icons Set Two
- Social Icons Set Three
- Social Icons Set Four
- Social Icons Set Five
- Social Icons Set Six
- Social Icons Set Seven
- Social Icons Set Eight
- Social Icons Set Nine
- Social Icons Set Ten
- Social Icons Set Eleven
- Social Icons Set Twelve
- Social Icons Set Thirteen
- Social Icons Set Fourteen
- Social Icons Set Fifteen
- Social Icons Set Sixteen
- Social Icons Set Seventeen
- Social Icons Set Eighteen
- Social Icons Set Nineteen
- Social Icons Set Twenty
- Social Icons Set Twentyone
- Social Icons Set Twentytwo
- Profiling Timing Helper

## God Nodes (most connected - your core abstractions)
1. `getDatabase()` - 92 edges
2. `getProjectRowWithId()` - 52 edges
3. `RouteHelper` - 51 edges
4. `Button()` - 50 edges
5. `getISODateString()` - 49 edges
6. `usePrivateLayoutContext()` - 33 edges
7. `ProjectRow` - 33 edges
8. `LoadingIndicator()` - 31 edges
9. `CompetitorRow` - 30 edges
10. `getDefaultAnalysisDateRange()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --indirect_call--> `fetchDailyPromptsForProjectWorkflow()`  [INFERRED]
  app/api/new-project/save/route.ts → libs/workflows/fetchDailyPromptsForProject/index.ts
- `POST()` --indirect_call--> `updateLastDayOfPromptResponsesAnalysis()`  [INFERRED]
  app/api/project/[projectId]/update-last-day-of-prompt-responses-analysis/route.ts → libs/workflows/updateLastDayOfPromptResponsesAnalysis/index.ts
- `Development Guidelines` --semantically_similar_to--> `Core principles: simplicity, minimal impact, no laziness`  [INFERRED] [semantically similar]
  docs/development-guidelines.md → docs/workflow.md
- `KeysPage()` --calls--> `getProviderKeyFromStorage()`  [EXTRACTED]
  app/(new-project)/keys/page.tsx → libs/database/Settings/queries.ts
- `CompetitorsForm()` --calls--> `isAiErrorCode()`  [EXTRACTED]
  app/(new-project)/new-project/competitors/CompetitorsForm.tsx → libs/ai/errors.ts

## Import Cycles
- 3-file cycle: `app/(private)/components/project/ProjectIcon.tsx -> app/(private)/components/project/ProjectSelectorCard.tsx -> app/(private)/components/project/ProjectIconLabelGroup.tsx -> app/(private)/components/project/ProjectIcon.tsx`
- 3-file cycle: `libs/database/Projects/types.ts -> libs/database/schema.ts -> libs/utils/urlAnalysis.ts -> libs/database/Projects/types.ts`
- 3-file cycle: `libs/database/Competitors/types.ts -> libs/database/schema.ts -> libs/utils/urlAnalysis.ts -> libs/database/Competitors/types.ts`
- 4-file cycle: `app/(private)/components/project/ProjectIcon.tsx -> app/(private)/components/project/ProjectStatusIndicator.tsx -> app/(private)/components/project/ProjectSelectorCard.tsx -> app/(private)/components/project/ProjectIconLabelGroup.tsx -> app/(private)/components/project/ProjectIcon.tsx`
- 4-file cycle: `libs/database/Projects/types.ts -> libs/database/schema.ts -> libs/utils/urlAnalysis.ts -> libs/utils/brandIdsRanking.ts -> libs/database/Projects/types.ts`
- 4-file cycle: `libs/database/Competitors/types.ts -> libs/database/schema.ts -> libs/utils/urlAnalysis.ts -> libs/utils/brandIdsRanking.ts -> libs/database/Competitors/types.ts`

## Hyperedges (group relationships)
- **Collection Run execution model (entity, streaming surface, job table, concurrency)** — docs_adr_0002_collection_is_manual_and_weekly_by_default_collection_run, docs_adr_0007_first_run_streams_the_collection_run_streaming_report, docs_adr_0009_replace_workflow_devkit_with_a_sqlite_job_table_collection_run_items, docs_adr_0009_replace_workflow_devkit_with_a_sqlite_job_table_concurrency_limiter, docs_adr_0009_replace_workflow_devkit_with_a_sqlite_job_table_resume_after_quit [EXTRACTED 1.00]
- **Removing hosted dependencies: Supabase, Vercel Gateway, Workflow DevKit, Vercel deploy** — docs_adr_0006_sqlite_with_drizzle_sqlite_with_drizzle, docs_adr_0004_direct_provider_keys_not_a_gateway_direct_provider_keys, docs_adr_0009_replace_workflow_devkit_with_a_sqlite_job_table_sqlite_job_table, docs_adr_0010_ship_as_a_cli_that_opens_the_browser_cli_opens_browser, docs_tech_stack_tech_stack [INFERRED 0.85]
- **Gates on the first public release (license swap, private phase, packaging, signing)** — docs_adr_0005_untitled_ui_must_be_replaced_before_public_release_private_repo_gate, docs_adr_0005_untitled_ui_must_be_replaced_before_public_release_shadcn_ui, docs_adr_0010_ship_as_a_cli_that_opens_the_browser_cli_opens_browser, docs_adr_0010_ship_as_a_cli_that_opens_the_browser_code_signing_debt [EXTRACTED 1.00]
- **Brand Visibility Pipeline: categories to prompts** — libs_ai_topicsideas_researchsystemprompt_category_research, libs_ai_topicsideas_objectsystemprompt_category_extraction, libs_ai_promptsideas_researchsystemprompt_brand_prompt_ideas, libs_ai_promptsideas_objectsystemprompt_topic_prompt_extraction, libs_ai_competitors_researchsystemprompt_competitor_research_prompt [INFERRED 0.85]
- **Research-then-Object Two-Stage Prompt Pattern** — libs_ai_competitors_objectsystemprompt_competitor_parsing_prompt, libs_ai_productpromptideas_objectsystemprompt_group_prompt_extraction, libs_ai_promptsideas_objectsystemprompt_topic_prompt_extraction, libs_ai_topicsideas_objectsystemprompt_category_extraction [EXTRACTED 1.00]
- **Outline-to-Article Generation Flow** — libs_ai_promptarticles_outlinesystemprompt_outline_generator, libs_ai_promptarticles_outlinesystemprompt_keypoint, libs_ai_promptarticles_outlinesystemprompt_competing_sources, libs_ai_promptarticles_articlesystemprompt_article_writer, libs_ai_promptarticles_articlesystemprompt_article_settings [EXTRACTED 1.00]

## Communities (127 total, 27 thin omitted)

### Community 0 - "AI Crawl Checker"
Cohesion: 0.06
Nodes (50): BodySchema, dynamic, getClientIp(), POST(), rateBuckets, rateLimit(), runtime, RFC-9309 (+42 more)

### Community 1 - "Collection Run Loop"
Cohesion: 0.09
Nodes (45): cancelCollectionRun(), retryFailedCollectionRunItems(), drainCollectionRuns(), executeCollectionRun(), executeGroup(), getErrorMessage(), resumeInterruptedCollectionRuns(), getDatabase() (+37 more)

### Community 2 - "Data Table Cell Widgets"
Cohesion: 0.08
Nodes (31): Tooltip(), TooltipIcon(), columnHelper, BrandsRankingTodayRadial(), VisualContainer(), BrandPositionBadge(), BrandsIconsStackWithTooltip(), getBrandNamesList() (+23 more)

### Community 3 - "New Project Draft Context"
Cohesion: 0.08
Nodes (34): getPromptsMapFromTopicRows(), getTopicsMapFromIds(), dynamic, FormHeader(), isEmptyDraft(), NewProjectBrand, NewProjectCompetitors, NewProjectContext (+26 more)

### Community 4 - "Onboarding Brand And Competitors"
Cohesion: 0.11
Nodes (31): OrganizationTypeSchema, UpdateOrganizationResponse, NewProjectLayoutColumn(), BrandForm(), metadata, CompetitorsForm(), useCompetitors(), metadata (+23 more)

### Community 5 - "Prompt Articles API"
Cohesion: 0.11
Nodes (40): loadPromptArticleWithOwnershipCheck(), OwnershipResult, PATCH(), PatchBodySchema, POST(), PostBodySchema, RouteParams, BodySchema (+32 more)

### Community 6 - "Column Filter Components"
Cohesion: 0.09
Nodes (37): FilterBar(), FilterBarProps, FilterToggle(), FilterToggleProps, encodeMultiSelectFilter(), encodeNumberRangeFilter(), encodeTextFilter(), FilterOption (+29 more)

### Community 7 - "Base Form Inputs"
Cohesion: 0.09
Nodes (31): Avatar(), AvatarSize, styles, HintText(), HintTextProps, Label(), LabelProps, COMMIT_KEYS (+23 more)

### Community 8 - "Brands Page And Filter Params"
Cohesion: 0.13
Nodes (34): applyMultiSelectFilter(), applyNumberRangeFilter(), applyTextFilter(), parseMultiSelectFilter(), parseNumberRangeFilter(), parseTextFilter(), getAvailableBrandsData(), getBrandsSourcesData() (+26 more)

### Community 9 - "Slide-Out Menu Panels"
Cohesion: 0.14
Nodes (29): ExportActionsButton(), SlideoutMenu(), SlideoutMenuProps, EditPromptSlideoutMenu(), FetchNewPromptResponsesBanner(), useFetchNewPromptResponses(), NewPromptSlideoutMenu(), PromptsTable() (+21 more)

### Community 10 - "AI System Prompt Contracts"
Cohesion: 0.06
Nodes (43): Competitor JSON Object Shape (name, url), Competitor Object Extraction Prompt, Root Domain Normalization and Dedup Rule, Competitor Exclusion Rules, Competitor Line Format (Name em dash domain), Competitive Research Analyst Prompt, Target Location Handling (Competitors), Web Research Grounding Requirement (+35 more)

### Community 11 - "Provider Keys And Chatbot Settings"
Cohesion: 0.08
Nodes (27): AiFailureState(), FailureCopy, getAiFailureStateCopy(), PROVIDER_LABELS, PROVIDER_LABELS, ProviderKeyField(), STATUS_BADGE, STATUS_HINT (+19 more)

### Community 12 - "Tabs And Badge Styles"
Cohesion: 0.08
Nodes (35): getColorStyles(), getHorizontalStyles(), getTabStyles(), HorizontalTypes, Orientation, sizes, Tab(), TabComponentProps (+27 more)

### Community 13 - "Settings API Routes"
Cohesion: 0.10
Nodes (34): PATCH(), SetEnabledChatbotIdsBodySchema, SetEnabledChatbotIdsResponse, DELETE(), logSettingsRouteError(), POST(), ProviderIdSchema, RemoveProviderKeyBodySchema (+26 more)

### Community 14 - "Opportunities Table And Badges"
Cohesion: 0.11
Nodes (31): ActionBadge(), DIFFICULTY_MAP, DIFFICULTY_TOOLTIP, DifficultyBadge(), DifficultyBadgeProps, getPriorityLabel(), PRIORITY_LEVELS, PRIORITY_SCORE_TOOLTIP (+23 more)

### Community 15 - "Prompt Response Queries"
Cohesion: 0.11
Nodes (30): POST(), getPromptResponsesContent(), getPromptResponsesData(), deletePromptResponseRowsWithProjectId(), deletePromptResponseRowsWithPromptIds(), getPromptResponseRowsWithPromptIdInDateRange(), InsertPromptResponseRowInput, SUMMARY_COLUMNS (+22 more)

### Community 16 - "Loading And Error Boundaries"
Cohesion: 0.11
Nodes (8): MainContainer(), Loading(), LoadingIndicator(), LoadingIndicatorColor, LoadingIndicatorProps, STROKE_COLOR_CLASS, styles, TEXT_FG_COLOR_CLASS

### Community 17 - "Article Outline Editor"
Cohesion: 0.09
Nodes (32): EditableHeading, EditableHeadingRow(), EditableOutlineCard(), HEADING_LEVEL, newUid(), Props, RowProps, stripUid() (+24 more)

### Community 18 - "Overview Charts And Tables"
Cohesion: 0.10
Nodes (25): SENTIMENT_LABELS, SentimentChart(), getSentimentScoresBarChartData(), SentimentScoresBarChart(), SentimentScoresBarChartItem, sentimentToPercentage(), TopOpportunitiesTable(), TopSourceContentsTable() (+17 more)

### Community 19 - "AI Model Providers"
Cohesion: 0.13
Nodes (26): getCompetitors(), Schema, getProviderKey(), googleModel(), openaiModel(), perplexityModel(), PROVIDER_ENV_VAR, getProductPromptIdeas() (+18 more)

### Community 20 - "Collection Run Triggers"
Cohesion: 0.16
Nodes (23): GET(), GET(), GET(), POST(), createCollectionRun(), CreateCollectionRunInput, resolveProjectRowsToCollect(), ensureCollectionRunLoopIsRunning() (+15 more)

### Community 21 - "Metrics Charts And Downloads"
Cohesion: 0.07
Nodes (13): StandardTableActionsDropdownItem, ArticleDownloadButtons(), Props, slugify(), lineData, lineData2, lineData3, MetricChangeIndicatorProps (+5 more)

### Community 22 - "New Project Report"
Cohesion: 0.11
Nodes (23): REPORT_TRY_AGAIN_LATER_ERROR_CODE, metadata, getMentionsTotal(), Report(), useReportBrandRankings(), ProjectIcon(), BrandsRankingTodayRadialItem, getBrandsRankingTodayRadialData() (+15 more)

### Community 23 - "Organization API And Event Bus"
Cohesion: 0.11
Nodes (24): PATCH(), POST(), OrganizationSchema, NewProjectPage(), metadata, OrganizationPage(), EVENT_XXX, EventCallback (+16 more)

### Community 24 - "Project Analysis Aggregates"
Cohesion: 0.13
Nodes (25): PromptResponseSummaryRow, SourceSummaryRow, getOverviewData(), MAX_TOP_OPPORTUNITIES, MAX_TOP_SOURCE_CONTENTS, MAX_TOP_SOURCE_DOMAINS, getRankingsSummary(), getSentimentDataset() (+17 more)

### Community 25 - "Domain Utils And Opportunities"
Cohesion: 0.11
Nodes (28): areDomainsRelated(), extractBaseDomain(), KNOWN_SECOND_LEVEL_DOMAINS, isDomainCategory(), getOpportunitiesSummary(), getProjectSourceNeedsImprovementOpportunities(), getProjectSourceNotCitedOpportunities(), getProjectSourceNotConsistentlyFoundOpportunities() (+20 more)

### Community 26 - "Chatbot Logo And Response Preview"
Cohesion: 0.11
Nodes (20): CHATBOT_ICONS, CHATBOT_LOGO_ALT, ChatbotLogoImage(), PromptResponsePreviewCard(), getSentimentInfo(), getSentimentLabel(), SentimentIcon(), SentimentInfo (+12 more)

### Community 27 - "Date Picker Calendar"
Cohesion: 0.09
Nodes (17): Calendar(), CalendarProps, CalendarCell(), CalendarCellProps, DateInput(), DateInputProps, DatePickerProps, highlightedDates (+9 more)

### Community 28 - "Prompt Article UI"
Cohesion: 0.10
Nodes (25): EditableArticle(), MarkdownArticleEditor, Props, formatRelative(), Props, SaveStatusPill(), Action, Params (+17 more)

### Community 29 - "Private Layout And Competitors"
Cohesion: 0.18
Nodes (17): EMPTY_PROMPT_ANALYSIS, PromptAnalysis, PrivateLayoutContext, PrivateLayoutContextType, BrandsSourcesResult, columnHelper, createPromptsTableColumnDefs(), PromptsTableMeta (+9 more)

### Community 30 - "Project Detail Views"
Cohesion: 0.10
Nodes (17): ArticleStatus, formatRelativeTime(), getArticleStatus(), PreviouslyGeneratedArticlesSection(), DifficultyBadgeWithTooltip(), PriorityScoreBadgeWithTooltip(), RecentResponsesMap, SourceIdMap (+9 more)

### Community 31 - "Progress Steps Component"
Cohesion: 0.12
Nodes (21): Progress, progressIcons, CommonProps, ComponentType, IconType, ItemsType, ProgressFeaturedIconType, ProgressIconsCenteredProps (+13 more)

### Community 32 - "Prompts Queries And Views"
Cohesion: 0.26
Nodes (19): GET(), POST(), getPromptsAnalysis(), getOpportunitiesData(), getOverviewPageData(), getPromptsData(), applyChatbotFilter(), getSourcesContentData() (+11 more)

### Community 33 - "Background Asset Patterns"
Cohesion: 0.09
Nodes (10): Circle(), sizes, GridCheck(), sizes, Grid(), sizes, BackgroundPattern(), patterns (+2 more)

### Community 34 - "AI Call Outcome Handling"
Cohesion: 0.13
Nodes (15): ADR-0009, AiCallOutcome, callAiWithRetry(), getRetryAfterMs(), aiCallLimiter, ConcurrencyLimiter, MAX_CONCURRENT_AI_CALLS, MAX_CONCURRENT_PROMPT_GROUPS (+7 more)

### Community 35 - "Input And Tooltip Primitives"
Cohesion: 0.12
Nodes (16): NavItemButtonProps, styles, AvatarAddButtonProps, sizes, BaseProps, InputGroupProps, InputPrefixProps, InputBaseProps (+8 more)

### Community 36 - "Response Sources And Sentiment"
Cohesion: 0.15
Nodes (20): getPromptResponseWithGoogleAIMode(), analyzeResponseSentiment(), Schema, VALID_SENTIMENT_VALUES, analysePromptResponseSources(), analysePromptResponsesForBrandRankings(), analysePromptResponsesSentiment(), analysePromptResponsesSources() (+12 more)

### Community 37 - "Standard Table And Empty State"
Cohesion: 0.15
Nodes (14): EmptyState(), StandardTable(), StandardTableFooterContainer(), BrandsSourcesTableInner(), BrandsSourcesTableMeta, createBrandsSourcesTableColumnDefs(), CreateArticleOutlineCTA(), createSourceContentsTableColumnDefs() (+6 more)

### Community 38 - "Header And Settings Pages"
Cohesion: 0.13
Nodes (14): Header(), Props, PromptDetails(), ProjectPromptsPage(), Props, SourceDetails(), ProjectSourceDetailsPage(), Props (+6 more)

### Community 39 - "Article Schema UI"
Cohesion: 0.17
Nodes (20): ArticleSettingsFields(), ArticleSettingsFieldsValue, articleSettingsFromValue(), articleSettingsToValue(), ArticleSettingsValidity, Props, TOOLTIPS, validateArticleSettingsFieldsValue() (+12 more)

### Community 40 - "Project And Source API Routes"
Cohesion: 0.23
Nodes (18): POST(), PromptIdsSchema, SaveNewProjectResponse, TopicsSchema, POST(), remapBrandIds(), remapSentiment(), dateKey() (+10 more)

### Community 41 - "Prompt Article Persistence"
Cohesion: 0.16
Nodes (17): GET(), SANITIZE_OPTIONS, slugify(), GET(), SANITIZE_OPTIONS, slugify(), wrapInDocument(), BodySchema (+9 more)

### Community 42 - "Article Outline Markdown"
Cohesion: 0.13
Nodes (18): CitationsPanel(), Props, classifyAiErrorCode(), classifyOutlineError(), EditorProps, GenerateArticleOutlineArgs, GeneratePromptArticleResponse, NewArticleOutline() (+10 more)

### Community 43 - "Carousel Component"
Cohesion: 0.12
Nodes (17): Carousel, CarouselContent(), CarouselContentProps, CarouselContext, CarouselContextProps, CarouselIndicator(), CarouselIndicatorGroup(), CarouselIndicatorGroupProps (+9 more)

### Community 44 - "Confirm Modal Views"
Cohesion: 0.15
Nodes (16): ConfirmModal(), ModalProps, Variant, ArticleView(), computeReadTime(), Mode, Props, formatDateRange() (+8 more)

### Community 45 - "Progress Indicators And Close Buttons"
Cohesion: 0.12
Nodes (13): FeaturedCardCommonProps, CloseButton(), CloseButtonProps, sizes, themes, ProgressBarCircle(), ProgressBarProps, sizes (+5 more)

### Community 46 - "Pagination Component"
Cohesion: 0.10
Nodes (11): PaginationContext, PaginationContextComponentProps, PaginationContextType, PaginationEllipsisProps, PaginationEllipsisType, PaginationItemProps, PaginationItemRenderProps, PaginationItemType (+3 more)

### Community 47 - "Database Client"
Cohesion: 0.17
Nodes (16): AllSearchDatabase, createDatabase(), databasePromises, hasAnyTable(), preExistingDatabases, wasDatabasePreExisting(), compactIsoTimestamp(), DrizzleMigrationsRow (+8 more)

### Community 48 - "App Navigation Sidebar"
Cohesion: 0.20
Nodes (12): TODO: Cleanup when subscription is implemented, SidebarNavigationProps, MobileNavigationHeader(), NavItemBase(), NavItemBaseProps, styles, NavList(), NavListProps (+4 more)

### Community 49 - "Topics And Prompts API"
Cohesion: 0.31
Nodes (14): findOrCreateCustomTopic(), PATCH(), POST(), DELETE(), PATCH(), POST(), insertPromptRow(), updatePromptRowWithId() (+6 more)

### Community 50 - "Project Components"
Cohesion: 0.18
Nodes (13): ProjectIconProps, ProjectIconSize, styles, ProjectIconLabelGroup(), ProjectIconLabelGroupProps, styles, NavProjectType, ProjectSelectorCard() (+5 more)

### Community 51 - "Illustration Assets"
Cohesion: 0.12
Nodes (9): BoxIllustration(), IllustrationProps, sizes, DocumentsIllustration(), IllustrationProps, sizes, Illustration(), IllustrationProps (+1 more)

### Community 52 - "Chatbot Coverage Settings"
Cohesion: 0.21
Nodes (11): ChatbotCoverageCaption(), getChatbotCoverageCaption(), joinLabels(), DIFFICULTY_OPTIONS, PRIORITY_OPTIONS, OPPORTUNITIES_SORT_FIELDS, OpportunitiesSortField, Props (+3 more)

### Community 54 - "Collection And Provider Key ADRs"
Cohesion: 0.15
Nodes (17): Chatbot as a provider adapter plus a key, ADR 0004: Direct provider keys, not an AI gateway, Google key alone yields a fully working product, Measurement fidelity (provider-native web search), Visibility percentage depends on the covered Chatbot set, Key entry comes first and is validated with a real test call, Three new key failure states: no key, invalid key, quota exceeded, No cost estimate or running total is shown (+9 more)

### Community 55 - "URL Analysis Utils"
Cohesion: 0.19
Nodes (13): GET(), assertPublicHostname(), customDispatcher, DEFAULT_FETCH_TIMEOUT, DEFAULT_USER_AGENT_HEADER, DomainMetadata, extractBrandName(), extractPageMetadata() (+5 more)

### Community 56 - "Projects Queries API"
Cohesion: 0.21
Nodes (11): BrandSchema, ArchiveProjectBodySchema, POST(), POST(), POST(), PATCH(), deleteProjectRow(), InsertProjectRowInput (+3 more)

### Community 57 - "Table Component"
Cohesion: 0.12
Nodes (8): TableCardHeaderProps, TableCellProps, TableContext, TableHeaderProps, TableHeadProps, TableRootProps, TableRowProps, TableSize

### Community 58 - "Competitors Queries API"
Cohesion: 0.29
Nodes (13): CompetitorSchema, DELETE(), GET(), PATCH(), POST(), isCompetitorUnique(), getCompetitorRowsWithProjectId(), getCompetitorRowWithId() (+5 more)

### Community 59 - "Modal And Copy Button"
Cohesion: 0.20
Nodes (11): CopyButton(), headingsToMarkdown(), SourceHeadersModal(), HEADING_LEVEL, SourceHeadingsList(), SourceHeadingsListProps, Dialog(), DialogTrigger (+3 more)

### Community 60 - "Button Group Controls"
Cohesion: 0.17
Nodes (12): CHART_VARIANTS, OverviewChartType, OverviewChartTypeGroup(), SourcesTypeButtonGroup(), TABLE_VARIANT, ButtonGroup(), ButtonGroupContext, ButtonGroupItem() (+4 more)

### Community 61 - "Empty State Component"
Cohesion: 0.15
Nodes (6): EmptyState, HeaderProps, RootContext, RootContextProps, RootProps, BackgroundPatternProps

### Community 62 - "Social Login Buttons"
Cohesion: 0.27
Nodes (13): ButtonProps, CommonProps, LinkProps, SocialButton(), SocialButtonProps, styles, AppleLogo(), DribbleLogo() (+5 more)

### Community 63 - "PIN Input Component"
Cohesion: 0.17
Nodes (11): Description(), Group(), GroupProps, Label(), PinInput, PinInputContext, PinInputContextType, RootProps (+3 more)

### Community 64 - "Testing And SQLite ADRs"
Cohesion: 0.15
Nodes (15): project-analysis analysis layer (libs/utils/project-analysis), asAdmin query option (RLS bypass, removed), Forward-only migrations with pre-migration backup, Plain SQLite, not libSQL/Turso, Schema-as-code generates row types (removes hand-written *Row drift), ADR 0006: SQLite with Drizzle, schema ported as-is, E2E drives the Next.js server directly, bypassing the desktop shell, A fake AI provider was considered and rejected (+7 more)

### Community 65 - "UI Replacement And Vercel Docs"
Cohesion: 0.18
Nodes (15): Repository stays private until the component swap completes, ADR 0005: Untitled UI PRO must be replaced before the repo goes public, shadcn/ui (MIT, vendored, Radix + Tailwind), Untitled UI PRO (vendored, commercially licensed), Environment detection helpers (libs/env.ts), Key Patterns, RouteHelper and ROUTES (libs/routes.ts), UI pattern reuse: read the existing implementation first (+7 more)

### Community 66 - "New Project AI Errors"
Cohesion: 0.26
Nodes (10): GET(), Competitor, GET(), GET(), aiErrorCodeToStatus(), aiErrorToResponseInit(), isMissingProviderKeyError(), toAiError() (+2 more)

### Community 67 - "Project Select Views"
Cohesion: 0.22
Nodes (9): metadata, Competitor, SETTINGS_TABS, Tab, Settings(), generateMetadata(), ProjectSettingsPage(), Props (+1 more)

### Community 68 - "Slideout Menu Component"
Cohesion: 0.18
Nodes (9): DialogProps, Menu(), Modal(), ModalOverlay(), ModalOverlayProps, ModalProps, SlideoutHeaderProps, SlideoutMenu (+1 more)

### Community 69 - "Agent Docs Conventions"
Cohesion: 0.18
Nodes (14): docs/adr/ decision record directory, CONTEXT.md / CONTEXT-MAP.md glossary, Domain Docs consumption guide, Flag ADR conflicts explicitly rather than overriding silently, Local Markdown issue tracker (.scratch/<feature-slug>/), Status: line recording triage state in each issue file, Wayfinding operations (map, child ticket, frontier, claim, resolve), Five canonical triage labels (+6 more)

### Community 70 - "Article PDF Export"
Cohesion: 0.26
Nodes (11): GET(), slugify(), HEADING_STYLES, inlineFromTokens(), markdownToPdfmakeDoc(), PdfContent, PdfDocDefinition, PdfInline (+3 more)

### Community 71 - "App Error Pages"
Cohesion: 0.24
Nodes (3): TextBackground(), ADR-0003, ROUTES

### Community 72 - "Base Avatar Component"
Cohesion: 0.15
Nodes (8): AvatarCompanyIconProps, sizes, AvatarOnlineIndicator(), AvatarOnlineIndicatorProps, sizes, sizes, VerifiedTick(), VerifiedTickProps

### Community 73 - "CLI Packaging ADR"
Cohesion: 0.18
Nodes (13): createDatabase() runtime-adaptive driver import, node:sqlite driver via drizzle-orm/node-sqlite, Bun is the toolchain, Node is the runtime, ADR 0010: Ship as a CLI that opens the browser, Code signing and Gatekeeper debt at native launch, Electron running standalone Next.js on localhost (deferred shell), Nextron disqualified (requires output: 'export'), Code style rules (guard clauses, implicit returns, no any) (+5 more)

### Community 74 - "Navigation Avatar Widgets"
Cohesion: 0.20
Nodes (7): NavAccountType, placeholderAccounts, AvatarProps, AvatarLabelGroup(), AvatarLabelGroupProps, styles, RadioButtonBase()

### Community 75 - "Article Stream Sentinels"
Cohesion: 0.20
Nodes (9): ArticleCacheHit, ArticleStreamStatus, Params, StartArgs, UseArticleStreamingResult, encodeStreamError(), extractStreamError(), NUL (+1 more)

### Community 76 - "Pagination Variants"
Cohesion: 0.18
Nodes (4): MobilePaginationProps, PaginationButtonGroupProps, PaginationCardMinimalProps, PaginationProps

### Community 77 - "Alerts And Featured Icons"
Cohesion: 0.22
Nodes (7): AlertFloatingProps, AlertFullWidthProps, iconMap, FeaturedIcon(), FeaturedIconProps, iconsSizes, styles

### Community 78 - "Badge Component"
Cohesion: 0.22
Nodes (9): Align, BadgeGroup(), BadgeGroupProps, baseClasses, Color, colorClasses, getSizeClasses(), Size (+1 more)

### Community 79 - "Rating Stars And Badges"
Cohesion: 0.24
Nodes (5): RatingBadgeProps, getStarProgress(), RatingStars(), RatingStarsProps, StarIconProps

### Community 80 - "Messages Context"
Cohesion: 0.22
Nodes (7): HIDE_MESSAGE_ONE_DAY_MS, MessagesContext, MessagesContextProvider(), MessagesContextType, MessagesPayload, useMessagesContext(), Sidebar()

### Community 81 - "Project Detail Widgets"
Cohesion: 0.33
Nodes (5): usePrivateLayoutContext(), CurrentProjectSetter(), DeveloperTools(), UpdateSourcesAnalisysAlert(), useUpdateSourcesAnalysis()

### Community 82 - "Collection Cadence ADRs"
Cohesion: 0.22
Nodes (9): AllSearch SaaS (clacladev/allsearch), ADR 0001: Clean import from the SaaS repo, no shared history, No secrets cross over, only env variable shape, Collection Run (first-class entity), getRankingsSummary (latest completed Collection Run), ADR 0002: Collection is manual and weekly by default, No scheduler, launch-at-login or tray residency, Charts must render sparse and gappy series honestly (+1 more)

### Community 83 - "Auth Removal ADRs"
Cohesion: 0.31
Nodes (9): Authorization disappears rather than moving into app code, admin-tools survives ungated as a Developer tab, ADR 0003: No user identity; Organization demoted to settings, Organization as a single settings row (agency or in-house), Playwright auth setup and magic-auth helpers deleted, Common bun commands, import_project.sh: import project from production dump, magic-auth OTP backdoor (/api/admin/magic-auth) (+1 more)

### Community 84 - "Article Streaming"
Cohesion: 0.31
Nodes (8): ARTICLE_MAX_OUTPUT_TOKENS, ARTICLE_MODEL_ID, ArticleSourceForPrompt, buildUserPrompt(), renderOutlineForPrompt(), renderSourceForPrompt(), StreamArticleInput, tagToMarkdownPrefix()

### Community 85 - "Pagination Buttons"
Cohesion: 0.29
Nodes (4): Pagination, PaginationRootProps, PaginationDotProps, PaginationLineProps

### Community 86 - "Radio Button Component"
Cohesion: 0.29
Nodes (5): RadioButtonBaseProps, RadioButtonProps, RadioGroupContext, RadioGroupContextType, RadioGroupProps

### Community 87 - "Client Layout Providers"
Cohesion: 0.32
Nodes (5): ClientLayout(), react-aria-components, RouteProvider(), RouterConfig, ThemeProvider()

### Community 88 - "Environment Config"
Cohesion: 0.25
Nodes (6): env, Environment, isDevEnv, isPreProductionEnv, isPreviewEnv, isProdEnv

### Community 90 - "Theme Toggle Button"
Cohesion: 0.38
Nodes (6): Props, getNextTheme(), Theme, THEMES, ThemeToggleButton(), ThemeToggleCompactButton()

### Community 91 - "Button Component"
Cohesion: 0.38
Nodes (6): ButtonProps, ButtonUtility(), CommonProps, LinkProps, Props, styles

### Community 92 - "Checkbox Component"
Cohesion: 0.38
Nodes (5): CheckboxBase(), CheckboxBaseProps, CheckboxProps, CheckboxGroupProps, RadioGroupItemType

### Community 93 - "Illustration Assets Two"
Cohesion: 0.29
Nodes (3): CloudIllustration(), IllustrationProps, sizes

### Community 94 - "Illustration Assets Three"
Cohesion: 0.29
Nodes (3): CreditCardIllustration(), IllustrationProps, sizes

### Community 95 - "Sidebar Navigation"
Cohesion: 0.40
Nodes (4): BOOK_DEMO_SIDEBAR_CARD_ID, BookDemoSidebarCard(), SidebarCard(), SidebarCardProps

### Community 96 - "Root App Layout"
Cohesion: 0.40
Nodes (3): inter, metadata, viewport

### Community 98 - "User Location Parsing"
Cohesion: 0.67
Nodes (3): COUNTRY_NAME_TO_ISO2, parseTargetLocation(), resolveCountry()

## Ambiguous Edges - Review These
- `Competitive Research Analyst Prompt` → `Competing Sources (articles cited in AI answers)`  [AMBIGUOUS]
  libs/ai/promptArticles/outlineSystemPrompt.md · relation: conceptually_related_to

## Knowledge Gaps
- **500 isolated node(s):** `metadata`, `dynamic`, `metadata`, `metadata`, `NewProjectDraftPayload` (+495 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Competitive Research Analyst Prompt` and `Competing Sources (articles cited in AI answers)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Button()` connect `Slide-Out Menu Panels` to `New Project Draft Context`, `Onboarding Brand And Competitors`, `Column Filter Components`, `Provider Keys And Chatbot Settings`, `Article Outline Editor`, `Overview Charts And Tables`, `Metrics Charts And Downloads`, `New Project Report`, `Date Picker Calendar`, `Prompt Article UI`, `Project Detail Views`, `Standard Table And Empty State`, `Article Schema UI`, `Article Outline Markdown`, `Confirm Modal Views`, `Progress Indicators And Close Buttons`, `Project Components`, `Modal And Copy Button`, `App Error Pages`, `Navigation Avatar Widgets`, `Pagination Variants`, `Alerts And Featured Icons`, `Theme Toggle Button`, `Sidebar Navigation`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `chunk()` connect `AI Crawl Checker` to `Collection Run Triggers`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `RouteHelper` connect `Slide-Out Menu Panels` to `Data Table Cell Widgets`, `New Project Draft Context`, `Onboarding Brand And Competitors`, `Prompt Articles API`, `Column Filter Components`, `Provider Keys And Chatbot Settings`, `Opportunities Table And Badges`, `Overview Charts And Tables`, `Metrics Charts And Downloads`, `New Project Report`, `Organization API And Event Bus`, `Prompt Article UI`, `Private Layout And Competitors`, `Project Detail Views`, `Standard Table And Empty State`, `Article Schema UI`, `Article Outline Markdown`, `Confirm Modal Views`, `App Navigation Sidebar`, `Project Components`, `Chatbot Coverage Settings`, `Project Select Views`, `App Error Pages`, `Article Stream Sentinels`, `Project Detail Widgets`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `metadata`, `dynamic`, `metadata` to the rest of the system?**
  _500 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Crawl Checker` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Collection Run Loop` be split into smaller, more focused modules?**
  _Cohesion score 0.08754208754208755 - nodes in this community are weakly interconnected._