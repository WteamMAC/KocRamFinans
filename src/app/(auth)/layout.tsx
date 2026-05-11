import SlidingAuth from "@/components/auth/sliding-auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <SlidingAuth />
      <div className="hidden">{children}</div>
    </div>
  );
}
