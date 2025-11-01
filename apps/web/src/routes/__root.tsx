import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-4">
        <h1 className="font-bold text-2xl">Better Nav</h1>
        <p>This is a showcase of the capabilities of Better Nav.</p>
        <nav className="flex gap-2">
          <Link to="/" className="italic hover:underline">
            Showcase
          </Link>
          <Link to="/benchmark" className="italic hover:underline">
            Benchmark
          </Link>
          <Link to="/documentation" className="italic hover:underline">
            Documentation
          </Link>
        </nav>
        <Outlet />
      </div>
    </>
  ),
});
