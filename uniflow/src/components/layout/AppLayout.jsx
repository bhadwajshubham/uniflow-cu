import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className='min-h-screen bg-slate-950 text-slate-50'>
      <nav className='border-b border-slate-800 p-4'>
        <h1 className='text-xl font-bold text-indigo-500'>UniFlow</h1>
      </nav>
      <main className='p-6'>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
