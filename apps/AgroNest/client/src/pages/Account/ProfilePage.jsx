import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiUser, FiPackage, FiLogOut } from "react-icons/fi";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import { useUser } from "../../context/UserContext";
import API from "../../api/axios";
import "../../styles/site.css";

export default function ProfilePage() {
  const { user, logout, loading } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: user || {}
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      API.get("/orders/my-orders")
        .then(res => setOrders(res.data))
        .catch(err => console.error(err))
        .finally(() => setOrdersLoading(false));
    }
  }, [user]);

  if (loading || !user) return <div className="site-root" style={{ minHeight: "100vh" }} />;

  const onUpdateProfile = async (data) => {
    try {
      await API.put("/users/me", data);
      toast.success("Profile updated");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="site-root">
      <Navbar />
      <div className="site-container" style={{ padding: "120px 0 60px", minHeight: "60vh", display: "grid", gridTemplateColumns: "300px 1fr", gap: 40 }}>
        
        {/* Sidebar */}
        <aside style={{ background: "var(--site-bg)", padding: 20, borderRadius: 12, border: "1px solid var(--site-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
            <div style={{ width: 50, height: 50, borderRadius: 25, background: "var(--site-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: "bold" }}>
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{user.fullName}</div>
              <div style={{ fontSize: 13, color: "var(--site-text-muted)" }}>{user.email}</div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={{ 
              textAlign: "left", padding: "12px 16px", background: "var(--site-green-light)", 
              color: "var(--site-primary)", border: "none", borderRadius: 10, 
              fontWeight: 600, display: "flex", alignItems: "center", gap: 10 
            }}>
              <FiUser size={16} /> My Profile
            </button>
            <button onClick={() => navigate("/account/orders")} style={{ 
              textAlign: "left", padding: "12px 16px", background: "transparent", 
              color: "var(--site-text)", border: "none", borderRadius: 10, 
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 
            }}>
              <FiPackage size={16} /> My Orders
            </button>
            <button onClick={logout} style={{ 
              textAlign: "left", padding: "12px 16px", background: "transparent", 
              color: "var(--site-red, #dc2626)", border: "none", borderRadius: 10, 
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 
            }}>
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          
          <section style={{ background: "var(--site-bg)", padding: 30, borderRadius: 12, border: "1px solid var(--site-border)" }}>
            <h2 style={{ marginBottom: 20 }}>Edit Profile</h2>
            <form onSubmit={handleSubmit(onUpdateProfile)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Full Name</label>
                <input {...register("fullName")} style={{ padding: 12, borderRadius: 8, border: "1px solid var(--site-border)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Mobile</label>
                <input {...register("mobile")} style={{ padding: 12, borderRadius: 8, border: "1px solid var(--site-border)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, gridColumn: "1/-1" }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Email Address</label>
                <input {...register("email")} disabled style={{ padding: 12, borderRadius: 8, border: "1px solid var(--site-border)", background: "var(--site-border)" }} />
              </div>
              <button type="submit" disabled={isSubmitting} className="site-btn-primary" style={{ width: "fit-content", gridColumn: "1/-1" }}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          <section style={{ background: "var(--site-bg)", padding: 30, borderRadius: 12, border: "1px solid var(--site-border)" }}>
            <h2 style={{ marginBottom: 20 }}>Order History</h2>
            {ordersLoading ? (
              <p>Loading orders...</p>
            ) : orders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {orders.map(order => (
                  <div key={order._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 15, border: "1px solid var(--site-border)", borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>Order #{order._id.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: "var(--site-text-muted)" }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 4, background: "var(--site-green-light)", color: "var(--site-green)", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{order.status}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>₹{order.totalAmount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: "center", border: "1px dashed var(--site-border)", borderRadius: 8 }}>
                <p style={{ color: "var(--site-text-muted)", marginBottom: 15 }}>You haven't placed any orders yet.</p>
                <button onClick={() => navigate("/products")} className="site-btn-secondary">Start Shopping</button>
              </div>
            )}
          </section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
