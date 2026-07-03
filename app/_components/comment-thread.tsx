"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  fetchComments,
  addComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  type Comment,
  type CommentTarget,
} from "@/app/actions/comments";

const TOP_LEVEL_PAGE_SIZE = 5;
const REPLIES_PAGE_SIZE = 3;

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

function buildTree(comments: Comment[]) {
  const byId = new Map<string, Comment>();
  const childrenByParent = new Map<string, Comment[]>();
  for (const c of comments) byId.set(c.id, c);
  for (const c of comments) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }
  return { byId, childrenByParent };
}

function flattenDescendants(rootId: string, childrenByParent: Map<string, Comment[]>): Comment[] {
  const result: Comment[] = [];
  const stack = [...(childrenByParent.get(rootId) ?? [])];
  let guard = 0;
  while (stack.length > 0 && guard < 500) {
    guard++;
    const next = stack.shift()!;
    result.push(next);
    stack.push(...(childrenByParent.get(next.id) ?? []));
  }
  result.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return result;
}

function isOmitted(comment: Comment, childrenByParent: Map<string, Comment[]>): boolean {
  if (!comment.deleted_at) return false;
  return (childrenByParent.get(comment.id) ?? []).length === 0;
}

function CommentRow({
  comment,
  rootId,
  byId,
  currentUserId,
  onToggleLike,
  onOpenReplyForm,
  replyFormOpen,
  isEditing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  editSubmitting,
  isConfirmingDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  deleteSubmitting,
  onStartEdit,
}: {
  comment: Comment;
  rootId: string;
  byId: Map<string, Comment>;
  currentUserId: string | null;
  onToggleLike: (id: string, currentlyLiked: boolean) => void;
  onOpenReplyForm: () => void;
  replyFormOpen: boolean;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editSubmitting: boolean;
  isConfirmingDelete: boolean;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  deleteSubmitting: boolean;
  onStartEdit: () => void;
}) {
  const authorName = comment.profiles?.display_name ?? comment.profiles?.username ?? "Someone";
  const isDeleted = !!comment.deleted_at;
  const isReply = comment.parent_id !== null;
  const replyingToParent = isReply && comment.parent_id !== rootId ? byId.get(comment.parent_id!) : null;
  const isOwn = !!currentUserId && comment.user_id === currentUserId;

  if (isDeleted) {
    return (
      <div className={isReply ? "ml-4 border-l border-zinc-100 pl-3" : ""}>
        <p className="text-xs italic text-zinc-400">
          <span className="font-medium text-zinc-500">{authorName}</span> deleted this comment
        </p>
      </div>
    );
  }

  return (
    <div className={isReply ? "ml-4 border-l border-zinc-100 pl-3" : ""}>
      {replyingToParent && (
        <p className="text-[11px] text-zinc-400">
          Replying to @{replyingToParent.profiles?.username ?? replyingToParent.profiles?.display_name ?? "someone"}
        </p>
      )}
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value.slice(0, 150))}
            className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-800 focus:border-zinc-400 focus:outline-none"
          />
          <button
            onClick={onSaveEdit}
            disabled={!editText.trim() || editSubmitting}
            className="text-[11px] font-medium text-zinc-900 disabled:opacity-40 transition-opacity"
          >
            {editSubmitting ? "…" : "Save"}
          </button>
          <button onClick={onCancelEdit} className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-600">
          <span className="font-medium text-zinc-800">{authorName}</span> {comment.body}
          {comment.edited_at && <span className="ml-1 text-zinc-300">(edited)</span>}
        </p>
      )}

      {!isEditing && (
        <div className="mt-0.5 flex items-center gap-3">
          <button
            onClick={() => onToggleLike(comment.id, comment.liked_by_me)}
            aria-label={comment.liked_by_me ? "Unlike" : "Like"}
            className={`flex items-center gap-1 transition-colors ${
              comment.liked_by_me ? "text-rose-500 hover:text-rose-400" : "text-zinc-300 hover:text-rose-400"
            }`}
          >
            <HeartIcon filled={comment.liked_by_me} />
            {comment.like_count > 0 && <span className="text-[11px]">{comment.like_count}</span>}
          </button>
          <button
            onClick={onOpenReplyForm}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {replyFormOpen ? "Cancel" : "Reply"}
          </button>
          {isOwn && !isConfirmingDelete && (
            <>
              <button
                onClick={onStartEdit}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onRequestDelete}
                className="text-[11px] text-zinc-400 hover:text-rose-500 transition-colors"
              >
                Delete
              </button>
            </>
          )}
          {isConfirmingDelete && (
            <span className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-400">Delete?</span>
              <button
                onClick={onConfirmDelete}
                disabled={deleteSubmitting}
                className="font-medium text-rose-500 hover:text-rose-600 disabled:opacity-40 transition-colors"
              >
                {deleteSubmitting ? "…" : "Yes"}
              </button>
              <button onClick={onCancelDelete} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                Cancel
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentThread({
  target,
  initialCount,
  currentUserId,
}: {
  target: CommentTarget;
  initialCount: number;
  currentUserId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [visibleTopLevelCount, setVisibleTopLevelCount] = useState(TOP_LEVEL_PAGE_SIZE);
  const [visibleReplies, setVisibleReplies] = useState<Map<string, number>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  function loadComments() {
    fetchComments(target).then((result) => {
      if ("error" in result) {
        setLoadError(true);
      } else {
        setLoadError(false);
        setComments(result);
        setCount(result.filter((c) => !c.deleted_at).length);
      }
    });
  }

  useEffect(() => {
    if (!open || comments !== null || loadError) return;
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target.type, target.id, comments, loadError]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function refresh() {
    const updated = await fetchComments(target);
    if (!("error" in updated)) {
      setComments(updated);
      setCount(updated.filter((c) => !c.deleted_at).length);
    }
  }

  const { byId, childrenByParent } = useMemo(() => buildTree(comments ?? []), [comments]);
  const topLevel = useMemo(
    () => (comments ?? []).filter((c) => c.parent_id === null),
    [comments]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    const body = text.trim();
    setSubmitError(null);
    setSubmitting(true);
    const result = await addComment(target, body);
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
    const result = await addComment(target, replyText.trim(), parentId);
    setReplySubmitting(false);
    if (result?.error) return;
    setReplyText("");
    setReplyingTo(null);
    await refresh();
  }

  async function handleSaveEdit(commentId: string) {
    if (!editText.trim() || editSubmitting) return;
    setEditSubmitting(true);
    const result = await editComment(commentId, editText.trim());
    setEditSubmitting(false);
    if (result?.error) return;
    setEditingId(null);
    await refresh();
  }

  async function handleConfirmDelete(commentId: string) {
    setDeleteSubmitting(true);
    await deleteComment(commentId);
    setDeleteSubmitting(false);
    setDeleteConfirmId(null);
    await refresh();
  }

  async function handleToggleLike(commentId: string, currentlyLiked: boolean) {
    setComments((prev) =>
      prev
        ? prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  liked_by_me: !currentlyLiked,
                  like_count: currentlyLiked ? c.like_count - 1 : c.like_count + 1,
                }
              : c
          )
        : prev
    );
    const result = await toggleCommentLike(commentId, currentlyLiked);
    if (result?.error) {
      setComments((prev) =>
        prev
          ? prev.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    liked_by_me: currentlyLiked,
                    like_count: currentlyLiked ? c.like_count + 1 : c.like_count - 1,
                  }
                : c
            )
          : prev
      );
    }
  }

  function rowHandlers(comment: Comment) {
    return {
      onToggleLike: handleToggleLike,
      onOpenReplyForm: () => {
        setReplyingTo((v) => (v === comment.id ? null : comment.id));
        setReplyText("");
      },
      replyFormOpen: replyingTo === comment.id,
      isEditing: editingId === comment.id,
      editText,
      onEditTextChange: setEditText,
      onSaveEdit: () => handleSaveEdit(comment.id),
      onCancelEdit: () => setEditingId(null),
      editSubmitting,
      isConfirmingDelete: deleteConfirmId === comment.id,
      onRequestDelete: () => setDeleteConfirmId(comment.id),
      onConfirmDelete: () => handleConfirmDelete(comment.id),
      onCancelDelete: () => setDeleteConfirmId(null),
      deleteSubmitting,
      onStartEdit: () => {
        setEditingId(comment.id);
        setEditText(comment.body ?? "");
      },
    };
  }

  const visibleTopLevel = topLevel.slice(0, visibleTopLevelCount);
  const remainingTopLevel = topLevel.length - visibleTopLevel.length;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close comments" : "Comment"}
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
          {comments === null ? (
            loadError ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-rose-500">Failed to load comments.</p>
                <button
                  onClick={loadComments}
                  className="text-xs text-zinc-500 underline hover:text-zinc-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">Loading…</p>
            )
          ) : topLevel.length === 0 ? (
            <p className="text-xs text-zinc-400">No comments yet.</p>
          ) : (
            <div className="space-y-2">
              {visibleTopLevel.map((root) => {
                if (isOmitted(root, childrenByParent)) return null;
                const descendants = flattenDescendants(root.id, childrenByParent);
                const visibleReplyCount = visibleReplies.get(root.id) ?? REPLIES_PAGE_SIZE;
                const shownReplies = descendants.slice(0, visibleReplyCount);
                const remainingReplies = descendants.length - shownReplies.length;

                return (
                  <div key={root.id}>
                    <CommentRow
                      comment={root}
                      rootId={root.id}
                      byId={byId}
                      currentUserId={currentUserId}
                      {...rowHandlers(root)}
                    />
                    {replyingTo === root.id && (
                      <ReplyForm
                        placeholder={`Reply to ${root.profiles?.display_name ?? root.profiles?.username ?? "them"}…`}
                        value={replyText}
                        onChange={setReplyText}
                        onSubmit={() => handleReplySubmit(root.id)}
                        submitting={replySubmitting}
                        indent
                      />
                    )}
                    {shownReplies.length > 0 && (
                      <div className="mt-1.5 space-y-1.5">
                        {shownReplies.map((child) => (
                          <div key={child.id}>
                            <CommentRow
                              comment={child}
                              rootId={root.id}
                              byId={byId}
                              currentUserId={currentUserId}
                              {...rowHandlers(child)}
                            />
                            {replyingTo === child.id && (
                              <ReplyForm
                                placeholder={`Reply to ${
                                  child.profiles?.display_name ?? child.profiles?.username ?? "them"
                                }…`}
                                value={replyText}
                                onChange={setReplyText}
                                onSubmit={() => handleReplySubmit(child.id)}
                                submitting={replySubmitting}
                                indent
                              />
                            )}
                          </div>
                        ))}
                        {remainingReplies > 0 && (
                          <button
                            onClick={() =>
                              setVisibleReplies((prev) => new Map(prev).set(root.id, descendants.length))
                            }
                            className="ml-4 text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
                          >
                            Show {remainingReplies} more repl{remainingReplies === 1 ? "y" : "ies"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {remainingTopLevel > 0 && (
                <button
                  onClick={() => setVisibleTopLevelCount(topLevel.length)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Show {remainingTopLevel} more comment{remainingTopLevel === 1 ? "" : "s"}
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 150))}
              placeholder="Write a comment…"
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

function ReplyForm({
  placeholder,
  value,
  onChange,
  onSubmit,
  submitting,
  indent,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  indent: boolean;
}) {
  return (
    <div className={`${indent ? "ml-4" : ""} mt-1.5 flex items-center gap-2`}>
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 150))}
        placeholder={placeholder}
        className="flex-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim() || submitting}
        className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 transition-opacity"
      >
        {submitting ? "…" : "Send"}
      </button>
    </div>
  );
}
