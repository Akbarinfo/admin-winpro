import { createBrowserRouter } from 'react-router'

// Feature routes (exchangeRoutes, productRoutes…) are spread in here as features are added.
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <main className="grid h-full place-items-center">
        <div className="rounded-lg border border-line bg-surface p-8 text-center">
          <h1 className="text-2xl font-semibold">WinPro Admin</h1>
          <p className="mt-2 text-muted">React + TypeScript + Vite skeleti ishlayapti.</p>
        </div>
      </main>
    ),
  },
])
