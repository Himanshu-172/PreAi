import { NavLink } from 'react-router-dom';
import { appRoutes } from '../routes/appRoutes';

export function Sidebar() {
  return (
    <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
      <div className="mb-4">
        <p className="text-xl font-bold tracking-tight text-slate-950">PrepAI</p>
        <p className="text-sm text-slate-500">Interview preparation platform</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {appRoutes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              [
                'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              ].join(' ')
            }
          >
            {route.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
