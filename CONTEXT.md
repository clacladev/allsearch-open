# AllSearch Local

A desktop application that tracks how often a Brand is mentioned and cited by AI
chatbots, and turns the gaps into content recommendations. It is a single-user,
local-first port of the AllSearch SaaS: all data lives on the user's machine and
all AI inference runs against the user's own API key.

## Language

### Who the operator is

**Organization**:
The operator of the app: an agency, or an in-house team. Has a type
(`agency` or `in-house`), a name, a URL and an icon. Exactly one exists per
install. It is settings, not a tenancy boundary.
_Avoid_: Account, Workspace, Tenant, Team, User

### What is tracked

**Project**:
A tracked Brand plus its monitoring configuration: URL, hostname, aliases,
target location. For an agency, one Project is one client.
_Avoid_: Site, Client, Workspace

**Brand**:
A named entity that can be mentioned in a Prompt Response. Either the Project
itself or one of its Competitors. Not a table: it is the union of the two.
_Avoid_: Entity, Company

**Competitor**:
A rival Brand tracked alongside a Project, so its visibility can be compared
against the Project's.

**Topic**:
A named group of Prompts within a Project. `Custom` is the reserved Topic for
Prompts the user typed themselves.
_Avoid_: Prompt group, Category, Cluster

**Prompt**:
A question tracked over time, belonging to one Topic. The unit the user chooses
to monitor.
_Avoid_: Query, Keyword, Search

### What is collected

**Collection Run**:
One user-initiated batch that asks every active Prompt of every Project to
every Chatbot and stores the results. The unit of freshness, progress, cost and
resumption. A Run may be partial.
_Avoid_: Job, Sync, Refresh, Batch, Workflow, Crawl

**Chatbot**:
One of the AI answer engines a Prompt is asked against: ChatGPT, Google AI
Overview, Perplexity. Each is an LLM with web search grounding, not the real
consumer product.
_Avoid_: Engine, Model, Platform, Provider

**Prompt Response**:
One Chatbot's answer to one Prompt within one Collection Run. Carries the answer
text, the Brand Ranking and the Sentiment. Always **grounded**: an answer the
Chatbot wrote from training data without searching the web is not a Prompt
Response and is never stored — it still names Brands, so counting it would bias
Visibility towards whatever was popular in the training data rather than
measuring what is being said online.

**Source**:
A URL that appeared in a Prompt Response. Either *cited* (the Chatbot presented
it as a source) or *used* (the Chatbot retrieved it while searching but did not
cite it). This distinction is the `is_cited` flag and it matters: being used but
not cited is an Opportunity.

**Mention**:
A Brand's name, alias or hostname appearing in the text of a Prompt Response.
Distinct from a citation, which is about Sources.

**Citation**:
A Source the Chatbot presented as backing its answer.

### What is measured

**Brand Ranking**:
The order Brands were first mentioned in a Prompt Response text. Earlier is
better.

**Visibility**:
The percentage of Prompt Responses in a period that mention a given Brand. The
headline metric.
_Avoid_: Share of voice, Presence, Reach

**Sentiment**:
How positively a Prompt Response speaks about a Brand, scored -2 to +2.

**Opportunity**:
A derived, never-stored recommendation to improve a Brand's visibility, carrying
a priority score and a difficulty. Five kinds exist, from "your page is cited but
weak" to "your page was never found at all".

**Prompt Article**:
An AI-generated outline and article written to capture a specific Opportunity,
with the user's edits tracked separately from the AI's output.
_Avoid_: Content, Post, Draft
