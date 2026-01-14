import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RFPCreate from './components/RFPCreate';
import VendorList from './components/VendorList';
import ComparisonView from './components/ComparisonView';
import './App.css';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
      {children}
    </Link>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">AI RFP Manager</span>
              </div>
              <div className="ml-8 flex space-x-4 items-center">
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/create-rfp">New RFP</NavLink>
                <NavLink to="/vendors">Vendors</NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-rfp" element={<RFPCreate />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/rfp/:id" element={<ComparisonView />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
