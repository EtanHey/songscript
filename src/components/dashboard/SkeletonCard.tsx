export interface SkeletonCardProps {
  height?: string;
}

export function SkeletonCard({ height = "h-32" }: SkeletonCardProps) {
  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 ${height} animate-pulse`}>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        <div className="h-4 bg-gray-800 rounded w-2/3" />
      </div>
    </div>
  );
}
