import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext'; // If you are using the theme hook

const Billing = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Guest' };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Billing & Plans</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your subscription and invoices.</p>
        </header>

        {/* Placeholder Content Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 flex flex-col items-center justify-center text-center h-96">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
            <span className="text-4xl">💳</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Billing Module</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            View invoices, change plans, and manage payment methods. This will integrate with your billing provider.
          </p>
        </div>
      </div>
    </div>
  );
};
export default Billing;
