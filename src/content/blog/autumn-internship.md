---
title: "Interning @ Autumn"
description: "I've recently been cooking at Autumn. Thanks for inviting me to join you guys!"
pubDate: "2025-07-18T20:51:59.680894+00:00"
category: "Industry"
published: true
---

If you're reading this, chances are you've probably come across Autumn, or even interacted with me on the 
[Autumn Discord](https://discord.gg/53emPtY9tA), and so you're aware I've interned at Autumn for the past 2 weeks.
If you've come from somewhere else, welcome! I guess the aforementioned should give you enough context.

This blog exists more as a resource to help me get better at casual writing, rather than academic writing (which I've spent the better part of the last 2 years doing as part of high school), hence I'd like to
summarize my experience working at Autumn here - I want to make it clear though, while Autumn is a [Y Combinator](https://www.ycombinator.com/)
company, this is **not** yet another article about *✨ interning at a YC company ✨* or *✨ day in the life at a YC company ✨*. If you're looking for that, head to YouTube.
This article is **unique** to **my** experience at **Autumn**.

# My technical background

To understand a little bit of my background before I started at Autumn: I'm primarily a Python and Rust developer, with experience in both. Previously, a lot of my web development was done purely with SSR technologies, in particular, [Django](https://www.djangoproject.com).

I had never really used TypeScript, or anything in the JS eco-system. The maxmimum I'd ever done with JS is just a few small JS animations on my personal websites.

# TypeScript

Before my internship at Autumn, my abilities remained centered around Python and Rust with some JavaScript - I had never previously used TypeScript for a considerable project before.

Autumn however, changed this, since it was my job for 2 weeks to be using TypeScript and **TypeScript only**. Autumn, currently uses an Express backend with a React frontend, both written with TypeScript. Both things I had little experience with.

NextJS was particularly enjoyable - having my backend and frontend coupled so well was certainly unique - I loved it so much, it actually now powers the website you're on right now!

# The first feature

The first feature I was asked to build was `Usage Limits`. This was **no easy task**. My unfamiliarity with the Autumn codebase coupled with the friction of using a new language was not fun.

However, with the "power" of Windsurf and John's help, I managed to put together a working implementation of usage limits that just about worked - John had to clean it up though. *sorry for the extra work*.

We certainly had some enjoyable moments, particularly when Windsurf started responding in a completely different language mid-response. Funny thing was, when we translated it, it was actually relevant content, just switched languages in between!

![Windsurf Output](https://tulzpvq8km.ufs.sh/f/ppq0iTvbq3V7Oi2iqtRRIOiE09Pe45pygqflGzMuDxcTNrsj)

# atmn CLI

The Autumn CLI was probably my biggest accomplishment in my two weeks at Autumn, gaining over 18,000+ views on the announcement post on X (though I'm not a person to obsess over views, it was certainly awesome to see the reach of my work).

Internally, there were probably 2.5 iterations of the CLI, initially using the `ink` library, which I swiftly removed since I wasn't building a TUI, I was building a CLI, that while feature packed, had a very simple interface.

I switched to using the `commander`, `inquirer` and `chalk` libraries quite promptly.

We decided on using OTP auth similar to how Supabase's CLI tool works to pull user's API keys. I ended up implementing API routes under Autumn's `devRouter` that dealt with OTP auth. The basic auth flow goes as follows:

`Someone loads up the OTP page @ /dev/cli on the Autumn dashboard` -> `POST request to /dev/otp to generate an OTP` -> `User provides this OTP to the CLI tool` -> `CLI makes GET request to /dev/otp/:otp to get the user's API keys + other metadata`.

Of course there are more details under the hood, such as caching operations. Fun fact, the OTP never hits a database. Its all stored in a Redis cache. If you're interested about the actual implementation, you can view the source code [here](https://github.com/useautumn/autumn/blob/staging/server/src/internal/dev/devRouter.ts).

Check out the launch tweet [here](https://x.com/johnyeo_/status/1945940144294367655)!

P.S: If you want to try the CLI for yourself, run `npx atmn@latest init` in a TypeScript project!

*Thanks for having me on Autumn! ❤️*.
