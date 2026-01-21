import Sidebar from '../components/Sidebar';

const IEPWriter = () => {
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Guest' };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">IEP Writer</h1>
          <p className="text-slate-500 dark:text-slate-400">Draft compliant goals and PLAAFPs.</p>
        </header>

        {/* Placeholder Content Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 flex flex-col items-center justify-center text-center h-96">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
            <span className="text-4xl">✍️</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">IEP Writing Workspace</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">
            Use the AI-powered IEP writer to generate PLAAFPs and measurable annual goals. This area will connect to the writer tool.
          </p>
        </div>
      </div>
    </div>
  );
};
export default IEPWriter;
