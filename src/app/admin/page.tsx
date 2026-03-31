import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { getAdminDashboardData } from "@/modules/dashboard/queries";

export default async function AdminHomePage() {
  const data = await getAdminDashboardData();

  return <AdminDashboard data={data} />;
}
