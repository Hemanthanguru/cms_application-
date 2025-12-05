import { Routes, Route } from "react-router-dom";
import VoyagerHome from "@/components/voyager/VoyagerHome";
import VoyagerItems from "@/components/voyager/VoyagerItems";
import VoyagerBookings from "@/components/voyager/VoyagerBookings";

const VoyagerDashboard = () => {
    return (
        <Routes>
            <Route index element={<VoyagerHome />} />
            <Route path="catering" element={<VoyagerItems category="catering" />} />
            <Route path="stationery" element={<VoyagerItems category="stationery" />} />
            <Route path="movies" element={<VoyagerBookings category="movie" />} />
            <Route path="salon" element={<VoyagerBookings category="salon" />} />
            <Route path="fitness" element={<VoyagerBookings category="fitness" />} />
            <Route path="party-hall" element={<VoyagerBookings category="party_hall" />} />
        </Routes>
    );
};

export default VoyagerDashboard;
