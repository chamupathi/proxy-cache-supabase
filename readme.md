
## Using Supabase Edge Functions (Without Breaking the External API Quota)

<br />
<br />

### Third-party APIs are great… until they’re not. 

Recently, I ran into a challenge where I had to integrate with a flaky external API, while also respecting a limited quota and dealing with internal service calls that weren't smart enough to stop hitting it over and over. And to make things worse, implementing internal caching wasn’t an option.

So, I came up with a simple and cost-effective solution using Supabase Edge Functions and a Supabase Database — and it worked like a charm.

Here’s how I did it.

## 🚧 The Problem
Here's what I was dealing with:

- I needed to fetch data from a third-party API.
- The API was unreliable — it sometimes timed out or returned errors.
- We had a quota for how many times we could call it.
- Our internal services would sometimes call the same endpoint multiple times in quick succession.
- Implementing caching inside each internal service was too expensive or complex at the moment.
- We were okay serving slightly stale data if the API was unavailable.
- I needed a reliable, cost-effective buffer in front of the API.
- I wanted the proxy service  to **cache it all** without configuring

<br/>

> “Sounds familiar? You have a quota-limited external API, but your backend services love hammering it as if rate limits don’t exist. And caching it internally? A refactor no one wants to touch right now.”


<br/>
-------

## 🧠 The Idea

I didn’t want to spin up Redis or deploy a new caching layer just for this. But I did need:

- A place to store cached API responses.
- A lightweight service that could check if data was cached, and only fetch from the external API when needed.
- A fallback mechanism to return cached data when the API fails.

💡 That's when I thought: Why not use Supabase Edge Functions (which are serverless and fast) with a Supabase Postgres table to cache results?



🗺️ Solution Architecture
Here's the basic flow:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6tel5ngmp3wc1z2zcj4s.png)
Internal services now hit my Edge Function instead of calling the external API directly.

The Edge Function:

Checks if the data exists in the Supabase DB and is still fresh.

If fresh: returns it.

If stale: tries to fetch from the external API.

If successful: updates the DB and returns the data.

If the API fails: returns the last known cached value.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ftluxvtmsed8wegb7392.png)

