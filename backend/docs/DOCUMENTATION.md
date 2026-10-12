# CineMatch: Hybrid Movie Recommendation System

## 1. Problem statement & motivation
Streaming catalogs hold thousands of titles; users won't browse them. Goal: given a viewer's
rating history (or none at all), rank unseen titles and explain each pick, Netflix-style.

## 2. Approach
Three-stage pipeline, as in production recommenders:
1. **Scoring**: three models score every title: popularity, content, collaborative.
2. **Blending**: rank-percentile scores are combined with weights that adapt to the viewer's history length.
3. **Re-ranking**: Maximal Marginal Relevance trims near-duplicates; explanations are attached.

## 3. Architecture
Browser UI → FastAPI (`app/api.py`) → `Engine` facade (`app/engine.py`) → `HybridModel` → {Popularity, Content, Collaborative}.
Models are trained once at startup and held in memory (read-only, so requests are safe to serve concurrently).
`scripts/evaluate.py` drives the same `Engine`, so offline metrics measure the production code path.

## 4. Methodology
- **Popularity**: Bayesian average rating (prior = 80th percentile of item rating counts).
- **Content**: TF-IDF over genres (weight 1.0) + tags (0.6); taste vector = Σ (rating − user mean) × item vector;
  score = cosine to taste vector. Negative weights push away from disliked genres.
- **Collaborative**: TruncatedSVD (k=50) on the user-mean-centered matrix. Any profile is *folded in* by
  projection onto item factors, so existing users and ad-hoc UI profiles share one code path.
- **Hybrid weights**: base 0.5 / 0.3 / 0.2 (CF / content / popularity). CF weight × min(1, n/20); content × min(1, n/3);
  then renormalised. 0 ratings → pure popularity.
- **Diversity**: MMR (λ=0.8) over the top-100 candidates using content similarity.
- **Explanations**: anchor = liked movie most similar (mean of CF and content similarity); reason text from the
  dominant weighted signal; per-model scores and blend weights shown in the UI.
- **Eligibility**: items with < 5 ratings are never recommended (unreliable signals).

## 5. Dataset
MovieLens `ml-latest-small` (GroupLens): 100,836 ratings, 9,742 movies, 610 users, tags. Chosen for size
(deployable, reproducible) and because it has the metadata all three techniques need.
Attribution: F. Maxwell Harper and Joseph A. Konstan. 2015. The MovieLens Datasets: History and Context. ACM TiiS 5(4).
Limitation: no posters, so the UI uses generated gradients.

## 6. Technologies
Python 3.12, FastAPI, pandas, NumPy, SciPy, scikit-learn, vanilla JS, Docker, pytest.
FastAPI over Django: no ORM/auth/admin needed; models live in memory.

## 7. Assumptions
- Rating ≥ 4.0 means "liked".
- Ratings are explicit feedback; no implicit signals (watch time, clicks) available.
- Preferences are stationary (no time decay).
- Catalog is static between restarts.

## 8. Key design decisions
| Decision | Rationale |
|---|---|
| Hybrid over single model | Each model fails where another succeeds (cold start vs. personalisation vs. serendipity) |
| Adaptive weights | CF is unreliable on short histories |
| Percentile blending | Model score scales are incomparable |
| No n×n similarity matrix | ~380 MB dense; sparse on-demand compute instead |
| SVD fold-in | One scoring path for known and unknown users |
| MMR re-rank | Raw top-N tends to be near-duplicates |
| Engine facade | API and evaluation share one pipeline |

## 9. Evaluation methodology
Temporal per-user holdout: each user's latest 20% of ratings (users with ≥ 10 ratings) are hidden;
relevant = hidden items rated ≥ 4. Models train on the remainder only. Metrics at K=10:
Precision, Recall, MAP, NDCG (ranking quality); Diversity (1 − mean pairwise content similarity);
Novelty (mean −log2 item popularity); Coverage (share of eligible catalog ever recommended); Latency (ms/user).
Baselines: each model alone. Results (`reports/metrics.json`):

| Model | Precision@10 | Recall@10 | MAP@10 | NDCG@10 | Diversity | Novelty | Pop Bias | Latency (ms) | Coverage |
|---|---|---|---|---|---|---|---|---|---|
| popularity | 0.0431 | 0.0324 | 0.0251 | 0.0553 | 0.7650 | 2.3301 | 0.8760 | 0.08 | 0.0178 |
| content | 0.0079 | 0.0048 | 0.0033 | 0.0093 | 0.1281 | 5.5163 | 0.0409 | 0.49 | 0.5563 |
| collaborative | 0.0713 | 0.0579 | 0.0449 | 0.0918 | 0.7894 | 2.2846 | 0.8959 | 0.18 | 0.1636 |
| hybrid | 0.0598 | 0.0500 | 0.0338 | 0.0731 | 0.6539 | 2.6859 | 0.8005 | 2.66 | 0.1159 |
| hybrid + MMR | 0.0581 | 0.0438 | 0.0330 | 0.0715 | 0.8521 | 2.6545 | 0.8157 | 2.63 | 0.1053 |
| hybrid (default cfg) | 0.0448 | 0.0374 | 0.0255 | 0.0582 | 0.5467 | 3.1919 | 0.6287 | 2.29 | 0.1758 |

### Tuning protocol
Per-user chronological split: oldest 70% train, next 10% validation, newest 20% test. Hyper-parameters
(SVD size, blend weights, ramps) were grid-searched on validation by NDCG@10 (216 blends × 3 SVD sizes), with each
model constrained to ≥ 10% base weight. `mmr_lambda` is the most diverse value losing ≤ 2% relative NDCG.
The tuned config (`reports/tuned_config.json`) is what the deployed app serves. Final numbers use a model
retrained on train+validation and evaluated once on test. Evidence: `reports/tuning_results.json`.

### Segments & popularity bias
Users are bucketed by training-history size (<30 / 30-99 / 100+). Popularity bias = share of a
list from the 10% most-rated eligible titles.

**NDCG by user activity (training ratings per user):**

| Model | <30 (n=154) | 30–99 (n=233) | 100+ (n=205) |
|---|---|---|---|
| popularity | 0.0434 | 0.0378 | 0.0841 |
| content | 0.0040 | 0.0034 | 0.0199 |
| collaborative | 0.0554 | 0.0727 | 0.1409 |
| hybrid | 0.0465 | 0.0601 | 0.1078 |
| hybrid + MMR | 0.0433 | 0.0600 | 0.1057 |
| hybrid (default cfg) | 0.0375 | 0.0523 | 0.0803 |

**Verdict (NDCG, core models):**
- `<30`: collaborative leads; hybrid is -16.1%
- `30-99`: collaborative leads; hybrid is -17.3%
- `100+`: collaborative leads; hybrid is -23.5%

Caveat: every MovieLens user has ≥ 20 ratings, so this is a light-vs-heavy comparison, not true cold start.


Online metrics we would track in production: click-through, play-start rate, completion/retention, A/B-tested.

## 10. Test cases
Run each in the UI and record the real output.
**Successful**
1. «User X with consistent genre taste» → «top picks, match %, reason»
2. Build-your-taste: rate 3 Sci-Fi titles 5★ → content-dominant blend; Sci-Fi-heavy picks «verify»
3. Cold start (zero ratings) → "Popular Right Now", blend 100% popularity
4. "More like this" on «a well-known movie» → sensible neighbours «verify»
**Failure**
5. «User with contradictory/niche taste» → generic or scattered picks «record»
6. Profile with one 5★ rating → CF has almost no weight; content only «record»
7. Brand-new movie (< 5 ratings) → can never appear (item cold start)
8. Popular-item bias: observe popular titles dominating lists «record»

## 11. Known limitations
- Item cold start: unrated titles are invisible.
- Popularity bias inherited from MovieLens.
- Small dataset (610 users) → noisy CF; MovieLens users are not Netflix users.
- Tags are sparse; content signal is mostly genre-level.
- No time decay, no context (device, time of day), no implicit feedback.
- Model trains at startup (seconds); no incremental updates.
- Offline metrics ≠ user satisfaction.

## 12. Future improvements
Implicit-feedback ALS / two-tower retrieval, text embeddings for plots, time decay, bandit-based exploration,
posters via TMDB, persisted user profiles, A/B framework, ANN index for large catalogs.

## 13. Bonus: comparison with Netflix
| | CineMatch | Netflix |
|---|---|---|
| Similarities | Personalised rows, "Because you watched…", match %, cold-start onboarding, diversity re-rank | same ideas |
| Differences | Explicit ratings, 10k titles, one model family, batch training | implicit signals at scale, many specialised models, artwork personalisation, contextual bandits, real-time updates |
| Limitations | See §11 | n/a |
| Improvements | Implicit feedback, row-level ranking, artwork | n/a |
| Next with more time | Two-tower retrieval + learned re-ranker, bandit exploration, TMDB posters, online A/B harness | n/a |

## 14. Setup