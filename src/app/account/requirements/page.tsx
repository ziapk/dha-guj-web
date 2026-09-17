"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined, StopOutlined, UndoOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Empty, Popconfirm, Skeleton, Tag, Tooltip } from "antd";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { WantedCard } from "@/components/wanted-card";
import { clientApi } from "@/lib/client-api";
import { formatDate } from "@/lib/labels";
import type { Paginated, Resource, WantedPost } from "@/types/api";

/** The API allows this many open requirements per buyer. */
const MAX_OPEN = 5;

type Status = "open" | "pending" | "rejected" | "closed" | "expired";

const STATUS_TAGS: Record<Status, { color: string; label: string }> = {
  open: { color: "green", label: "Live" },
  pending: { color: "gold", label: "Pending review" },
  rejected: { color: "red", label: "Not approved" },
  closed: { color: "default", label: "Closed" },
  expired: { color: "orange", label: "Expired" },
};

function statusOf(post: WantedPost): Status {
  if (post.is_open) {
    return post.approval_status === "rejected" ? "rejected" : post.approval_status === "pending" ? "pending" : "open";
  }

  return post.status === "closed" ? "closed" : "expired";
}

function visibilityNote(post: WantedPost, status: Status): string {
  switch (status) {
    case "open":
      return `Visible until ${formatDate(post.expires_at)}`;
    case "pending":
      return "Our team is reviewing it. Sellers see it once approved.";
    case "rejected":
      return `Reason: ${post.rejection_reason ?? "—"}. Edit it to send it for review again.`;
    case "expired":
      return `Expired ${formatDate(post.expires_at)}`;
    default:
      return "Hidden from sellers";
  }
}

export default function RequirementsPage() {
  const { user, isLoading, requireLogin } = useSession();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const posts = useQuery({
    queryKey: ["my-wanted-posts"],
    queryFn: () => clientApi<Paginated<WantedPost>>("portal/my-wanted-posts", { query: { per_page: 50 } }),
    enabled: Boolean(user),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "closed" }) => clientApi<Resource<WantedPost>>(`portal/my-wanted-posts/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: (_data, { status }) => {
      message.success(status === "closed" ? "Requirement closed. Sellers can no longer see it." : "Requirement reopened for another 30 days.");
      queryClient.invalidateQueries({ queryKey: ["my-wanted-posts"] });
    },
    onError: (error) => message.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => clientApi(`portal/my-wanted-posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success("Requirement deleted");
      queryClient.invalidateQueries({ queryKey: ["my-wanted-posts"] });
    },
    onError: (error) => message.error(error.message),
  });

  if (!isLoading && !user) {
    return (
      <div className="container page-section">
        <Empty description="Log in to see your requirements">
          <Button type="primary" onClick={requireLogin}>
            Log in
          </Button>
        </Empty>
      </div>
    );
  }

  const items = posts.data?.data ?? [];
  const openCount = items.filter((post) => post.is_open).length;
  const atLimit = openCount >= MAX_OPEN;

  return (
    <div className="container page-section">
      <div className="section-head">
        <div>
          <h1 className="account-title">My requirements</h1>
          <p>
            {posts.data ? `${openCount} of ${MAX_OPEN} open · ` : ""}Our team reviews each requirement; once approved, sellers with a match unlock your contact details and get in touch.
          </p>
        </div>
        <Link href="/wanted">All buyer requirements →</Link>
      </div>

      {posts.data && items.length > 0 && (
        <div className="account-toolbar">
          {atLimit ? (
            <Tooltip title={`You can have up to ${MAX_OPEN} open requirements. Close one to post another.`}>
              <Button type="primary" icon={<PlusOutlined />} disabled>
                Post a requirement
              </Button>
            </Tooltip>
          ) : (
            <Link href="/account/requirements/new">
              <Button type="primary" icon={<PlusOutlined />}>
                Post a requirement
              </Button>
            </Link>
          )}
        </div>
      )}

      {posts.isLoading || isLoading ? (
        <Skeleton active />
      ) : posts.isError ? (
        <div className="empty-results">
          <h2>Could not load your requirements</h2>
          <p>{posts.error.message}</p>
          <Button type="primary" onClick={() => posts.refetch()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>📋</div>
          <h2>No requirements yet</h2>
          <p>Tell owners and agencies what you are looking for, and let them come to you.</p>
          <Link className="btn btn-primary" href="/account/requirements/new">
            Post your requirement
          </Link>
        </div>
      ) : (
        <ul className="requirement-list">
          {items.map((post) => {
            const status = statusOf(post);
            const unlocks = post.unlocks_count ?? 0;
            const busy = (setStatus.isPending && setStatus.variables?.id === post.id) || (remove.isPending && remove.variables === post.id);

            return (
              <li key={post.id} className="requirement-item">
                <div className="requirement-status">
                  <Tag color={STATUS_TAGS[status].color}>{STATUS_TAGS[status].label}</Tag>
                  <span>
                    {unlocks === 0 ? "No sellers have unlocked it yet" : `${unlocks} seller${unlocks === 1 ? "" : "s"} unlocked your contact details`}
                  </span>
                  <span>{visibilityNote(post, status)}</span>
                </div>
                <WantedCard post={post} />
                <div className="requirement-actions">
                  <Link href={`/account/requirements/${post.id}/edit`}>
                    <Button icon={<EditOutlined />} aria-label={`Edit requirement #${post.id}`}>
                      Edit
                    </Button>
                  </Link>
                  {post.is_open ? (
                    <Popconfirm title="Close this requirement?" description="Sellers will no longer see it. You can reopen it later." okText="Close it" onConfirm={() => setStatus.mutate({ id: post.id, status: "closed" })}>
                      <Button icon={<StopOutlined />} loading={busy && setStatus.isPending}>
                        Close
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Tooltip title={atLimit ? `You already have ${MAX_OPEN} open requirements. Close one first.` : "Show it to sellers for another 30 days"}>
                      <Button icon={<UndoOutlined />} disabled={atLimit} loading={busy && setStatus.isPending} onClick={() => setStatus.mutate({ id: post.id, status: "active" })}>
                        Reopen
                      </Button>
                    </Tooltip>
                  )}
                  <Popconfirm title="Delete this requirement?" description="This cannot be undone." okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => remove.mutate(post.id)}>
                    <Button danger icon={<DeleteOutlined />} loading={busy && remove.isPending}>
                      Delete
                    </Button>
                  </Popconfirm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
