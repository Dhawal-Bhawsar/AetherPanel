import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import MembersPage from './pages/MembersPage';
import ReferralsPage from './pages/ReferralsPage';
import MemberPortal from './pages/MemberPortal';
import SignUpPage from './pages/SignUpPage';
import SurveysPage from './pages/SurveysPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="surveys" element={<SurveysPage />} />
          <Route path="portal" element={<MemberPortal />} />
        </Route>
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
