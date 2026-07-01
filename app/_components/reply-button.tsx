"use client";

import { useState, useRef, useEffect } from "react";
import { fetchReplies, addReply, toggleCommentLike, type Reply } from "@/app/actions/replies";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentRow({
  reply,
  isReply,
  onToggleLike,
  onOpenReplyForm,
  replyFormOpen,
}: {
  reply: Reply;
  isReply: boolean;
  onToggleLike: (id: string, currentlyLiked: boolean) => void;
  onOpenReplyForm?: () => void;
  replyFormOpen?: boolean;
}) {
  return (
    <div className={isReply ? "ml-4 border-l border-zinc-100 pl-3" : ""}>
      <p className="text-xs text-zinc-600">
        <span className="font-medium text-zinc-800">
          {reply.profiles?.display_name ?? reply.profiles?.username ?? "Someone"}
        </span>{" "}
        {reply.body}
      </p>
      <div className="mt-0.5 flex items-center gap-3">
        <button
          onClick={() => onToggleLike(reply.id, reply.liked_by_me)}
          aria-label={reply.liked_by_me ? "Unlike" : "Like"}
          className={`flex items-center gap-1 transition-colors ${
            reply.liked_by_me ? "text-rose-500 hover:text-rose-400" : "text-zinc-300 hover:text-rose-400"
          }`}
        >
          <HeartIcon filled={reply.liked_by_me} />
          {reply.like_count > 0 && <span className="text-[11px]">{reply.like_count}</span>}
        </button>
        {!isReply && onOpenReplyForm && (
          <button
            onClick={onOpenReplyForm}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {replyFormOpen ? "Cancel" : "Reply"}
          </button>
        )}
      </div>
    </div>
  );
}

export function ReplyButton({
  postId,
  initialCount,
}: {
  postId: string;
  initialCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[] | null>(null);
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || replies !== null) return;
    fetchReplies(postId).then((result) => {
      if (!("error" in result)) setReplies(result);
    });
  }, [open, postId, replies]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function refresh() {
    const updated = await fetchReplies(postId);
    if (!("error" in updated)) {
      setReplies(updated);
      setCount(updated.length);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    const body = text.trim();
    setSubmitError(null);
    setSubmitting(true);
    const result = await addReply(postId, body);
    if (result?.error) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }
    setText("");
    await refresh();
    setSubmitting(false);
  }

  async function handleReplySubmit(parentId: string) {
    if (!replyText.trim() || replySubmitting) return;
    setReplySubmitting(true);
    const result = await addReply(postId, replyText.trim(), parentId);
    setReplySubmitting(false);
    if (result?.error) return;
    setReplyText("");
    setReplyingTo(null);
    await refresh();
  }

  async function handleToggleLike(commentId: string, currentlyLiked: boolean) {
    setReplies((prev) =>
      prev
        ? prev.map((r) =>
            r.id === commentId
              ? {
                  ...r,
                  liked_by_me: !currentlyLiked,
                  like_count: currentlyLiked ? r.like_count - 1 : r.like_count + 1,
                }
              : r
          )
        : prev
    );
    const result = await toggleCommentLike(commentId, currentlyLiked);
    if (result?.error) {
      setReplies((prev) =>
        prev
          ? prev.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    liked_by_me: currentlyLiked,
                    like_count: currentlyLiked ? r.like_count + 1 : r.like_count - 1,
                  }
                : r
            )
          : prev
      );
    }
  }

  const topLevel = replies?.filter((r) => r.parent_id === null) ?? [];
  const repliesByParent = new Map<string, Reply[]>();
  for (const r of replies ?? []) {
    if (!r.parent_id) continue;
    const list = repliesByParent.get(r.parent_id) ?? [];
    list.push(r);
    repliesByParent.set(r.parent_id, list);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close replies" : "Reply"}
        className={`flex items-center gap-1.5 transition-colors ${
          open ? "text-zinc-600" : "text-zinc-400 hover:text-zinc-600"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {count > 0 && <span className="text-xs text-zinc-400">{count}</span>}
      </button>

      {open && (
        <div className="space-y-2">
          {replies === null ? (
            <p className="text-xs text-zinc-400">Loading…</p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-zinc-400">No replies yet.</p>
          ) : (
            <div className="space-y-2">
              {topLevel.map((r) => (
                <div key={r.id}>
                  <CommentRow
                    reply={r}
                    isReply={false}
                    onToggleLike={handleToggleLike}
                    onOpenReplyForm={() => setReplyingTo((v) => (v === r.id ? null : r.id))}
                    replyFormOpen={replyingTo === r.id}
                  />
                  {(repliesByParent.get(r.id) ?? []).length > 0 && (
                    <div className="mt-1.5 space-y-1.5">
                      {(repliesByParent.get(r.id) ?? []).map((child) => (
                        <CommentRow key={child.id} reply={child} isReply onToggleLike={handleToggleLike} />
                      ))}
                    </div>
                  )}
                  {replyingTo === r.id && (
                    <div className="ml-4 mt-1.5 flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value.slice(0, 150))}
                        placeholder={`Reply to ${r.profiles?.display_name ?? r.profiles?.username ?? "them"}…`}
                        className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                      />
                      <button
                        onClick={() => handleReplySubmit(r.id)}
                        disabled={!replyText.trim() || replySubmitting}
                        className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-opacity"
                      >
                        {replySubmitting ? "…" : "Send"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 150))}
              placeholder="Write a reply…"
              className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-opacity"
            >
              {submitting ? "…" : "Send"}
            </button>
          </form>
          {submitError && <p className="text-xs text-rose-500">{submitError}</p>}
        </div>
      )}
    </div>
  );
}
