import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Droplets, 
  Truck, 
  Database, 
  Factory, 
  Share2, 
  Store, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Package,
  Clock,
  AlertTriangle,
  History,
  Download,
  Leaf,
  Sun,
  Moon
} from 'lucide-react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate,
  useNavigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

// --- Theme Context ---
const ThemeContext = createContext<{ isDark: boolean; toggleTheme: () => void }>({
  isDark: true,
  toggleTheme: () => {},
});
const useTheme = () => useContext(ThemeContext);

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- Types ---

interface User {
  username: string;
  token: string;
}

// --- API Config ---
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-900/20',
      secondary: 'bg-slate-700 text-white hover:bg-slate-600',
      outline: 'border border-slate-700 text-slate-300 hover:bg-slate-800',
      ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return (
      <button
        ref={ref}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all ${className}`}
      {...props}
    />
  )
);

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm ${className}`} {...props}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, zIndex = 100 }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; zIndex?: number }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  message, 
  loading = false,
  error = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  message: string; 
  loading?: boolean;
  error?: string;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action" zIndex={110}>
    <div className="space-y-6">
      <p className="text-slate-300">{message}</p>
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : 'Confirm'}
        </Button>
      </div>
    </div>
  </Modal>
);

const DataPage = ({ 
  title, 
  description, 
  endpoint, 
  idField, 
  fields, 
  icon: Icon 
}: { 
  title: string; 
  description: string; 
  endpoint: string; 
  idField: string; 
  fields: { name: string; label: string; type: string; options?: string[] }[];
  icon: any;
}) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<any>(
    fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type === 'number' ? '' : (f.options ? f.options[0] : '') }), { signature: '' })
  );

  const userRole = localStorage.getItem('role');
  const roleMapping: Record<string, string> = {
    '/crude_purchase': 'CRUDE_MANAGER',
    '/transportation_log': 'TRANSPORT_MANAGER',
    '/storage_batch': 'STORAGE_MANAGER',
    '/refining_process': 'REFINING_MANAGER',
    '/distribution': 'DISTRIBUTION_MANAGER',
    '/retail': 'RETAIL_MANAGER'
  };

  const canEdit = userRole === 'ADMIN' || userRole === roleMapping[endpoint];

  const fetchData = async () => {
    try {
      const res = await api.get(endpoint);
      setData(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  useEffect(() => {
    const filtered = data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchQuery, data]);

  const handleExport = () => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/ /g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmissionError('');
    try {
      // Ensure number fields are sent as numbers
      const submissionData = { ...formData };
      fields.forEach(f => {
        if (f.type === 'number' && submissionData[f.name] !== '') {
          submissionData[f.name] = Number(submissionData[f.name]);
        }
      });

      await api.post(endpoint, submissionData);
      setShowConfirm(false);
      setShowModal(false);
      setFormData(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type === 'number' ? '' : (f.options ? f.options[0] : '') }), { signature: '' }));
      fetchData();
    } catch (err: any) {
      console.error('Submission error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to add record. Please check your data and try again.';
      setSubmissionError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icon className="w-8 h-8 text-teal-400" />
            {title}
          </h2>
          <p className="text-slate-400">{description}</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5" />
            <span>Add New Record</span>
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/30">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              className="pl-10 py-1.5 text-sm" 
              placeholder="Search records..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="py-1.5 text-sm" onClick={() => setSearchQuery('')}>
              <Filter className="w-4 h-4" />
              Clear
            </Button>
            <Button variant="outline" className="py-1.5 text-sm" onClick={handleExport}>Export CSV</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                {fields.map(f => (
                  <th key={f.name} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{f.label}</th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={fields.length + 1} className="px-6 py-12 text-center text-slate-500">Loading records...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={fields.length + 1} className="px-6 py-12 text-center text-slate-500">No records found.</td></tr>
              ) : filteredData.map((row, idx) => (
                <tr key={row[idField] || idx} className="hover:bg-slate-800/30 transition-colors group">
                  {fields.map(f => (
                    <td key={f.name} className={`px-6 py-4 text-sm ${f.name === idField ? 'font-bold text-teal-400' : 'text-slate-300'}`}>
                      {row[f.name]}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`New ${title}`}>
        <form onSubmit={(e) => { e.preventDefault(); setShowConfirm(true); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.name} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{f.label}</label>
                {f.options ? (
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-teal-500/50"
                    value={formData[f.name]}
                    onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                  >
                    {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <Input 
                    type={f.type}
                    placeholder={f.label}
                    value={formData[f.name]}
                    onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                    required
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="space-y-1 bg-teal-500/5 p-3 rounded-lg border border-teal-500/20">
            <label className="text-xs font-bold text-teal-400 uppercase flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Digital Signature
            </label>
            <Input 
              placeholder="Enter cryptographic signature" 
              value={formData.signature}
              onChange={e => setFormData({...formData, signature: e.target.value})}
              required
              className="bg-slate-950 border-teal-500/30 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Submit Transaction</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog 
        isOpen={showConfirm} 
        onClose={() => { setShowConfirm(false); setSubmissionError(''); }} 
        onConfirm={handleSubmit}
        loading={submitting}
        error={submissionError}
        message="Are you sure you want to submit this transaction? This will create an immutable record in the ledger."
      />
    </div>
  );
};

// --- Layout ---

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop, ensure sidebar is "open" (visible)
      if (!mobile) {
        setIsOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsOpen]);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Crude Purchase', path: '/crude', icon: Droplets },
    { name: 'Transportation', path: '/transport', icon: Truck },
    { name: 'Storage', path: '/storage', icon: Database },
    { name: 'Refining', path: '/refining', icon: Factory },
    { name: 'Distribution', path: '/distribution', icon: Share2 },
    { name: 'Retail', path: '/retail', icon: Store },
    { name: 'CO2 Emissions', path: '/emissions', icon: Leaf },
    { name: 'Provenance', path: '/provenance', icon: History },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          x: isMobile ? (isOpen ? 0 : -300) : 0,
          opacity: 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 shadow-2xl lg:shadow-none`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">PCI</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Integrity System</p>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-teal-600/10 text-teal-400 border border-teal-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'group-hover:text-slate-200'}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </motion.aside>
    </>
  );
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const username = localStorage.getItem('username');
  const { isDark, toggleTheme } = useTheme();
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-400 hover:text-white">
        <Menu className="w-6 h-6" />
      </button>
      
      <div className="hidden lg:flex items-center gap-2 text-slate-400 text-sm">
        <span className="font-medium text-slate-300">Petroleum Chain Integrity</span>
        <ChevronRight className="w-4 h-4" />
        <span className="capitalize">{useLocation().pathname.replace('/', '') || 'Dashboard'}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.9 }}
          className="relative w-16 h-8 rounded-full border border-slate-700 flex items-center px-1 transition-colors duration-300"
          style={{ background: isDark ? '#1e293b' : '#e0f2fe' }}
          title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          <motion.div
            className="w-6 h-6 rounded-full flex items-center justify-center shadow-md"
            animate={{ x: isDark ? 0 : 32 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ background: isDark ? '#334155' : '#0ea5e9' }}
          >
            {isDark
              ? <Moon className="w-3.5 h-3.5 text-slate-300" />
              : <Sun  className="w-3.5 h-3.5 text-white" />
            }
          </motion.div>
        </motion.button>

        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{username}</p>
          <p className="text-xs text-slate-500">{localStorage.getItem('role')?.replace('_', ' ') || 'User'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-900/20">
          {username?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
};

// --- Role-Aware Batch Pipeline Tracker ---

const PIPELINE_STAGES = [
  { label: 'Crude Purchase', short: 'Crude',    icon: Droplets, color: '#22d3ee', role: 'CRUDE_MANAGER'        },
  { label: 'Transport',      short: 'Transit',  icon: Truck,    color: '#fbbf24', role: 'TRANSPORT_MANAGER'    },
  { label: 'Storage',        short: 'Storage',  icon: Database, color: '#34d399', role: 'STORAGE_MANAGER'      },
  { label: 'Refining',       short: 'Refining', icon: Factory,  color: '#a78bfa', role: 'REFINING_MANAGER'     },
  { label: 'Distribution',   short: 'Distrib.', icon: Share2,   color: '#f472b6', role: 'DISTRIBUTION_MANAGER' },
  { label: 'Retail',         short: 'Retail',   icon: Store,    color: '#fb923c', role: 'RETAIL_MANAGER'       },
];

// Each role sees all stages UP TO (and including) their own stage
const ROLE_VISIBLE: Record<string, number[]> = {
  CRUDE_MANAGER:        [0],
  TRANSPORT_MANAGER:    [0, 1],
  STORAGE_MANAGER:      [0, 1, 2],
  REFINING_MANAGER:     [0, 1, 2, 3],
  DISTRIBUTION_MANAGER: [0, 1, 2, 3, 4],
  RETAIL_MANAGER:       [0, 1, 2, 3, 4, 5],
  ENVIRONMENT_MANAGER:  [0, 1, 2, 3, 4, 5],
  ADMIN:                [0, 1, 2, 3, 4, 5],
};

// Demo batches removed; using real database state
const BatchProgressTracker = () => {
  const userRole      = localStorage.getItem('role') || 'ADMIN';
  const visibleIdx    = ROLE_VISIBLE[userRole] ?? [0, 1, 2, 3, 4, 5];
  const isAdmin       = userRole === 'ADMIN' || userRole === 'ENVIRONMENT_MANAGER';
  const myStageIdx    = visibleIdx[0]; // primary stage for single-role users

  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [activeBatches, setActiveBatches] = useState<Record<string, number>>({});
  const [markerStage,   setMarkerStage]   = useState<number | null>(null);
  const [animating,     setAnimating]     = useState(false);
  const [customId,      setCustomId]      = useState('');
  const [hoveredStage,  setHoveredStage]  = useState<number | null>(null);
  const [mounted,       setMounted]       = useState(false);
  const [chainData,     setChainData]     = useState<any>(null);
  const [clickedStage,  setClickedStage]  = useState<number | null>(null);
  const [chainLoading,  setChainLoading]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Pull real Pipeline Status
  useEffect(() => {
    api.get('/pipeline_status').then(res => {
      const dbBatches: Record<string, number> = {};
      res.data.forEach((row: any) => {
        dbBatches[row.id] = row.stage;
      });
      setActiveBatches(dbBatches);
    }).catch(() => {});
  }, []);

  const selectBatch = (id: string) => {
    if (!id || animating) return;
    setSelectedBatch(id);
    setAnimating(true);
    setMarkerStage(null);
    setChainData(null);
    setClickedStage(null);

    // Fetch Full Chain Data
    setChainLoading(true);
    api.get(`/batch_chain/${id}`).then(res => {
      setChainData(res.data);
    }).finally(() => {
      setChainLoading(false);
    });

    const target = activeBatches[id] ?? 0;
    let step = 0;
    const timer = setInterval(() => {
      setMarkerStage(step);
      if (step >= target) { clearInterval(timer); setAnimating(false); }
      step++;
    }, 380);
  };

  const addCustomBatch = () => {
    if (!customId.trim()) return;
    const stage = isAdmin ? Math.floor(Math.random() * 6) : myStageIdx;
    setActiveBatches(prev => ({ ...prev, [customId.trim()]: stage }));
    setCustomId('');
  };

  // Only show batches that are at a visible stage for this role
  const visibleBatches = Object.entries(activeBatches).filter(([, s]) =>
    isAdmin || visibleIdx.includes(s)
  );

  // Pipeline card layout (horizontal cards connected by arrows)
  const myStage = PIPELINE_STAGES[myStageIdx];

  return (
    <Card className="p-6 overflow-hidden relative">
      {/* Animated background gradient shimmer */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${myStage.color}55 0%, transparent 70%)`,
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Supply Chain Pipeline Tracker
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Full pipeline visibility — all 6 stages'
              : `Showing your stage: `
            }
            {!isAdmin && (
              <span className="font-bold" style={{ color: myStage.color }}>{myStage.label}</span>
            )}
          </p>
        </div>

        {/* Role badge */}
        <div
          className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
          style={{ borderColor: myStage.color + '55', background: myStage.color + '15', color: myStage.color }}
        >
          <myStage.icon className="w-3.5 h-3.5" />
          {userRole.replace('_', ' ')}
        </div>
      </div>

      {/* Pipeline Nodes */}
      <div className="relative flex items-center justify-between gap-0 mb-6 overflow-x-auto pb-2">
        {PIPELINE_STAGES.map((stage, i) => {
          const isVisible   = visibleIdx.includes(i);
          const isOwn       = i === myStageIdx && !isAdmin;
          const isActive    = markerStage !== null && i <= markerStage;
          const isCurrent   = markerStage === i;
          const isHovered   = hoveredStage === i;
          const isLocked    = !isVisible;

          return (
            <React.Fragment key={i}>
              {/* Node */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                onMouseEnter={() => setHoveredStage(i)}
                onMouseLeave={() => setHoveredStage(null)}
                className="relative flex flex-col items-center shrink-0"
                style={{ minWidth: 72 }}
              >
                {/* "YOUR STAGE" badge */}
                {isOwn && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-7 text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: stage.color, color: '#0f172a' }}
                  >
                    YOUR STAGE
                  </motion.div>
                )}

                {/* Pulse ring for current batch position */}
                {isCurrent && (
                  <div
                    className="absolute rounded-full animate-ping"
                    style={{
                      width: 56, height: 56,
                      border: `2px solid ${stage.color}`,
                      opacity: 0.5,
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      marginTop: -4,
                    }}
                  />
                )}

                {/* Circle */}
                <motion.div
                  animate={isOwn && !isCurrent ? {
                    boxShadow: [`0 0 0px ${stage.color}00`, `0 0 18px ${stage.color}88`, `0 0 0px ${stage.color}00`],
                  } : {}}
                  onClick={() => {
                     // Allow clicking stages that the batch has reached
                     if (markerStage !== null && i <= markerStage && !isLocked) {
                       setClickedStage(clickedStage === i ? null : i);
                     }
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isLocked || (markerStage !== null && i > markerStage) ? 'cursor-not-allowed' : 'cursor-pointer hover:ring-4'}`}
                  style={{
                    background: clickedStage === i
                      ? stage.color + '44'
                      : isLocked
                        ? '#0f172a'
                        : isActive
                          ? stage.color + '25'
                          : isOwn
                            ? stage.color + '18'
                            : '#1e293b',
                    borderColor: isLocked
                      ? '#1e293b'
                      : isActive || clickedStage === i
                        ? stage.color
                        : isOwn
                          ? stage.color + 'aa'
                          : '#334155',
                    filter: isLocked ? 'grayscale(1) opacity(0.3)' : 'none',
                    transform: isHovered && !isLocked ? 'scale(1.12)' : clickedStage === i ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: clickedStage === i ? `0 0 20px ${stage.color}aa` : 'none'
                  }}
                >
                  {isLocked ? (
                    // Lock icon for inaccessible stages
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <stage.icon
                      className="w-5 h-5 transition-all duration-300"
                      style={{ color: isActive ? stage.color : isOwn ? stage.color + 'cc' : '#475569' }}
                    />
                  )}

                  {/* Gold marker dot */}
                  {isCurrent && (
                    <div
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900"
                      style={{ background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <p
                  className="mt-2 text-center text-[10px] font-semibold leading-tight transition-colors duration-300"
                  style={{
                    color: isLocked ? '#1e293b' : isActive || isOwn ? stage.color : '#475569',
                    maxWidth: 64,
                  }}
                >
                  {stage.label}
                </p>

                {/* Tooltip on hover (non-locked) */}
                {isHovered && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-16 z-20 text-[10px] rounded-lg px-3 py-2 whitespace-nowrap border shadow-xl"
                    style={{
                      background: '#0f172a',
                      borderColor: stage.color + '55',
                      color: stage.color,
                    }}
                  >
                    {isOwn ? '✦ Your assigned stage' : `Stage ${i + 1} of pipeline`}
                    {isCurrent && <span className="ml-1 font-bold">(batch here)</span>}
                  </motion.div>
                )}
              </motion.div>

              {/* Connector arrow between nodes */}
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="flex-1 flex items-center justify-center" style={{ minWidth: 16 }}>
                  <div className="relative w-full h-1 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                    {/* Animated flow if batch passed this link */}
                    {markerStage !== null && i < markerStage && (
                      <motion.div
                        className="absolute top-0 left-0 h-full rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg, ${PIPELINE_STAGES[i].color}, ${PIPELINE_STAGES[i+1].color})` }}
                      />
                    )}
                    {/* Travelling oil-drop particle */}
                    {markerStage !== null && i < markerStage && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{
                          background: '#fbbf24',
                          boxShadow: '0 0 6px #fbbf24',
                          animation: `travelDot 1.8s linear infinite`,
                          left: 0,
                        }}
                      />
                    )}
                  </div>
                  {/* chevron */}
                  <ChevronRight
                    className="w-3 h-3 shrink-0"
                    style={{
                      color: markerStage !== null && i < markerStage
                        ? PIPELINE_STAGES[i + 1].color
                        : '#334155',
                      transition: 'color 0.4s',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Inline keyframe for travelling dot */}
      <style>{`
        @keyframes travelDot {
          0%   { left: 0%;   opacity: 1; }
          80%  { left: 90%;  opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}</style>

      {/* Batch selector & add */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase">
            {isAdmin ? 'Track Any Batch' : `Track Batches at Your Stage`}
          </label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:border-amber-500 transition-all text-sm"
            style={{ '--tw-ring-color': myStage.color } as any}
            value={selectedBatch}
            onChange={e => selectBatch(e.target.value)}
            disabled={animating}
          >
            <option value="">— Choose a batch ID —</option>
            {visibleBatches.map(([id, s]) => (
              <option key={id} value={id}>
                {id}  ·  {PIPELINE_STAGES[s].label}  (Stage {s + 1})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 w-full sm:w-64">
          <Input
            placeholder="New batch ID…"
            value={customId}
            onChange={e => setCustomId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomBatch()}
            className="text-sm py-2"
          />
          <Button variant="outline" onClick={addCustomBatch} className="shrink-0 border-slate-700 hover:border-teal-500">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected batch info strip */}
      {selectedBatch && markerStage !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{
            borderColor: PIPELINE_STAGES[markerStage].color + '44',
            background: PIPELINE_STAGES[markerStage].color + '0d',
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#fbbf24' }} />
          <span className="text-sm text-slate-300">
            Batch <span className="font-bold text-white">{selectedBatch}</span> is currently at{' '}
            <span className="font-bold" style={{ color: PIPELINE_STAGES[markerStage].color }}>
              {PIPELINE_STAGES[markerStage].label}
            </span>
            {animating && <span className="text-slate-500 ml-2 text-xs">tracking…</span>}
          </span>
          {!animating && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fbbf2422', color: '#fbbf24' }}>
              Stage {markerStage + 1} / 6
            </span>
          )}
        </motion.div>
      )}

      {/* Stage Detail Panel */}
      {selectedBatch && !animating && clickedStage !== null && chainData && (
        <motion.div
           key={clickedStage}
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: 'auto' }}
           className="mt-6 border rounded-xl overflow-hidden shadow-2xl backdrop-blur-md"
           style={{ 
             borderColor: PIPELINE_STAGES[clickedStage].color + '55', 
             background: 'linear-gradient(to bottom, #0f172aee, #020617ff)' 
           }}
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: PIPELINE_STAGES[clickedStage].color + '33', background: PIPELINE_STAGES[clickedStage].color + '11' }}>
             <div className="flex items-center gap-3">
               {React.createElement(PIPELINE_STAGES[clickedStage].icon, { className: "w-6 h-6", style: { color: PIPELINE_STAGES[clickedStage].color } })}
               <h4 className="font-bold text-lg text-white">{PIPELINE_STAGES[clickedStage].label} Data & Environmental Impact</h4>
             </div>
             <button onClick={() => setClickedStage(null)} className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded hover:bg-slate-700">
               <X className="w-4 h-4" />
             </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Stage Properties */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4" /> Operational Data
              </h5>
              <div className="grid grid-cols-2 gap-3">
                 {chainData.stages[clickedStage] ? (
                   Object.entries(chainData.stages[clickedStage]).map(([key, value]: [string, any]) => (
                     <div key={key} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                       <span className="block text-[9px] text-slate-500 uppercase font-black tracking-widest">{key.replace(/_/g, ' ')}</span>
                       <span className="block text-sm text-slate-200 mt-1 font-medium">{String(value)}</span>
                     </div>
                   ))
                 ) : (
                   <p className="text-slate-500 text-sm italic col-span-2">No operational data recorded for this module yet.</p>
                 )}
              </div>
            </div>

            {/* Right: LCA Environmental Impact & Analytics */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: PIPELINE_STAGES[clickedStage].color }}>
                <span className="flex items-center gap-2"><Leaf className="w-4 h-4" /> Environmental AI Analytics</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">Batch {selectedBatch}</span>
              </h5>
              
              {(() => {
                 const stageIdStr = chainData.stageIds[clickedStage];
                 const stageEmissions = chainData.emissions.filter((e: any) => String(e.Reference_ID) === String(stageIdStr));

                 // Procedural Calculation Fallbacks
                 const baseVol = Number(chainData.stages[0]?.Volume) || 50000;
                 const multipliers = [
                   { e: 0.5, w: 2.1, co2: 0.14 },   // Crude
                   { e: 1.2, w: 0.2, co2: 0.31 },   // Transport
                   { e: 0.2, w: 0.05, co2: 0.05 },  // Storage
                   { e: 5.8, w: 12.4, co2: 1.85 },  // Refining
                   { e: 1.0, w: 0.1, co2: 0.22 },   // Distribution
                   { e: 0.8, w: 0.3, co2: 0.18 }    // Retail
                 ];
                 
                 // If no DB emissions natively, derive it procedurally for analytics
                 let stageCO2 = stageEmissions.reduce((s:number, e:any) => s + Number(e.Emission_Amount), 0);
                 const isSimulated = stageCO2 === 0;
                 if (isSimulated) {
                    stageCO2 = Math.round(baseVol * multipliers[clickedStage].co2);
                 }

                 // Cumulative Calculation
                 let cumulativeCO2 = 0;
                 for (let s = 0; s <= clickedStage; s++) {
                   const sId = chainData.stageIds[s];
                   const eList = chainData.emissions.filter((e:any) => String(e.Reference_ID) === String(sId));
                   let sSum = eList.reduce((sum:number, e:any) => sum + Number(e.Emission_Amount), 0);
                   if (sSum === 0) sSum = baseVol * multipliers[s].co2;
                   cumulativeCO2 += sSum;
                 }
                 cumulativeCO2 = Math.round(cumulativeCO2);

                 const energyMJ = Math.round(baseVol * multipliers[clickedStage].e);
                 const waterL = Math.round(baseVol * multipliers[clickedStage].w);

                 // Badges
                 let impactTier = 'Low';
                 let tierColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
                 if (cumulativeCO2 > 50000) { impactTier = 'High'; tierColor = 'text-red-400 bg-red-400/10 border-red-500/30'; }
                 else if (cumulativeCO2 > 20000) { impactTier = 'Moderate'; tierColor = 'text-amber-400 bg-amber-400/10 border-amber-500/30'; }

                 // Sparkline data points (0 to clickedStage)
                 const sparkPoints = [];
                 let runningSum = 0;
                 for (let s = 0; s <= clickedStage; s++) {
                   let sSum = chainData.emissions.filter((e:any) => String(e.Reference_ID) === String(chainData.stageIds[s])).reduce((sum:number, e:any) => sum + Number(e.Emission_Amount), 0);
                   if (sSum === 0) sSum = baseVol * multipliers[s].co2;
                   runningSum += sSum;
                   sparkPoints.push(runningSum);
                 }
                 const maxSpark = Math.max(...sparkPoints, 1);
                 const sparklinePath = sparkPoints.map((val, idx) => {
                   const x = (idx / Math.max(sparkPoints.length - 1, 1)) * 100;
                   const y = 100 - ((val / maxSpark) * 100);
                   return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                 }).join(' ');

                 return (
                   <div className="space-y-4">
                     {/* 1. Overview Section */}
                     <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 relative overflow-hidden group hover:border-slate-600 transition-all">
                       <div className="absolute right-0 top-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: PIPELINE_STAGES[clickedStage].color }} />
                       <div className="flex justify-between items-start relative z-10">
                         <div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Cumulative Impact</p>
                           <div className="flex items-baseline gap-2">
                             <span className="text-3xl font-black text-white tracking-tight">{cumulativeCO2.toLocaleString()}</span>
                             <span className="text-xs font-bold text-slate-500">kg CO₂e</span>
                           </div>
                         </div>
                         <div className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${tierColor}`}>
                           {impactTier} Impact
                         </div>
                       </div>
                       
                       {/* Sparkline Visual Component */}
                       <div className="mt-4 h-12 w-full relative z-10 overflow-hidden rounded-bl-xl rounded-br-xl -mx-4 -mb-4 px-4 pb-2 pt-2" style={{ background: PIPELINE_STAGES[clickedStage].color + '0a' }}>
                         <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                           <path d={sparklinePath} fill="none" stroke={PIPELINE_STAGES[clickedStage].color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                           <path d={`${sparklinePath} L 100 100 L 0 100 Z`} fill={`url(#gradient-${clickedStage})`} opacity="0.3" />
                           <defs>
                             <linearGradient id={`gradient-${clickedStage}`} x1="0" x2="0" y1="0" y2="1">
                               <stop offset="0%" stopColor={PIPELINE_STAGES[clickedStage].color} />
                               <stop offset="100%" stopColor="transparent" />
                             </linearGradient>
                           </defs>
                         </svg>
                       </div>
                     </div>

                     {/* 2. Key Metrics (Per Stage) */}
                     <div className="grid grid-cols-2 gap-3">
                       {/* Carbon Emissions */}
                       <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 shadow-inner group/metric hover:bg-slate-800/60 transition-colors">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1"><Activity className="w-3 h-3"/> footprint {isSimulated && <span className="text-blue-400/80">(EST)</span>}</span>
                         </div>
                         <div className="text-lg font-bold text-slate-200 group-hover/metric:text-white transition-colors">{stageCO2.toLocaleString()} <span className="text-[10px] text-slate-500 font-medium tracking-normal">kg</span></div>
                       </div>

                       {/* Energy */}
                       <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 shadow-inner group/metric hover:border-amber-500/30 transition-colors">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1"><Sun className="w-3 h-3 text-amber-500/70"/> energy</span>
                         </div>
                         <div className="text-lg font-bold text-amber-400/90 group-hover/metric:text-amber-400">{energyMJ.toLocaleString()} <span className="text-[10px] text-amber-500/50 font-medium tracking-normal">MJ</span></div>
                       </div>

                       {/* Water */}
                       <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 shadow-inner group/metric hover:border-blue-500/30 transition-colors">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-500/70"/> water draw</span>
                         </div>
                         <div className="text-lg font-bold text-blue-400/90 group-hover/metric:text-blue-400">{waterL.toLocaleString()} <span className="text-[10px] text-blue-500/50 font-medium tracking-normal">Liters</span></div>
                       </div>

                       {/* Waste / Fugitive Loss */}
                       <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 shadow-inner group/metric hover:border-rose-500/30 transition-colors">
                         <div className="flex justify-between items-center mb-1">
                           <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-500/70"/> waste / loss</span>
                         </div>
                         <div className="text-lg font-bold text-rose-400/90 group-hover/metric:text-rose-400">{(stageCO2 * 0.05).toFixed(1)} <span className="text-[10px] text-rose-500/50 font-medium tracking-normal">kg CO₂</span></div>
                       </div>
                     </div>
                   </div>
                 );
              })()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend — only show accessible stages */}
      <div className="mt-4 flex flex-wrap gap-3">
        {PIPELINE_STAGES.map((s, i) => {
          const visible = visibleIdx.includes(i);
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: visible ? s.color : '#1e293b' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: visible ? s.color : '#1e293b' }} />
              <span>{s.label}</span>
              {!visible && <span className="text-[9px] text-slate-700">🔒</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// --- Pages ---

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CRUDE_MANAGER');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const roles = [
    { value: 'CRUDE_MANAGER', label: 'Crude Manager' },
    { value: 'TRANSPORT_MANAGER', label: 'Transport Manager' },
    { value: 'STORAGE_MANAGER', label: 'Storage Manager' },
    { value: 'REFINING_MANAGER', label: 'Refining Manager' },
    { value: 'DISTRIBUTION_MANAGER', label: 'Distribution Manager' },
    { value: 'RETAIL_MANAGER', label: 'Retail Manager' },
    { value: 'ENVIRONMENT_MANAGER', label: 'Environment Manager' },
    { value: 'ADMIN', label: 'Administrator' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const res = await api.post(endpoint, { username, password, role });
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('role', res.data.role);
        navigate('/');
      } else {
        setIsLogin(true);
        alert('Registration successful! Please login.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Authentication failed';
      const details = err.response?.data?.details ? ` (${err.response.data.details})` : '';
      setError(`${errorMessage}${details}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-teal-900/40">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Petroleum Chain</h1>
          <p className="text-slate-400">Secure Supply Chain Management System</p>
        </div>

        <Card className="p-8 border-slate-800 bg-slate-900/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <Input 
                type="text" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Role</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-teal-500/50"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            )}

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full py-3">
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<any>({ counts: {}, growth: {}, inventory: [] });
  const [alerts, setAlerts] = useState<any>({ stockAlerts: [], storageAlerts: [] });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'real-time' | 'historical'>('real-time');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, alertsRes] = await Promise.all([
          api.get('/stats'),
          api.get('/alerts')
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { title: 'Crude Purchases', count: stats.counts?.Crude_Purchase || 0, growth: stats.growth?.Crude_Purchase || 0, icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-400/10', path: '/crude' },
    { title: 'In Transit', count: stats.counts?.Transportation_Log || 0, growth: stats.growth?.Transportation_Log || 0, icon: Truck, color: 'text-amber-400', bg: 'bg-amber-400/10', path: '/transport' },
    { title: 'Storage Batches', count: stats.counts?.Storage_Batch || 0, growth: stats.growth?.Storage_Batch || 0, icon: Database, color: 'text-teal-400', bg: 'bg-teal-400/10', path: '/storage' },
    { title: 'Refining Processes', count: stats.counts?.Refining_Process || 0, growth: stats.growth?.Refining_Process || 0, icon: Factory, color: 'text-purple-400', bg: 'bg-purple-400/10', path: '/refining' },
    { title: 'Distribution', count: stats.counts?.Distribution || 0, growth: stats.growth?.Distribution || 0, icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', path: '/distribution' },
    { title: 'Retail Points', count: stats.counts?.Retail || 0, growth: stats.growth?.Retail || 0, icon: Store, color: 'text-pink-400', bg: 'bg-pink-400/10', path: '/retail' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">System Overview</h2>
          <p className="text-slate-400">Real-time status of the petroleum supply chain</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          <button 
            onClick={() => setViewMode('real-time')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-all ${viewMode === 'real-time' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Real-time
          </button>
          <button 
            onClick={() => setViewMode('historical')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'historical' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Historical
          </button>
        </div>
      </div>

      {(alerts.stockAlerts.length > 0 || alerts.storageAlerts.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-amber-500 font-bold text-sm">System Notifications</h4>
            <p className="text-amber-500/70 text-xs">
              Maintenance and operational alerts will appear here.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 group hover:border-teal-500/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.growth >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                  {card.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{card.growth >= 0 ? '+' : ''}{card.growth}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">{card.title}</p>
                <h3 className="text-3xl font-bold text-white">
                  {loading ? '...' : (viewMode === 'historical' ? Math.round(card.count * 0.8) : card.count)}
                </h3>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Activity className="w-3 h-3" />
                  <span>Active node</span>
                </div>
                <Link to={card.path}>
                  <Button variant="ghost" className="text-xs py-1 px-2 h-auto">
                    Manage <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Inventory Status
            </h3>
            <span className="text-xs text-slate-500">Updated 5m ago</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {loading ? (
              <p className="text-slate-500 text-center py-8 col-span-2">Loading inventory...</p>
            ) : (
              (stats.inventory || []).map((item: any) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <span className="text-white font-bold">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Batch Progress Tracker — JavaFX pipeline animation (React/SVG port) */}
      <BatchProgressTracker />

    </div>
  );
};

const CrudePurchasePage = () => (
  <DataPage 
    title="Crude Purchase"
    description="Track and verify incoming crude oil shipments"
    endpoint="/crude_purchase"
    idField="Purchase_ID"
    icon={Droplets}
    fields={[
      { name: 'Purchase_ID', label: 'Purchase ID', type: 'text' },
      { name: 'Volume', label: 'Volume (BBL)', type: 'number' },
      { name: 'Price', label: 'Price ($)', type: 'number' },
      { name: 'Grade', label: 'Grade', type: 'select', options: ['A', 'B', 'C'] },
      { name: 'Purchased_Date', label: 'Date', type: 'date' },
    ]}
  />
);

const TransportationPage = () => (
  <DataPage 
    title="Transportation Log"
    description="Track vehicle movements and route types"
    endpoint="/transportation_log"
    idField="Transit_ID"
    icon={Truck}
    fields={[
      { name: 'Transit_ID', label: 'Transit ID', type: 'text' },
      { name: 'Vehicle_ID', label: 'Vehicle ID', type: 'text' },
      { name: 'Driver_ID', label: 'Driver ID', type: 'text' },
      { name: 'Quantity', label: 'Quantity', type: 'number' },
      { name: 'Route_Type', label: 'Route Type', type: 'select', options: ['Ship', 'Rail', 'Road'] },
      { name: 'Departure_Time', label: 'Departure', type: 'datetime-local' },
      { name: 'Arrival_Time', label: 'Arrival', type: 'datetime-local' },
      { name: 'Fuel_Quality', label: 'Quality', type: 'text' },
      { name: 'Purchase_ID', label: 'Purchase ID', type: 'text' },
    ]}
  />
);

const StoragePage = () => (
  <DataPage 
    title="Storage Batches"
    description="Manage crude oil inventory and tank capacities"
    endpoint="/storage_batch"
    idField="Batch_ID"
    icon={Database}
    fields={[
      { name: 'Batch_ID', label: 'Batch ID', type: 'text' },
      { name: 'Tank_Number', label: 'Tank No.', type: 'number' },
      { name: 'Current_Capacity', label: 'Current Capacity', type: 'number' },
      { name: 'Last_Inspection_Date', label: 'Last Insp.', type: 'date' },
      { name: 'Transit_ID', label: 'Transit ID', type: 'text' },
    ]}
  />
);

const RefiningPage = () => (
  <DataPage 
    title="Refining Processes"
    description="Monitor crude-to-petrol conversion metrics"
    endpoint="/refining_process"
    idField="Refine_ID"
    icon={Factory}
    fields={[
      { name: 'Refine_ID', label: 'Refine ID', type: 'text' },
      { name: 'Input_Volume', label: 'Input Vol', type: 'number' },
      { name: 'Output_Volume', label: 'Output Vol', type: 'number' },
      { name: 'Refining_Date', label: 'Date', type: 'date' },
      { name: 'Additive_Chemical_Fingerprint', label: 'Additive Chemical Fingerprint', type: 'text' },
      { name: 'Batch_ID', label: 'Batch ID', type: 'text' },
    ]}
  />
);

const DistributionPage = () => (
  <DataPage 
    title="Distribution"
    description="Manage dispatch volumes and quality metrics"
    endpoint="/distribution"
    idField="Distribution_ID"
    icon={Share2}
    fields={[
      { name: 'Distribution_ID', label: 'Dist. ID', type: 'text' },
      { name: 'Dispatch_Volume', label: 'Dispatch Vol', type: 'number' },
      { name: 'Delivery_Status', label: 'Status', type: 'select', options: ['P(Pending)', 'D(Departed)', 'T(Transit)', 'C(Completed)'] },
      { name: 'Adulteration_Test_Result', label: 'Test Result', type: 'text' },
      { name: 'Final_Consumer_Hash', label: 'Consumer Hash', type: 'text' },
      { name: 'Refine_ID', label: 'Refine ID', type: 'text' },
    ]}
  />
);

const RetailPage = () => (
  <DataPage 
    title="Retail Management"
    description="Monitor station inventory and delivery status"
    endpoint="/retail"
    idField="Retail_ID"
    icon={Store}
    fields={[
      { name: 'Retail_ID', label: 'Retail ID', type: 'text' },
      { name: 'Station_ID', label: 'Station ID', type: 'text' },
      { name: 'Receive_Volume', label: 'Receive Vol', type: 'number' },
      { name: 'Storage_Tank_Condition', label: 'Tank Cond.', type: 'select', options: ['1(Poor)', '2(Fair)', '3(Good)', '4(Very Good)', '5(Excellent)'] },
      { name: 'Distribution_ID', label: 'Dist. ID', type: 'text' },
    ]}
  />
);

const EmissionsPage = () => (
  <DataPage 
    title="CO2 Emissions"
    description="Track and monitor environmental impact across the supply chain"
    endpoint="/co2_emissions"
    idField="Emission_ID"
    icon={Leaf}
    fields={[
      { name: 'Emission_ID', label: 'Emission ID', type: 'text' },
      { name: 'Source_Type', label: 'Source Type', type: 'select', options: ['Transportation', 'Refining', 'Storage', 'Retail'] },
      { name: 'Emission_Amount', label: 'Amount (kg CO2)', type: 'number' },
      { name: 'Measurement_Date', label: 'Date', type: 'date' },
      { name: 'Location', label: 'Location', type: 'text' },
      { name: 'Reference_ID', label: 'Reference ID', type: 'text' },
    ]}
  />
);

const ProvenancePage = () => {
  const [retailId, setRetailId] = useState('');
  const [provenance, setProvenance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProvenance = async () => {
    if (!retailId) return;
    setLoading(true);
    setError(null);
    setProvenance(null);
    try {
      const res = await api.get(`/provenance/retail/${retailId}`);
      if (!res.data || Object.keys(res.data).length === 0) {
        setError('Record not found');
      } else {
        setProvenance(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Record not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Recursive Provenance</h2>
        <p className="text-slate-400">Trace the complete journey of a retail fuel batch back to its crude source</p>
      </div>

      <div className="flex gap-4">
        <Input 
          placeholder="Enter Retail ID (e.g., RET-001)" 
          value={retailId}
          onChange={(e) => setRetailId(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={fetchProvenance} disabled={loading}>
          {loading ? 'Tracing...' : 'Trace Journey'}
        </Button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {provenance && (
        <div className="relative space-y-12 before:absolute before:left-8 before:top-8 before:bottom-8 before:w-0.5 before:bg-slate-800">
          {[
            { title: 'Retail Station', data: provenance.retail, icon: Store },
            { title: 'Distribution Network', data: provenance.distribution, icon: Share2 },
            { title: 'Refinery Process', data: provenance.refining, icon: Factory },
            { title: 'Storage Batch', data: provenance.storage, icon: Database },
            { title: 'Transportation', data: provenance.transport, icon: Truck },
            { title: 'Crude Source', data: provenance.crude, icon: Droplets },
          ].map((step, idx) => step.data && (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-20"
            >
              <div className="absolute left-4 top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-teal-500 flex items-center justify-center z-10">
                <step.icon className="w-4 h-4 text-teal-400" />
              </div>
              <Card className="p-6">
                <h3 className="text-teal-400 font-bold mb-4 flex items-center gap-2">
                  {step.title}
                  <span className="text-[10px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">VERIFIED</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(step.data).map(([key, val]: [string, any]) => (
                    <div key={key}>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-200 font-medium">{val || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const LedgerPage = () => null; // Removed ledger section

// --- Main App ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark } = useTheme();
  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30"
    >
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={useLocation().pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="p-8 border-t border-slate-900 text-center text-slate-600 text-sm">
          &copy; 2026 Petroleum Chain Integrity System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/crude" element={
          <ProtectedRoute>
            <MainLayout><CrudePurchasePage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/transport" element={
          <ProtectedRoute>
            <MainLayout><TransportationPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/storage" element={
          <ProtectedRoute>
            <MainLayout><StoragePage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/refining" element={
          <ProtectedRoute>
            <MainLayout><RefiningPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/distribution" element={
          <ProtectedRoute>
            <MainLayout><DistributionPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/retail" element={
          <ProtectedRoute>
            <MainLayout><RetailPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/emissions" element={
          <ProtectedRoute>
            <MainLayout><EmissionsPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/provenance" element={
          <ProtectedRoute>
            <MainLayout><ProvenancePage /></MainLayout>
          </ProtectedRoute>
        } />
        {/* Placeholder for other pages */}
        <Route path="*" element={
          <ProtectedRoute>
            <MainLayout>
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                  <Activity className="w-10 h-10 text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Module Under Construction</h2>
                <p className="text-slate-400 mt-2">This supply chain stage is currently being integrated into the ledger.</p>
                <Link to="/" className="mt-6">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}
