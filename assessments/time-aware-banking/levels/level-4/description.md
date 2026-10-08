# Level 4 — Merging Accounts

## mergeAccounts(sourceId, targetId)

- Moves the source's balance and volume into the target.
- After merging, the source id resolves to the target for every operation and query.
- Merging an account into itself, or with an unknown account, is ignored.
- Merged accounts do not appear separately in getRanking().
