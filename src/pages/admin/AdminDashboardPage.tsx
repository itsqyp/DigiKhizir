import { useState } from "react";
import {
  LayoutDashboard,
  House,
  Utensils,
  PawPrint,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  AlertTriangle,
  Package,
  Activity,
} from "lucide-react";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "shelters", label: "Human Shelters", icon: House },
  { id: "food", label: "Food & Relief", icon: Utensils },
  { id: "animals", label: "Animal Shelters", icon: PawPrint },
  { id: "alerts", label: "Disaster Alerts", icon: Megaphone },
];

const stats = [
  {
    label: "Human Shelters",
    value: "—",
    description: "Registered shelter locations",
    icon: House,
    color: "bg-mint-cream text-deep-sea-blue",
  },
  {
    label: "Food Distribution",
    value: "—",
    description: "Active relief points",
    icon: Package,
    color: "bg-cotton-candy/20 text-night-bordeaux",
  },
  {
    label: "Animal Shelters",
    value: "—",
    description: "Registered animal facilities",
    icon: PawPrint,
    color: "bg-amethyst/10 text-amethyst",
  },
  {
    label: "Active Alerts",
    value: "—",
    description: "Currently published alerts",
    icon: AlertTriangle,
    color: "bg-night-bordeaux/10 text-night-bordeaux",
  },
];

export default function AdminDashboardPage() {
  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeNavigation = navigation.find((item) => item.id === activePage);

  return (
    <div className="min-h-screen bg-mint-cream font-inter text-deep-sea-blue">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-deep-sea-blue/10 bg-white px-5 py-4 lg:hidden">
        <div>
          <h1 className="font-poppins text-xl font-bold">DigiKhizir</h1>
          <p className="text-xs text-deep-sea-blue/60">Administration</p>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 transition hover:bg-mint-cream"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <div className="flex min-h-screen">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-deep-sea-blue text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand */}
          <div className="border-b border-white/10 px-7 py-7">
            <h1 className="font-poppins text-2xl font-bold tracking-tight">
              DigiKhizir
            </h1>
            <p className="mt-1 text-sm text-white/60">Administration Panel</p>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-7">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              Management
            </p>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-amethyst text-white shadow-lg"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <p className="mb-4 mt-10 px-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              Account
            </p>

            <button
              onClick={() => {
                setActivePage("settings");
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activePage === "settings"
                  ? "bg-amethyst text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings size={19} />
              Settings
            </button>
          </div>

          {/* Admin Profile */}
          <div className="border-t border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cotton-candy font-bold text-deep-sea-blue">
                A
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Administrator</p>
                <p className="text-xs text-white/50">Admin account</p>
              </div>

              <button
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                title="Logout"
                aria-label="Logout"
                onClick={() => {
                  // Real logout will be connected to authentication.
                }}
              >
                <LogOut size={19} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          {/* Desktop Topbar */}
          <header className="hidden items-center justify-between border-b border-deep-sea-blue/10 bg-white px-8 py-5 lg:flex">
            <div>
              <p className="text-sm text-deep-sea-blue/50">
                DigiKhizir / Administration
              </p>

              <h2 className="mt-1 font-poppins text-xl font-bold">
                {activeNavigation?.label ?? "Settings"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">Administrator</p>
                <p className="text-xs text-deep-sea-blue/50">System manager</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cotton-candy font-bold text-deep-sea-blue">
                A
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {/* Welcome Section */}
            <section className="mb-8 overflow-hidden rounded-2xl bg-deep-sea-blue p-7 text-white shadow-lg sm:p-9">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <p className="mb-2 text-sm font-medium text-cotton-candy">
                    ADMINISTRATION CENTER
                  </p>

                  <h2 className="font-poppins text-2xl font-bold sm:text-3xl">
                    Welcome back, Administrator.
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                    Manage disaster preparedness resources, monitor community
                    facilities and keep information up to date.
                  </p>
                </div>

                <div className="hidden h-24 w-24 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                  <Activity size={45} className="text-cotton-candy" />
                </div>
              </div>
            </section>

            {/* Statistics */}
            <section className="mb-9">
              <div className="mb-5">
                <h3 className="font-poppins text-lg font-bold">
                  System Overview
                </h3>

                <p className="mt-1 text-sm text-deep-sea-blue/55">
                  Your resource management at a glance.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-deep-sea-blue/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                        >
                          <Icon size={21} />
                        </div>

                        <span className="text-xs text-deep-sea-blue/40">
                          DATABASE
                        </span>
                      </div>

                      <p className="mt-5 text-3xl font-bold">{stat.value}</p>

                      <h4 className="mt-1 font-semibold">{stat.label}</h4>

                      <p className="mt-2 text-xs text-deep-sea-blue/50">
                        {stat.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Resource Management */}
            <section>
              <div className="mb-5">
                <h3 className="font-poppins text-lg font-bold">
                  Resource Management
                </h3>

                <p className="mt-1 text-sm text-deep-sea-blue/55">
                  Select a section to manage its information.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {navigation.slice(1).map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className="group flex items-center gap-5 rounded-2xl border border-deep-sea-blue/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-amethyst/40 hover:shadow-md"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-mint-cream text-amethyst transition group-hover:bg-amethyst group-hover:text-white">
                        <Icon size={26} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold">{item.label}</h4>

                        <p className="mt-1 text-sm text-deep-sea-blue/50">
                          Manage and update {item.label.toLowerCase()}.
                        </p>
                      </div>

                      <span className="text-xl text-deep-sea-blue/30 transition group-hover:translate-x-1 group-hover:text-amethyst">
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Database Status */}
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-amethyst/20 bg-white p-4">
              <MapPin className="mt-0.5 shrink-0 text-amethyst" size={19} />

              <div>
                <p className="text-sm font-semibold">Database connection</p>

                <p className="mt-1 text-xs leading-5 text-deep-sea-blue/55">
                  Dashboard statistics and resource management will be connected
                  to the live database in the next steps.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
