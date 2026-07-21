import { getStaffUser } from "@/lib/auth/getStaffUser";
import { StaffHeader } from "@/components/staff/StaffHeader";

export default async function CashierLayout({ children }: { children: React.ReactNode }) {
  const { fullName } = await getStaffUser("cashier");

  return (
    <div className="min-h-screen bg-cream font-sans">
      <StaffHeader title="Cashier" fullName={fullName} accent="terracotta" />
      {children}
    </div>
  );
}
