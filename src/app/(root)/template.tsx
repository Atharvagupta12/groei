// Re-mounts on every navigation, giving each page a subtle entrance animation.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="duration-300 animate-in fade-in-0 slide-in-from-bottom-1">{children}</div>;
}
