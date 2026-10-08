# Level 4 — Merging & Status

## mergeWorkspaces(sourceId, targetId)

- Moves the source's entire event history into the target and makes the source an alias of the target.
- Historical balances and transactions of the target now include the source's history.
- Merging an unknown workspace or a workspace into itself is ignored.
- Merged workspaces do not appear separately in getRanking().

## getWorkspaceStatus(workspaceId)

- Returns 'active', 'merged', or null.
