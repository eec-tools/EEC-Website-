# Platform playbook (researched 3 November 2026)

What Instagram, LinkedIn and Meta themselves say they rank, plus the best independent data, and how each point is applied in the EEC Social Engine. Official statements are marked **[official]**; studies and practitioner data are marked **[data]** and treated as softer guidance (candidate rules or experiments).

Re-check every 6 months: platforms change ranking often.

## Instagram (Adam Mosseri, Head of Instagram)

| Finding | Source | How the engine applies it |
| --- | --- | --- |
| The three signals that matter most are watch time, likes per reach and sends per reach. Likes matter slightly more with followers; sends (DM shares) matter slightly more for reaching non-followers. | **[official]** Mosseri, repeated 2025 to 2026 ([Buffer](https://buffer.com/resources/instagram-algorithms/), [Kompozy](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance)) | Posts are written to be sent to a colleague: checklists, comparisons, dated changes (rule 24, prompt PLATFORMS). |
| Hashtags do not increase reach; they say what a post is about. Since December 2025 Instagram allows at most 5 hashtags per post or reel. | **[official]** Mosseri Feb and May 2025; Instagram @creators on Threads, 18 Dec 2025 ([Social Media Today](https://www.socialmediatoday.com/news/instagrams-implementing-new-limits-on-hashtag-use/808309/)) | 3 to 5 hashtags; more than 5 is a blocking error in the post check (rules.js). |
| Search reads caption words; the topic should be in plain words. | **[data]** [Buffer](https://buffer.com/resources/instagram-algorithms/), [Kompozy](https://kompozy.io/news/instagram-mosseri-ranking-signals-guidance) | The hook line names the product and market in search words (rule 24). |
| Posts that ask for a comment word, number or emoji to push reach may not be recommended. Open questions are fine. | **[official]** Instagram @creators, 2024, clarified ([Social Media Today](https://www.socialmediatoday.com/news/instagram-clarifies-advice-single-word-ctas-longer-reels/718151/)) | "Comment RICE" replaced by "Message us RICE"; a comment keyword on Instagram is a blocking error (rules.js, rules 21 and 24). |
| Reels over 90 seconds are not recommended to non-followers. | **[official]** Instagram @creators, 2024 (same source) | Reel rule: under 90 seconds, hook in 3 seconds (rule 32, candidate). |
| Original creators get more distribution than reposters; accounts that mostly repost or aggregate are not recommended (from April 2026). | **[official]** Mosseri; Instagram 2026 ([Buffer](https://buffer.com/resources/instagram-algorithms/)) | Original content only, no watermarks from other apps (rule 30). |
| AI content is flooding feeds; people trust raw, real moments more than polished images, and want to know who is behind an account. | **[official]** Mosseri, end of 2025 ([TechCentral](https://www.techcentral.ie/instagram-chief-predicts-more-raw-aesthetics-as-ai-takes-over/)) | Real EEC photos preferred over stock or AI; label AI images (rule 30). |
| Reels earn 36% more reach than carousels; carousels earn about twice the engagement per person reached. Consistent posting earns about 5x more engagement per post. Replying to comments: about 21% more engagement. | **[data]** Buffer, 4M+ posts, 100k+ accounts | Carousels stay the default; reels planned when real footage exists; the team replies to every genuine comment. |
| Captions are cut after about 125 characters on a phone. | **[data]** [SocialPilot](https://www.socialpilot.co/blog/ideal-social-media-caption-length) | Hook line under 125 characters (warning in rules.js). |

## LinkedIn (LinkedIn News and product team; Richard van der Blom for independent data)

| Finding | Source | How the engine applies it |
| --- | --- | --- |
| The feed focuses on the value and knowledge in the post itself. "What's the most interesting part of your post? Put it at the top." | **[official]** Laura Lorenzetti, Executive Editor, LinkedIn News; Alice Xiong, Director of Product ([Buffer, Dec 2025](https://buffer.com/resources/linkedin-algorithm/)) | Hook rule (29); full value in the post (rule 27). |
| Hashtags are "a nice to have, not a need to have". | **[official]** Lorenzetti (same source) | 3 to 5 hashtags, for search only (rule 6). |
| Dwell time is measured on the feed and after a click; ranking keeps evaluating a post over days, not only the first hour. | **[official]** LinkedIn Engineering ([Postiv summary](https://postiv.ai/blog/linkedin-algorithm-2026)) | Save-worthy lists and checklists; no pressure tactics in the first hour. |
| LinkedIn is making engagement pods "entirely ineffective" (Nov 2025) and hides comments from automation tools (2026). Fake polls and reaction voting are spam. | **[official]** Gyanda Sachdeva, VP Product; LinkedIn spam guidance (same source) | No bait (rule 21, warning in rules.js). Never use comment pods or automated comments. |
| Reach is down about 60% in two years for active creators; posting 2 to 3 times a week now beats 5 to 6; about 80% of posts should stay on one core topic; replies to comments and on-topic comments help. | **[data]** Richard van der Blom, 2026 Algorithm Insights, 1.3M posts ([Creator Science](https://creatorscience.com/podcast/richard-van-der-blom-2/)) | 3 posts a week on the page; topic focus rule (31, candidate); reply to comments. |
| Document and carousel posts get the highest engagement for company pages (about 7%), multi-image second; posts with links get less engagement; replying to comments adds about 30%. | **[data]** [Socialinsider 2026](https://socialinsider.io/blog/linkedin-best-practices/amp), [Buffer](https://buffer.com/resources/linkedin-algorithm/) 1M+ posts | No links in the body (rule 27, warning). Worth testing a weekly slide set on the page (see Next steps). |
| About 200 characters show before "see more" on a phone. | **[data]** [SocialPilot](https://www.socialpilot.co/blog/ideal-social-media-caption-length) | Hook within 200 characters (warning in rules.js). |

## Facebook (Meta)

| Finding | Source | How the engine applies it |
| --- | --- | --- |
| Original content is eligible for recommendation and gets more distribution; reposts, light edits and "react" content are deprioritised; accounts that mostly post unoriginal content can become non-recommendable. | **[official]** Meta, "Rewarding Original Creators on Facebook", 13 Mar 2026 ([about.fb.com](https://about.fb.com/news/2026/03/rewarding-original-creators-on-facebook/)) | Original only (rule 30). |
| Meta is testing a limit of 2 link posts a month for Pages and professional profiles without Meta Verified. Links in comments are not limited. | **[official test]** Reported Dec 2025 ([TechCrunch](https://techcrunch.com/2025/12/17/facebook-is-testing-a-link-posting-limit-for-professional-accounts-and-pages), [Social Media Examiner](https://www.socialmediaexaminer.com/what-facebooks-new-link-rules-mean-for-your-2026-strategy/)) | No link in the post text; "eectrade.com" written out instead (rule 26, warning in rules.js). A link in the first comment would avoid the limit, but Buffer only sends first comments on a paid plan (setting buffer_first_comment). |
| Asking for likes, shares or comments to boost reach is engagement bait and is demoted. | **[official]** Meta policy ([SocialPilot summary](https://www.socialpilot.co/blog/facebook-algorithm)) | Rule 21. |
| Around half of a person's feed is recommended content from accounts they do not follow; Reels ranking asks people how well a video matches their interests. | **[official]** Meta, Oct 2025 and Engineering at Meta, Jan 2026 (same source) | Posts must make sense to a stranger: no insider references, product and market named in the first line. |
| About 125 characters show before "See more" on a phone. | **[data]** [SocialPilot](https://www.socialpilot.co/blog/ideal-social-media-caption-length) | Hook line under 125 characters (warning). |

## Hooks that fit EEC

Lead with the most useful, specific point. Patterns:

1. **Dated change:** "From 1 January, EU buyers of ... need ..." (with a source).
2. **Sourced opportunity:** "Indian rice is about 10% more competitive than the next origin, according to IREF."
3. **Buyer question:** "Why can two towel quotes describe different products?"
4. **Short checklist:** "Four details that make spice quotes comparable."
5. **Comparison:** "FOB price or landed cost: which one decides your margin?" (the post answers it).

Never: clickbait, fear, "most suppliers get this wrong", or a question the post does not answer.

## What the team should do (people, not the engine)

- Reply to every genuine comment on the day it arrives: replying adds about 21% (Instagram) to 30% (LinkedIn) more engagement.
- Never use engagement pods, comment-for-comment groups or automated commenting tools.
- Take real photos and short clips during sample checks, factory and port visits (with permission). They unlock reels and beat stock images.
- Keep the LinkedIn page's About, specialties and tagline aligned with what the posts are about.

## Next steps worth testing

- **LinkedIn slide sets:** the engine can render slides and Buffer sends images to LinkedIn, but no LinkedIn image post has been tested live yet. Run one live test, then use a weekly slide set on the page as an experiment against text posts.
- **First reel:** once real footage exists, one reel a week under 90 seconds.
