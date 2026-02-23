# 📄 Product Requirements Document (PRD)## Internal Creative Review Dashboard – V1 PRD

### 1. Goal / Summary
Build an internal web dashboard that allows the CMO and marketing leadership to review all creative assets (image and ad copy) **before they go live**. Creative is uploaded by the creative team, reviewed in a central queue, and moved through explicit states until marked live.

### 2. Primary Users
- **CMO / Marketing Leadership**
  - Reviews creative assets by product and platform.
  - Approves, disapproves, or requests revisions.
  - Marks approved assets as live once they are launched.

- **Creative Team**
  - Uploads new creative assets with required metadata.
  - Reviews feedback, revises assets, and resubmits for approval.

### 3. Core Concepts
- **Creative Asset**
  - Image (single image V1; future: support multiple images/video).
  - Ad copy (plain text V1; future: rich text or multiple variants).
  - Product label (e.g., `JPD`, `Jira`, `Confluence`, `Rovo`, etc.).
  - Platform label (e.g., `Reddit`, `Google`, `Meta`, `LinkedIn`, etc.).
  - Status (workflow state; see below).
  - Reviewer notes (running history of decisions and feedback).

- **Statuses (Workflow States)**
  - `Queue` – Newly submitted and waiting for review.
  - `Needs Revision` – Reviewed with requested changes.
  - `Approved` – Approved but not yet marked as live.
  - `Live` – Approved and confirmed as live in the wild.
  - `Disapproved` – Rejected and not to be used.

### 4. V1 Use Cases & Flows

#### 4.1 Upload New Creative (Creative Team)
- **Inputs**
  - Upload image file.
  - Enter ad copy text.
  - Select product label (dropdown from predefined list).
  - Select platform label (dropdown from predefined list).
- **Behavior**
  - On submit, asset is created with status `Queue`.
  - Asset appears in the `Queue` view for reviewers.

#### 4.2 Review Queue (CMO/Reviewer)
- **View: Queue Tab**
  - List/table or card grid showing assets with:
    - Image preview.
    - Ad copy snippet (with option to expand full text).
    - Product label.
    - Platform label.
    - Created date.
  - Global filters:
    - Product (multi-select or single-select dropdown).
    - Platform (multi-select or single-select dropdown).

- **Per-asset actions (from Queue)**
  - `Approve`
    - Requires optional note.
    - Changes status to `Approved`.
  - `Request Revision`
    - Requires note (feedback to creative team).
    - Changes status to `Needs Revision`.
  - `Disapprove`
    - Requires note (reason for disapproval).
    - Changes status to `Disapproved`.

#### 4.3 Needs Revision (Creative Team)
- **View: Needs Revision Tab**
  - Shows assets with status `Needs Revision`.
  - Displays most recent reviewer note and note history.
  - Creative can upload a new image and/or update ad copy.
  - On resubmission, status goes back to `Queue` and a note is added indicating it was resubmitted.

#### 4.4 Approved & Live (CMO/Reviewer)
- **View: Approved Tab**
  - Shows assets with status `Approved`.
  - Same filters by product and platform.
  - Action: `Mark Live`.
    - Optional note.
    - Status changes to `Live`.

- **View: Live Tab**
  - Shows assets with status `Live`.
  - Filters by product and platform.
  - Read-only in V1 (no status changes once live; future: allow rollbacks).

#### 4.5 Disapproved
- **View: Disapproved Tab**
  - Shows assets with status `Disapproved`.
  - Filters by product and platform.
  - Read-only in V1 (no direct reactivation; future: allow cloning to new asset).

### 5. Non-Goals for V1
- No direct publishing to ad platforms (Meta/Google/Reddit/etc.).
- No granular permissions beyond basic roles (admin vs. contributor) in V1.
- No complex versioning UI (simple revision history via notes + updated fields is enough).
- No integrations with Jira/Confluence/etc. beyond labels.

### 6. UX & UI Requirements
- **Navigation**
  - Top-level tabs: `Queue`, `Needs Revision`, `Approved`, `Live`, `Disapproved`.
  - Global filters (Product, Platform) persist across tabs within a session.

- **Asset Presentation**
  - Image preview large enough for CMO to quickly scan.
  - Ad copy shown truncated with "View full" to expand.
  - Badges or chips for Product and Platform.

- **Status & Notes**
  - For each status transition, capture:
    - Who performed the action.
    - When.
    - Optional/required note.
  - Show note history in a vertical timeline for each asset.

### 7. Data Model (V1)

- **User**
  - `id`
  - `name`
  - `email`
  - `role` (e.g., `ADMIN`, `REVIEWER`, `CREATOR`)

- **CreativeAsset**
  - `id`
  - `imageUrl` (or storage key)
  - `adCopy` (text)
  - `product` (enum/string: `JPD`, `Jira`, `Confluence`, `Rovo`, etc.)
  - `platform` (enum/string: `Reddit`, `Google`, `Meta`, `LinkedIn`, etc.)
  - `status` (enum: `QUEUE`, `NEEDS_REVISION`, `APPROVED`, `LIVE`, `DISAPPROVED`)
  - `createdByUserId`
  - `createdAt`
  - `updatedAt`

- **CreativeAssetNote**
  - `id`
  - `assetId`
  - `authorUserId`
  - `type` (e.g., `APPROVAL`, `REVISION_REQUEST`, `DISAPPROVAL`, `COMMENT`, `STATUS_CHANGE`)
  - `message` (text)
  - `createdAt`

### 8. Status Transition Rules (V1)
- `Queue` → `Approved`, `Needs Revision`, `Disapproved`.
- `Needs Revision` → `Queue` (on resubmission).
- `Approved` → `Live`.
- `Live` → (no transitions V1).
- `Disapproved` → (no transitions V1).

All transitions must create a `CreativeAssetNote` entry capturing the action and any note text.

### 9. Filtering & Search
- **Filters**
  - Product (dropdown, multi-select acceptable but single-select is fine for V1).
  - Platform (dropdown).
- Filters apply within the current tab.
- Future: search by ad copy text, created by, date range.

### 10. Authentication & Roles (V1)
- V1 can be restricted to **basic internal auth** behind SSO or simple email/password.
- Minimal roles:
  - `ADMIN/REVIEWER`
    - Upload creative.
    - Change statuses.
    - Add notes.
  - `CREATOR`
    - Upload creative.
    - See notes and respond by resubmitting revisions.
- Implementation detail (e.g., NextAuth, corporate SSO) will be wired via env keys and can be finalized later.

### 11. Technical Stack (Proposed V1)
- **Frontend**: Next.js with React, TypeScript, and a component library (e.g., Tailwind + headless components) for tabs, tables, filters, and dialogs.
- **Backend**: Next.js API routes serving JSON for assets and notes.
- **Database**: Relational DB (e.g., Postgres in prod, SQLite locally) using an ORM (e.g., Prisma).
- **File Storage**: Pluggable abstraction with environment-based configuration (e.g., local disk in dev, S3/GCS in prod). Image URLs stored in DB.

### 12. V1 Success Criteria
- CMO can log in, filter by product/platform, and see all creatives currently in `Queue`, `Needs Revision`, `Approved`, `Live`, and `Disapproved`.
- CMO can review an asset in the queue and change its status with a note in a single, clear flow.
- Creative team can see feedback, update creative, and resubmit.
- All status changes and feedback are captured and visible as a note history on each asset.


**Product Name:** Creative Approval Dashboard (CAD)
**Version:** V1 (Revised)
**Owner:** Performance Marketing
**Primary Stakeholder:** CMO
**Tech Stack:** React / Next.js, Node / Express, Postgres, Vercel
**Auth:** Deferred (V1 internal access)

---

# 1. Overview

## 1.1 Problem Statement

There is no centralized workflow for reviewing and approving paid media creative assets (image and/or ad copy) before launch. Approvals are fragmented, creating:

* Lack of status visibility
* No structured audit trail
* Risk of miscommunication
* Unclear ownership between CMO and Performance Marketing

---

# 2. Core Workflow (Updated)

## Roles & Responsibilities

### Creative Team

* Upload creative (image and/or ad copy)
* Select product(s)
* Select platform(s)
* Submit for review
* Respond to revisions

### CMO

* Reviews assets in Queue
* Approves / Disapproves / Requests Revision
* Adds notes

### Performance Marketing

* Responsible for marking assets from **Approved → Live**
* Receives notifications when assets are approved

---

# 3. Creative Submission (Updated Rules)

## Required Fields Logic (V1)

To keep V1 simple but flexible:

* **Image upload** → Optional
* **Ad copy** → Optional
* **At least one of Image OR Ad Copy is required**

This supports:

* Copy-only ads
* Image-only creatives
* Image + copy ads

### Required Metadata

* Product (single select)
* Platform (multi-select)
* Creator (auto-stored from submission session)
* Created timestamp

---

# 4. Product & Platform Taxonomy (Locked for V1)

## Products (Single Select)

* Jira
* Confluence
* Trello
* Jira Service Management
* Loom
* Bitbucket
* Rovo
* Rovo Dev
* DX
* Compass
* Jira Product Discovery
* Jira Work Management
* Jira Align
* Customer Service Management

---

## Platforms (Multi-Select Enabled)

### Search Engine Advertising & Paid Channels

* Google
* Microsoft (Bing)
* DV360 & Display
* Meta
* TikTok
* LinkedIn
* X
* Pinterest
* Snapchat
* Reddit
* Spotify
* iHeartMedia
* YouTube
* CTV
* ChatGPT

Users can select multiple platforms per creative.

---

# 5. Status Model (Updated Responsibility)

## Statuses

* Queue
* Needs Revision
* Approved
* Live
* Disapproved

## State Transitions

```
Queue → Approved (CMO)
Queue → Needs Revision (CMO)
Queue → Disapproved (CMO)

Needs Revision → Queue (Creative resubmits)

Approved → Live (Performance Marketing)

Any state → Disapproved (Admin override - future)
```

---

# 6. Notification Logic (New Requirement)

## Creator Tracking

When a creative is created:

* The system must automatically store:

  * `created_by`
  * `created_at`

This is required for:

* Status-based notifications
* Revision routing
* Audit trail

---

## Additional Notify Options

When submitting a creative, the creator can optionally:

* Add additional email addresses or users to notify when:

  * Status changes
  * Creative is Approved
  * Creative is Live
  * Revision is requested

Example use case:

* Creative adds Performance Marketing distribution list
* When CMO approves → PFM automatically notified

---

## Notification Events (V1 Minimal)

| Event          | Who Gets Notified     |
| -------------- | --------------------- |
| Approved       | Creator + Notify List |
| Needs Revision | Creator               |
| Disapproved    | Creator               |
| Marked Live    | Creator + Notify List |

Implementation can be:

* Email (V1)
* Slack webhook (V1+)

---

# 7. Views / Tabs

1. Queue
2. Needs Revision
3. Approved
4. Live
5. Disapproved

All views must support filtering by:

* Product
* Platform (multi-select)
* Creator
* Date (optional V1+)

Filters apply globally per session.

---

# 8. Data Model (Revised)

## CreativeAsset

```
CreativeAsset
- id (UUID)
- image_url (nullable)
- ad_copy (nullable)
- product (enum)
- platforms (array of enums)
- status (enum)
- created_by
- created_at
- updated_at
- approved_by
- approved_at
- live_by
- live_at
- notify_list (array)
```

Validation rule:

* image_url OR ad_copy must not both be null

---

## Notes

```
Note
- id
- creative_id
- author
- content
- type (approval, revision, comment)
- created_at
```

---

## Versions (Recommended for V1)

```
CreativeVersion
- id
- creative_id
- version_number
- image_url
- ad_copy
- updated_by
- updated_at
```

---

# 9. Tech Stack (Confirmed)

Frontend:

* React / Next.js

Backend:

* Node / Express

Database:

* Postgres

Hosting:

* Vercel

Auth:

* Deferred to V1.5 (internal access only initially)

File Storage:

* S3-compatible storage (or Vercel blob storage)

---

# 10. Non-Functional Requirements

* Role-based permissions (basic in V1)
* Audit logging required
* File storage secure
* Scalable to 1,000+ creatives
* <2s load time for 100 assets

---

# 11. V1 Scope (Clean & Lean)

Included:

* Image and/or copy submission
* Product tagging
* Multi-platform tagging
* Status workflow
* Approval logic
* Performance Marketing “Mark Live”
* Creator tracking
* Notify list
* Notes
* Filtering
* Revision cycle
* Audit trail

Not Included:

* Ad platform integrations
* Auto-publishing
* Performance reporting
* Legal routing
* Multi-stage approvals
* DAM capabilities
* Advanced permission controls
* SLA tracking
