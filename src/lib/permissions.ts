// Pure permission logic for StatusItem access. ID comparison is preferred;
// name comparison remains as a fallback for rows created before the FK
// migration (assigneeId/reviewerId/creator_id backfill).

export interface SessionLike {
  userId: string;
  name: string;
  isAdmin?: boolean;
}

export interface ItemLike {
  creator_id: string | null;
  creator_name: string;
  assignee: string | null;
  reviewer: string | null;
  assigneeId: string | null;
  reviewerId: string | null;
  project: string | null;
}

export function isCreator(s: SessionLike, item: ItemLike): boolean {
  if (item.creator_id) return item.creator_id === s.userId;
  return item.creator_name === s.name;
}

export function isAssignee(s: SessionLike, item: ItemLike): boolean {
  if (item.assigneeId) return item.assigneeId === s.userId;
  return !!item.assignee && item.assignee === s.name;
}

export function isReviewer(s: SessionLike, item: ItemLike): boolean {
  if (item.reviewerId) return item.reviewerId === s.userId;
  return !!item.reviewer && item.reviewer === s.name;
}

/** Edit/delete the item itself: admin or creator. */
export function canModifyItem(s: SessionLike, item: ItemLike): boolean {
  if (s.isAdmin) return true;
  return isCreator(s, item);
}

/** Change status: admin, creator, assignee or reviewer. */
export function canChangeStatus(s: SessionLike, item: ItemLike): boolean {
  if (s.isAdmin) return true;
  return isCreator(s, item) || isAssignee(s, item) || isReviewer(s, item);
}

/**
 * View check without DB access. Returns true (allowed), false (denied) or
 * "project" — direct involvement failed, caller must check project membership.
 */
export function canViewItemDirect(s: SessionLike, item: ItemLike): boolean | "project" {
  if (s.isAdmin) return true;
  if (isCreator(s, item) || isAssignee(s, item) || isReviewer(s, item)) return true;
  return item.project ? "project" : false;
}
