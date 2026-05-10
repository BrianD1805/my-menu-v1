import { requireAdminPageUser } from "@/lib/admin-auth";
import BillingActivationJourney from "@/components/admin/BillingActivationJourney";

export default async function AdminBillingActivatePage() {
  await requireAdminPageUser();
  return <BillingActivationJourney mode="page" />;
}
