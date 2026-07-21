import { getStaffUser } from "@/lib/auth/getStaffUser";
import { StaffHeader } from "@/components/staff/StaffHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { fullName } = await getStaffUser("admin");

  return (
    <div className="min-h-screen bg-cream font-sans">
      <StaffHeader title="Admin" fullName={fullName} accent="charcoal" />
      {children}
    </div>
  );
}
