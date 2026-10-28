import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DiscoverPage from './pages/DiscoverPage';
import AuctionsPage from './pages/AuctionsPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import SellPage from './pages/SellPage';
import MyBidsPage from './pages/MyBidsPage';
import MyListingsPage from './pages/MyListingsPage';
import SavedSearchesPage from './pages/SavedSearchesPage';
import NotificationsPage from './pages/NotificationsPage';
import AssistantPage from './pages/AssistantPage';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7F4'}}>
      <div className="spinner"/>
    </div>
  );
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace/> : <LoginPage/>}/>
      <Route element={<Layout/>}>
        <Route path="/" element={<DiscoverPage/>}/>
        <Route path="/auctions" element={<AuctionsPage/>}/>
        <Route path="/auctions/:id" element={<AuctionDetailPage/>}/>
        <Route path="/sell" element={<SellPage/>}/>
        <Route path="/my-bids" element={<MyBidsPage/>}/>
        <Route path="/my-listings" element={<MyListingsPage/>}/>
        <Route path="/saved-searches" element={<SavedSearchesPage/>}/>
        <Route path="/notifications" element={<NotificationsPage/>}/>
        <Route path="/assistant" element={<AssistantPage/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes/>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
