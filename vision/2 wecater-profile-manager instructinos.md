This is the Profile Manager — the "memory bank" view for between-order workflows. It implements Phase 1 features 1, 3, 11, 15, and 16 in a single screen.
Click through the 6 demo profiles in the left rail to see how the UI adapts to different relationship states:

Dr. Patel's Cardiology — active relationship, full memory accumulated
Dr. Morrison's Internal Med — pinned compliance warning ($84/$100 YTD)
Dr. Chen's Pediatrics — large team, severe peanut allergy flagged
Westside Oncology — high-volume clinic, halal requirement
Phoenix Heart Specialists — new relationship, incomplete profile (calls out what's missing)
Sun Valley Family Practice — dormant, minimal data

Key strategic design choices:

The "Told vs Learned" badge on every dietary entry. This is the most important detail in the whole interface — it makes the AI memory model legible and trustworthy. Sally can see exactly what she explicitly stated versus what the AI inferred from order patterns. This solves a core trust problem with AI assistants and is invisible in every competitor.
The compliance bar is integrated into the profile, not a separate report. Each physician gets a YTD progress bar with their NPI number. Color shifts from green → amber → red as YTD spend approaches the $100 de minimis threshold. This makes the compliance feature feel ambient instead of a chore.
Pinned reminders surface at the top of every profile. Maria's "always call before ordering" appears in a high-priority alert band — exactly the proactive surfacing pattern from the feature spec. New notes can be added inline with priority levels.
AI Insights panel on the right translates raw memory into actionable recommendations. For Dr. Morrison: "Next order should be ≤ $15.75 to stay compliant." For Dr. Patel: it accounts for variety AND competitor activity. This is where the compound memory moat becomes tangible.
Empty states are different per profile state. Phoenix Heart shows "No dietary info yet — ask Tina at check-in." That's the AI proactively closing its own knowledge gaps rather than just sitting blank.
Filter pills at top of left rail ("Active," "⚠️ Compliance," "✨ New") let pharma reps managing 30–80 offices scan their book by status — directly addressing the multi-office problem.

What this view unlocks for the chatbot: every profile is now a structured object the chatbot can load with one phrase. The flow back to the chat is one click ("💬 Order Now" or "Plan this order"), and the chat already knows everything that's on this screen.
