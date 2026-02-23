"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type Status = 'queue' | 'needs_revision' | 'approved' | 'live' | 'disapproved';

interface Note {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface Asset {
  id: string;
  mediaUrl: string;
  adCopy: string;
  product: string;
  platforms: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
}

const STATUS_TABS: { key: Status; label: string }[] = [
  { key: 'queue', label: 'Queue' },
  { key: 'needs_revision', label: 'Needs Revision' },
  { key: 'approved', label: 'Approved' },
  { key: 'live', label: 'Live' },
  { key: 'disapproved', label: 'Disapproved' },
];

const PRODUCTS = [
  'Jira',
  'Confluence',
  'Trello',
  'Jira Service Management',
  'Loom',
  'Bitbucket',
  'Rovo',
  'Rovo Dev',
  'DX',
  'Compass',
  'Jira Product Discovery',
  'Jira Work Management',
  'Jira Align',
  'Customer Service Management',
];

const PLATFORMS = [
  'Google',
  'Microsoft (Bing)',
  'DV360 & Display',
  'Meta',
  'TikTok',
  'LinkedIn',
  'X',
  'Pinterest',
  'Snapchat',
  'Reddit',
  'Spotify',
  'iHeartMedia',
  'YouTube',
  'CTV',
  'ChatGPT',
];

export default function Dashboard() {
  const [activeStatus, setActiveStatus] = useState<Status>('queue');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  const [productFilter, setProductFilter] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);

  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);

  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [adCopy, setAdCopy] = useState('');
  const [product, setProduct] = useState<string>(PRODUCTS[0]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function fetchAssets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', activeStatus);
      productFilter.forEach((p) => params.append('product', p));
      platformFilter.forEach((p) => params.append('platform', p));
      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, productFilter, platformFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaFile || platforms.length === 0) return;
    setSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', mediaFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      if (!uploadRes.ok) {
        console.error(await uploadRes.text());
        return;
      }
      const { url: mediaUrl } = await uploadRes.json();

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl, adCopy, product, platforms }),
      });
      if (!res.ok) {
        console.error(await res.json());
        return;
      }
      setMediaFile(null);
      setAdCopy('');
      setProduct(PRODUCTS[0]);
      setPlatforms([]);
      fetchAssets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(
    assetId: string,
    newStatus: Status,
    note: string,
    noteType: 'approval' | 'revision_request' | 'disapproval' | 'comment' | 'status_change',
  ) {
    try {
      const res = await fetch(`/api/assets/${assetId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, note, noteType }),
      });
      if (!res.ok) {
        console.error(await res.json());
      } else {
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteAsset(id: string) {
    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Submission Form */}
      {showSubmissionForm && (
        <section className="rounded-lg border border-slate-800/50 bg-slate-900/40 p-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              New Creative Submission
            </h2>
            <button
              onClick={() => setShowSubmissionForm(false)}
              className="text-slate-400 hover:text-slate-200 text-sm"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Upload Image or Video
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Ad Copy</label>
              <textarea
                className="h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                value={adCopy}
                onChange={(e) => setAdCopy(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Product</label>
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Platforms (multi-select)
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const selected = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setPlatforms(
                          selected
                            ? platforms.filter((x) => x !== p)
                            : [...platforms, p],
                        )
                      }
                      className={`rounded-full px-2 py-0.5 text-[11px] border ${
                        selected
                          ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                          : 'border-slate-700 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg border border-blue-600/50 bg-blue-600/10 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-600/20 hover:border-blue-500/50 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit to Queue'}
              </button>
            </div>
          </form>
        </section>
      )}
      {!showSubmissionForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:border-slate-600 transition-colors"
          >
            + New
          </button>
        </div>
      )}

      {/* Tabs + Filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeStatus === tab.key
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:bg-slate-800/50 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 text-xs">
            <div className="relative">
              <button
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/50 hover:border-slate-700 transition-colors"
              >
                Products ({productFilter.length}) ▾
              </button>
              {productDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-slate-950 border border-slate-700 rounded-md p-2 z-10 max-h-64 overflow-y-auto">
                  {PRODUCTS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-xs hover:bg-slate-800 p-1">
                      <input
                        type="checkbox"
                        checked={productFilter.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProductFilter([...productFilter, p]);
                          } else {
                            setProductFilter(productFilter.filter((f) => f !== p));
                          }
                        }}
                        className="text-blue-500"
                      />
                      {p}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
                className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/50 hover:border-slate-700 transition-colors"
              >
                Platforms ({platformFilter.length}) ▾
              </button>
              {platformDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-slate-950 border border-slate-700 rounded-md p-2 z-10 max-h-64 overflow-y-auto">
                  {PLATFORMS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-xs hover:bg-slate-800 p-1">
                      <input
                        type="checkbox"
                        checked={platformFilter.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPlatformFilter([...platformFilter, p]);
                          } else {
                            setPlatformFilter(platformFilter.filter((f) => f !== p));
                          }
                        }}
                        className="text-blue-500"
                      />
                      {p}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/50 bg-slate-900/40 p-6">
          {loading ? (
            <div className="py-6 text-center text-sm text-slate-400">Loading...</div>
          ) : assets.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              No assets in this view.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  activeStatus={activeStatus}
                  onStatusChange={changeStatus}
                  onDelete={deleteAsset}
                  onUpdate={fetchAssets}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AssetCard({
  asset,
  activeStatus,
  onStatusChange,
  onDelete,
  onUpdate,
}: {
  asset: Asset;
  activeStatus: Status;
  onStatusChange: (
    id: string,
    newStatus: Status,
    note: string,
    noteType: 'approval' | 'revision_request' | 'disapproval' | 'comment' | 'status_change',
  ) => void;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}) {
  const VALID_TRANSITIONS = {
    queue: ['approved', 'needs_revision', 'disapproved'],
    needs_revision: ['queue'],
    approved: ['live', 'disapproved', 'queue'],
    live: ['approved'],
    disapproved: [],
  };

  const [showFullCopy, setShowFullCopy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editMediaFile, setEditMediaFile] = useState<File | null>(null);
  const [editAdCopy, setEditAdCopy] = useState(asset.adCopy);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [editStatus, setEditStatus] = useState<Status>(asset.status);

  // Find the most recent revision request note
  const revisionFeedback = asset.notes
    .filter((n: Note) => n.type === 'revision_request')
    .sort((a: Note, b: Note) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // Find when the asset went live (for live tab)
  // When status changes to 'live', a note is created with type 'status_change'
  // We find the most recent status_change note when viewing live tab
  const wentLiveNote = activeStatus === 'live' && asset.status === 'live'
    ? asset.notes
        .filter((n: Note) => n.type === 'status_change')
        .sort((a: Note, b: Note) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  // Display date: show "went live" date for live tab, otherwise show created date
  const displayDate = wentLiveNote?.createdAt || asset.createdAt;

  const canApprove = activeStatus === 'queue';
  const canRequestRevision = activeStatus === 'queue';
  const canDisapprove = activeStatus === 'queue';
  const canMarkLive = activeStatus === 'approved';
  const canDisapproveFromApproved = activeStatus === 'approved';
  const canBackToQueueFromApproved = activeStatus === 'approved';
  const canBackToApprovedFromLive = activeStatus === 'live';
  const canEditAndResubmit = activeStatus === 'queue' || activeStatus === 'needs_revision';

  const allowedStatuses = VALID_TRANSITIONS[activeStatus] || [];

  const platforms = asset.platforms.split(',');

  return (
    <>
      <div>
        <div className="relative h-48 w-full overflow-hidden rounded-lg border border-slate-800/50 bg-slate-900/50 cursor-pointer hover:border-slate-700 transition-colors"
          onClick={() => setShowModal(true)}
        >
          {asset.mediaUrl ? (
            asset.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={asset.mediaUrl} className="h-full w-full object-contain" controls />
            ) : (
              <Image
                src={asset.mediaUrl}
                alt="Creative preview"
                fill
                className="object-cover"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-600">
              No media
            </div>
          )}
        </div>
        <div className="space-y-3 mt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-800/50 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {asset.product}
            </span>
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-md bg-slate-800/50 px-2 py-0.5 text-[10px] font-medium text-slate-300"
              >
                {p}
              </span>
            ))}
            <span className="text-[10px] text-slate-500 ml-auto">
              {activeStatus === 'live' && wentLiveNote ? (
                <>
                  <span className="text-slate-400">Went live:</span>{' '}
                  {new Date(displayDate).toLocaleString()}
                </>
              ) : (
                new Date(displayDate).toLocaleString()
              )}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-400">
              Ad Copy
            </div>
            <div className="text-xs text-slate-200 leading-relaxed">
              {showFullCopy || asset.adCopy.length <= 160
                ? asset.adCopy
                : `${asset.adCopy.slice(0, 160)}...`}
              {asset.adCopy.length > 160 && (
                <button
                  type="button"
                  onClick={() => setShowFullCopy((v) => !v)}
                  className="ml-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showFullCopy ? 'Show less' : 'View full'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-4 pt-4 border-t border-slate-800/50">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {note.trim() !== '' && (
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800/30 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700/30 hover:border-slate-600 transition-colors"
                onClick={() => {
                  onStatusChange(asset.id, activeStatus, note, 'comment');
                  setNote('');
                }}
              >
                Add Comment
              </button>
            )}
          </div>
          {showNoteInput && (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                placeholder="Optional note for this action"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800/30 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700/30 transition-colors"
                onClick={() => setShowNoteInput(false)}
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {activeStatus === 'needs_revision' && revisionFeedback && (
              <button
                type="button"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-colors"
                onClick={() => setShowFeedbackModal(true)}
              >
                Review Feedback
              </button>
            )}
            {canApprove && (
              <button
                type="button"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                onClick={() => {
                  onStatusChange(asset.id, 'approved', note, 'approval');
                  setNote('');
                }}
              >
                Approve
              </button>
            )}
            {canRequestRevision && (
              <button
                type="button"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-colors"
                onClick={() => setShowRevisionModal(true)}
              >
                Request Revision
              </button>
            )}
            {canDisapprove && (
              <button
                type="button"
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 transition-colors"
                onClick={() => {
                  onStatusChange(asset.id, 'disapproved', note, 'disapproval');
                  setNote('');
                }}
              >
                Disapprove
              </button>
            )}
            {canMarkLive && (
              <button
                type="button"
                className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors"
                onClick={() => {
                  onStatusChange(asset.id, 'live', note, 'status_change');
                  setNote('');
                }}
              >
                Mark Live
              </button>
            )}
            {!isEditing && (
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/30 hover:border-slate-600 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
          {isEditing && (
            <div className="space-y-3 border-t border-slate-800/50 pt-4 mt-4">
              <div className="text-xs font-medium text-slate-400 mb-3">
                Edit Asset
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Status</label>
                <select
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Status)}
                >
                  <option value="queue">Queue</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="approved">Approved</option>
                  <option value="live">Live</option>
                  <option value="disapproved">Disapproved</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Media File</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 transition-colors"
                  onChange={(e) => setEditMediaFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Ad Copy</label>
                <textarea
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[80px]"
                  value={editAdCopy}
                  onChange={(e) => setEditAdCopy(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors"
                  onClick={async () => {
                  try {
                    let mediaUrl = asset.mediaUrl;
                    let hasChanges = false;
                    
                    if (editMediaFile) {
                      const fd = new FormData();
                      fd.append('file', editMediaFile);
                      const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: fd,
                      });
                      if (!uploadRes.ok) {
                        const errorData = await uploadRes.json().catch(() => ({ error: 'Upload failed' }));
                        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
                        return;
                      }
                      const { url } = await uploadRes.json();
                      mediaUrl = url;
                      hasChanges = true;
                    }

                    if (editAdCopy !== asset.adCopy) {
                      hasChanges = true;
                    }

                    if (editStatus !== asset.status) {
                      hasChanges = true;
                    }

                    // Only update the asset if there are actual changes
                    if (hasChanges) {
                      await fetch(`/api/assets/${asset.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaUrl, adCopy: editAdCopy }),
                      });
                    }

                    // Update status if it changed
                    if (editStatus !== activeStatus) {
                      onStatusChange(asset.id, editStatus, note || 'Status changed', 'status_change');
                      setNote('');
                    } else if (activeStatus === 'queue') {
                      // Just refresh if still in queue and no status change
                      if (hasChanges) {
                        onUpdate();
                      }
                    }
                    
                    setIsEditing(false);
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                {activeStatus === 'queue' ? 'Save Changes' : 'Save Changes'}
              </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700/30 hover:border-slate-600 transition-colors"
                    onClick={() => {
                      setIsEditing(false);
                      setEditMediaFile(null);
                      setEditAdCopy(asset.adCopy);
                      setEditStatus(asset.status);
                      setNote('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this asset?')) {
                        onDelete(asset.id);
                        setIsEditing(false);
                      }
                    }}
                  >
                    Delete
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowModal(false)}
        >
          <div className="relative p-4" onClick={(e) => e.stopPropagation()}>
            {asset.mediaUrl ? (
              asset.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video 
                  src={asset.mediaUrl} 
                  className="max-h-[90vh] max-w-[90vw] object-contain" 
                  controls
                  autoPlay
                />
              ) : (
                <Image
                  src={asset.mediaUrl}
                  alt="Creative full view"
                  width={800}
                  height={600}
                  className="max-h-full max-w-full object-contain"
                />
              )
            ) : (
              <div className="text-white">No media</div>
            )}
            <button
              className="absolute top-2 right-2 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(false);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showNotesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowNotesModal(false)}
        >
          <div className="relative max-h-full max-w-full p-4 bg-slate-900 rounded-md">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Notes & History</h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {asset.notes.length === 0 ? (
                <div className="text-slate-500">No notes yet.</div>
              ) : (
                asset.notes.map((n: Note) => (
                  <div key={n.id} className="border-b border-slate-800 pb-1 last:border-0">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{n.type}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-slate-100">{n.message}</div>
                  </div>
                ))
              )}
            </div>
            <button
              className="absolute top-2 right-2 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotesModal(false);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showRevisionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => {
            setShowRevisionModal(false);
            setRevisionNote('');
          }}
        >
          <div 
            className="relative w-full max-w-md p-6 bg-slate-900 rounded-lg border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Request Revision</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Feedback / Notes <span className="text-slate-500">(required)</span>
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all min-h-[120px]"
                  placeholder="Please provide feedback on what needs to be revised..."
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/30 hover:border-slate-600 transition-colors"
                  onClick={() => {
                    setShowRevisionModal(false);
                    setRevisionNote('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (revisionNote.trim()) {
                      onStatusChange(asset.id, 'needs_revision', revisionNote.trim(), 'revision_request');
                      setShowRevisionModal(false);
                      setRevisionNote('');
                    }
                  }}
                  disabled={!revisionNote.trim()}
                >
                  Submit Revision Request
                </button>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 rounded-lg bg-slate-800/50 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
              onClick={() => {
                setShowRevisionModal(false);
                setRevisionNote('');
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showFeedbackModal && revisionFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowFeedbackModal(false)}
        >
          <div 
            className="relative w-full max-w-md p-6 bg-slate-900 rounded-lg border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Revision Feedback</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Feedback from Reviewer
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {new Date(revisionFeedback.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm text-slate-200 min-h-[120px] whitespace-pre-wrap">
                  {revisionFeedback.message}
                </div>
                {revisionFeedback.author && (
                  <div className="mt-2 text-xs text-slate-400">
                    By: {revisionFeedback.author.name || revisionFeedback.author.email}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/30 hover:border-slate-600 transition-colors"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 rounded-lg bg-slate-800/50 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
              onClick={() => setShowFeedbackModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
