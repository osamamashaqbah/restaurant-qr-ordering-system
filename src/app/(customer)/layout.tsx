import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { CustomerSessionProvider } from "@/lib/customer/SessionProvider";
import { CartProvider } from "@/lib/customer/CartProvider";
import { TopBar } from "@/components/customer/TopBar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <CustomerSessionProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col font-sans">
            <TopBar />
            <main className="flex-1">{children}</main>
          </div>
        </CartProvider>
      </CustomerSessionProvider>
    </LocaleProvider>
  );
}
