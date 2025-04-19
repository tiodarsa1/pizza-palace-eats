
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdminOrderAlert from "../admin/AdminOrderAlert";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {isAdmin() && <AdminOrderAlert />}
    </div>
  );
};

export default Layout;
