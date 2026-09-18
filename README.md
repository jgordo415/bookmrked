# Your World, Bookmrked

BOOKMRKED — Product Requirements Document v2.0
1. The Vision
Product Name: Bookmrked
Tagline: Save it. Visit it. Come back to it.
What problem are we solving?
People who care about experiences — food, coffee, art, music, culture — have no dedicated place to track, organize, and share the places that actually matter to them. Notes apps are messy, Google Maps saves get buried, and Yelp lists feel impersonal. Great spots get forgotten. Discoveries don’t get shared. The journey gets lost.
What’s the solution in one sentence?
Bookmrked lets you save, organize, and track any place worth revisiting — restaurants, coffee shops, record stores, art galleries, museums, or anywhere else — organized into personal collections with ratings, notes, and completion tracking.
Who is this for?
Urban dwellers aged 25–45 who actively seek out experiences across food, culture, and lifestyle. They travel, they explore their own city, they have taste and they know it. They’re the person in their friend group who always knows where to go. Currently they cobble together a system from photos, notes apps, and social media. Bookmrked is the dedicated home for that instinct.
What makes it different?
Bookmrked is not a review platform. It’s a personal curation tool. The difference is intent — you’re not writing for strangers, you’re building your own map of the world worth revisiting. Collections can be shared but the primary experience is deeply personal. And for users who want expert curation as a starting point, Gordo Certified collections — curated by a real Bay Area food and culture creator — are available as premium templates to explore and make your own.
2. User Journey
Core action: Save a place to a collection, visit it, mark it done, remember why it was worth it.
Key steps:
Land on the app and see a featured Gordo Certified collection as a demo — no login required to browse. Decide to save it or start your own. Enter email to save progress. Create a collection — SF Coffee Crawl, Tokyo Trip, Record Shops I Need to Hit, whatever. Add places manually or search via Google Places. Visit a place, mark it visited, add a rating and a note. Watch the collection progress fill up. Share the collection link with a friend or keep it private.
Screens needed: Landing/demo screen showing a featured collection without login, Dashboard showing your active collections and progress, Collection creation screen, Individual collection view with location list and progress bar, Location detail screen with visit status, rating, notes and optional photo, Add location screen with search and manual entry, Discover screen showing Gordo Certified curated collections (premium), Profile and settings, Upgrade to premium screen.
3. Features
MVP — three things only:
Collection creation and management across any category not just food. Location tracking with visit status, star rating, and short note. Progress tracking showing completion percentage per collection.
Free tier limits: Up to 5 active collections, up to 15 locations per collection, 150 character notes, basic sharing via link.
Premium tier at $7.99/month or $59/year: Unlimited collections and locations, photo uploads up to 5 per location, extended notes, Gordo Certified curated collection library, advanced filtering and sorting, map view of collection route, export options, statistics and insights.
V2 features for after launch: Collaborative collections, social following, comments, push notifications for new Gordo Certified drops, city-specific guides tied to the ebook series.
4. Auth and Onboarding
Value before auth — critical. A first-time visitor must be able to browse a featured Gordo Certified collection and understand the full product before being asked for an email. Auth prompt appears only when a user attempts to save a location or create their own collection. Login is email-based with magic link — no password required. Social login via Google as a secondary option.
5. Category System
Unlike the original PRD which implied food-only, Bookmrked supports any experience category. Default categories available at launch: Food and drink, Coffee and cafés, Bars and nightlife, Art and museums, Music and record shops, Books and bookstores, Travel and neighborhoods, Other. Users can also create custom category labels.
6. Gordo Certified Integration
This is the premium content differentiator. A library of curated collections built from Gordo Certified content — SF Coffee Crawl, Bay Area Brunch Spots, Oakland Eats, Toronto Finds, and expanding as the TikTok series grows. Premium users can browse, save, and customize any Gordo Certified collection as the starting point for their own. Free users can see collection titles and spot counts but cannot access the full list — this is the primary premium upgrade prompt.
7. Technical Requirements
Frontend: React, mobile-first, bottom navigation on mobile, clean minimal aesthetic with warm accent color. Think editorial food magazine not generic app.
Backend: Supabase for auth, database, and storage. Fresh instance — do not attempt to restore dormant project.
Payments: Stripe for subscription management. Implement after free tier is live and tested with real users.
APIs: Google Places for location search. Implement in phase two — manual entry only for MVP to reduce complexity and cost.
Deployment: Vercel or Netlify via Lovable’s built-in deploy. Web app first, mobile-first responsive design. No native app until 500+ active users.
Data models: User with subscription tier and preferences. Collection with owner, title, description, category, privacy setting, and share token. Location with collection reference, name, address, category, and coordinates. Visit with location reference, timestamp, star rating, note, and optional photo URL.
8. Design Direction
The aesthetic is curated and editorial — not generic app, not startup-y. Think the visual language of a well-designed city guide or food magazine translated to mobile. Dark or warm neutral background. One strong accent color used consistently. Typography that feels intentional. The word Bookmrked should feel like something you’d see on a tote bag at a bookstore or a sticker on a laptop — it has personality.
9. Launch Plan
Phase one deploy: Web app with free tier only, Gordo Certified demo collection visible without login, manual location entry, Supabase auth.
Phase two: Google Places search, photo uploads, premium tier with Stripe.
Phase three: Gordo Certified curated library for premium users, map view, export.
Distribution at launch: Gordo Certified TikTok audience as first users, Product Hunt listing, Reddit communities focused on food and travel, link in ebook as companion app.
10. Success Metrics at 90 Days
200+ registered users, 50+ active collections created, 10+ premium subscribers, average session length above 3 minutes, TikTok to app conversion tracked via UTM links.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bookmrked.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c06f3a43-318f-48fc-a0cd-42b5013a068d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
