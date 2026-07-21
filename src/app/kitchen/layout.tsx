import { getStaffUser } from "@/lib/auth/getStaffUser";
import { StaffHeader } from "@/components/staff/StaffHeader";

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  const { fullName } = await getStaffUser("kitchen");

  return (
    <div className="min-h-screen bg-cream font-sans">
      <StaffHeader title="Kitchen" fullName={fullName} accent="sage" />
      {children}
    </div>
  );
}
