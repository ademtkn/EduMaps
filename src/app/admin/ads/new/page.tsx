import { AdForm } from "@/components/admin/ad-form";
import { EMPTY_AD } from "@/lib/admin-defaults";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "New campaign" };

export default function NewAdPage() {
  return (
    <AdminPage title="New campaign">
      <AdForm initial={EMPTY_AD()} />
    </AdminPage>
  );
}
