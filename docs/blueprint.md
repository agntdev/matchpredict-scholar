# Sports Prediction Research Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that generates daily probabilistic predictions for sports matches (football, basketball, tennis, ice hockey) and provides historical data and model explanations for academic study and statistical analysis.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- students
- researchers

## Success criteria

- Daily digest delivered to 100+ subscribers
- 100% reproducible predictions with model version tracking
- 95% user satisfaction with prediction explanations

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **/subscribe** (command, actor: user, command: /subscribe) — Subscribe to daily sports prediction digest
- **/unsubscribe** (command, actor: user, command: /unsubscribe) — Unsubscribe from daily digest
- **/today** (command, actor: user, command: /today) — Request today's sports prediction digest immediately
- **/match** (command, actor: user, command: /match) — Request detailed prediction for specific match by ID
- **/history** (command, actor: user, command: /history) — Request historical match data for team/player/match
- **/explain** (command, actor: user, command: /explain) — Request model explanation for specific match prediction
- **/status** (command, actor: admin, command: /status) — Admin-only system health check

## Flows

### Daily Digest Subscription
_Trigger:_ /subscribe

1. Request user confirmation
2. Store subscription with default time
3. Send confirmation message

_Data touched:_ User

### Daily Digest Unsubscription
_Trigger:_ /unsubscribe

1. Request user confirmation
2. Remove subscription
3. Send confirmation message

_Data touched:_ User

### Daily Digest Delivery
_Trigger:_ scheduled event

1. Generate digest content
2. Send to all subscribers
3. Log delivery

_Data touched:_ Match, Prediction, User

### Match Prediction Request
_Trigger:_ /match

1. Request match ID
2. Fetch prediction data
3. Display prediction details

_Data touched:_ Match, Prediction

### Historical Data Request
_Trigger:_ /history

1. Request search type (team/player/match)
2. Fetch historical data
3. Display results

_Data touched:_ Historical record

### Model Explanation Request
_Trigger:_ /explain

1. Request match ID
2. Fetch explanation data
3. Display model inputs and features

_Data touched:_ Prediction, Match

### Admin Status Check
_Trigger:_ /status

1. Verify admin identity
2. Fetch system metrics
3. Display health status

_Data touched:_ System status

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Match** _(retention: persistent)_ — Sports match metadata and event details
  - fields: teams_players, datetime, competition, venue, sport_type
- **Prediction** _(retention: persistent)_ — Probabilistic match outcome predictions
  - fields: match_id, outcome_probabilities, total_probabilities, scorer_probabilities, confidence_score, timestamp, model_version
- **Historical record** _(retention: persistent)_ — Past match results and event data
  - fields: match_id, final_scores, events, datetime
- **Digest** _(retention: session)_ — Daily selected top matches summary
  - fields: matches, summary, timestamp
- **User** _(retention: persistent)_ — Researcher user profile and preferences
  - fields: telegram_id, subscription_status, digest_time, request_logs
- **System status** _(retention: session)_ — Bot operational metrics
  - fields: last_run_timestamp, error_count, active_users

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure daily digest time
- Set number of matches in digest
- Enable/disable admin notifications
- View system health metrics

## Notifications

- Daily digest sent to subscribers
- Admin reports sent to owner/admin chat
- Error alerts for failed predictions

## Permissions & privacy

- User subscriptions are private
- Historical data is anonymized
- Model explanations do not expose proprietary algorithms

## Edge cases

- No matches scheduled for the day
- Invalid match ID requested
- User not subscribed but requests digest
- Admin command used by non-admin user

## Required tests

- Verify daily digest delivery to 100+ subscribers
- Test prediction reproducibility with model version tracking
- Validate historical data accuracy for 30-match samples
- Confirm admin command access restrictions

## Assumptions

- Users will provide valid match IDs when requesting predictions
- Historical data will be available for requested teams/players
- Model explanations will be simplified to 5 key features
- Admin will provide valid Telegram chat ID for notifications
