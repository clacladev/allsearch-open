# Collection is manual and weekly by default

The SaaS collected data on a server cron twice daily, which guaranteed an
unbroken time series. A desktop app cannot make that guarantee: a sleeping
laptop runs nothing, and a missed day is lost permanently because you cannot ask
a Chatbot what it said last Tuesday. Rather than pretend otherwise with a
background daemon that would still drop days, collection is explicitly
user-initiated: the app tells the user when data is stale and they press a
button.

The default cadence drops from daily to weekly because daily is not necessary
for this signal and, on the user's own API key, every Collection Run costs them
real money. The button is always available if they want a point sooner.

## Consequences

- A Collection Run becomes a first-class entity. The SaaS had no such concept:
  it inferred "today's batch" from `created_at` dates and carried an unqueried
  `workflow_id` string. Freshness, progress, cost, partial results and resumption
  all need a run record.
- Every metric that means "the latest day" must be changed to "the latest
  completed Collection Run", starting with `getRankingsSummary`, which otherwise
  presents weeks-old numbers as current.
- Charts must render sparse and gappy series honestly. A gap means the app was
  not run, not that the Brand lost visibility.
- Trends arrive more slowly: four points a month rather than thirty.
- A failed Run costs a whole week. The SaaS papered over this with a second cron
  an hour later; here the Run is recorded as partial and the user is offered a
  retry of just the failed Prompts.
- No scheduler, no launch-at-login, no tray residency, and no background
  permissions are needed for the first version.
