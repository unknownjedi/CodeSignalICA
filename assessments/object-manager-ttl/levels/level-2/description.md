# Level 2 — TTL

Objects may now expire. Timestamps use the same unit as ttl.

## put(key, value, timestamp, ttl)

- Stores value created at timestamp, expiring at timestamp + ttl.
- If ttl is omitted, the value never expires.

## get(key, timestamp)

- Returns the value only while it has not expired at timestamp (expiry is exclusive).
- Called without a timestamp it returns the latest value regardless of expiry.

## keys(timestamp)

- Returns the keys whose latest value is not expired at timestamp, sorted ascending.
