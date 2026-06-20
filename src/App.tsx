import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Rooms from "@/pages/Rooms";
import CalendarPage from "@/pages/CalendarPage";
import Bookings from "@/pages/Bookings";
import BookingDetail from "@/pages/BookingDetail";
import Frontdesk from "@/pages/Frontdesk";
import Rules from "@/pages/Rules";
import Services from "@/pages/Services";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/new" element={<Bookings initialOpen />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/frontdesk" element={<Frontdesk />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/services" element={<Services />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
