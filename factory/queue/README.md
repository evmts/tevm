# Factory queue

`issues/issue-<number>.md` files are reviewable plans produced by `//workflows/issue-triage:triageIssue`. They are repository artifacts, not authority: the live GitHub issue and `factory:ready` label remain the source of truth.

Queue plans carry the normalized issue body digest so an edit to the issue invalidates an old plan instead of silently reusing it.
