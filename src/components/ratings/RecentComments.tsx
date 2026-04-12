interface FeedbackComment {
  id: string;
  score: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
  rater: {
    name: string;
  };
}

interface RecentCommentsProps {
  comments: FeedbackComment[];
}

export default function RecentComments({ comments }: RecentCommentsProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-(--text-3)">No written feedback yet.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((item) => (
        <div key={item.id} className="rounded-lg border border-border bg-(--bg-muted) p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-(--text-3)">
            <span>{item.rater.name}</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="mb-2 text-sm text-foreground">{"★".repeat(item.score)}</p>
          {item.comment && <p className="text-sm text-(--text-2)">{item.comment}</p>}
          {item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={`${item.id}-${tag}`}
                  className="rounded-full border border-border bg-white px-2 py-0.5 text-[11px] text-(--text-3)"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
