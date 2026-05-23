import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/protectedRote";
import PublicRoute from "./components/publicRoute";
import Navbar from "./components/navbar";
import Account from "./pages/Account";
import { useAppData } from "./context/AppContext";
import Restaurant from "./pages/Restaurant";
import RestaurantPage from "./pages/RestaurantPage";
import Cart from "./pages/Cart";
import AddAddressPage from "./pages/Address";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderPage from "./pages/OrderPage";
import RiderDashboard from "./pages/RiderDashboard";
import Admin from "./pages/Admin";
import LoginModal from "./components/LoginModal";
import Partner from "./pages/Partner";
import AdminLogin from "./pages/AdminLogin";
import Footer from "./components/Footer";

const App = () => {
  const { user, loading } = useAppData();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          className="spin"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(255,77,28,0.15)",
            borderTopColor: "#FF4D1C",
          }}
        />
        <p style={{ color: "#444", fontSize: 13 }}>Loading...</p>
      </div>
    );
  }

  if (user && user.role === "seller") return <Restaurant />;
  if (user && user.role === "rider") return <RiderDashboard />;
  if (user && user.role === "admin") return <Admin />;

  return (
    <BrowserRouter>
      <LoginModal />
      <Routes>
        {/* ── Fullscreen pages — NO navbar, NO modal ── */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Partner portal — fullscreen */}
        <Route path="/partner" element={<Partner />} />

        {/* Admin login — fullscreen, hidden portal */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ── All other pages — WITH navbar ── */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/restaurant/:id" element={<RestaurantPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/account" element={<Account />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/address" element={<AddAddressPage />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/order/:id" element={<OrderPage />} />
                  <Route
                    path="/paymentsuccess/:paymentId"
                    element={<PaymentSuccess />}
                  />
                  <Route path="/ordersuccess" element={<OrderSuccess />} />
                </Route>
              </Routes>
              <Footer />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
