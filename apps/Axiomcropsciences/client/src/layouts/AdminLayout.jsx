import { Outlet } from "react-router-dom";

import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";
import NotificationCenter from "../components/navigation/NotificationCenter";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">
        <Topbar />

        <div className="admin-content-wrapper">
          <main className="admin-content">
            <Outlet />
          </main>

          <NotificationCenter />
        </div>
      </div>
    </div>
  );
}