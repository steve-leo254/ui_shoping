import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./assets/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./assets/PrivateRoutes";
import Products from "./pages/Product";
import ProductCards from "./pages/ProductCards";
import ShoppingCart from "./pages/ShoppingCart";
import Checkout from "./pages/Checkout";
import OrderSummary from "./pages/Order-Summary";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetails from "./pages/OrderDetails";
import OrderTracking from "./pages/OrderTracking";
import OrdersOverview from "./pages/OrdersOverview";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/store" element={<ProductCards />} />
            <Route path="/shopping-cart" element={<ShoppingCart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-summary" element={<OrderSummary />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/order-details" element={<OrderDetails />} />
            <Route path="/orders-overview" element={<OrdersOverview />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
