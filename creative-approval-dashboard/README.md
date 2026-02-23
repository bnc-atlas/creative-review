# Creative Approval Dashboard (Clean V1)

Internal tool for reviewing creative assets (image/video + ad copy) by product and platform, with a clear status workflow: Queue → Needs Revision → Approved → Live/Disapproved.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Prisma ORM + SQLite (local dev)

## Setup

```bash
cd creative-approval-dashboard
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

Then open http://localhost:3000.

## Core Flows

- **Submit asset**: upload image/video, enter ad copy, choose product, select one or more platforms.
- **Review** (Queue tab): approve, request revision, or disapprove.
- **Needs Revision**: see comments, resubmit by updating media/copy (future enhancement: inline edit).
- **Approved**: mark live when ad is live.
- **Live/Disapproved**: read-only history.

## Notes

- Status and note types are strict enums in Prisma to avoid case bugs.
- Platforms are stored as a comma-separated string for V1 simplicity; can normalize later.
- This implementation is intentionally minimal and clean to serve as a reliable foundation.
