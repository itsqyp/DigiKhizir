import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  RefreshCw,
} from "lucide-react";

import { API_BASE_URL } from "../../lib/api";
import { clearAdminSession, getAdminSession } from "../../lib/adminAuth";
import HumanSheltersSection from "./sections/HumanSheltersSection";
import FoodReliefSection from "./sections/FoodReliefSection";
import AnimalSheltersSection from "./sections/AnimalSheltersSection";
const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "shelters", label: "Human Shelters", icon: House },
  { id: "food", label: "Food & Relief", icon: Utensils },
  { id: "animals", label: "Animal Shelters", icon: PawPrint },
  { id: "alerts", label: "Disaster Alerts", icon: Megaphone },
];

interface DashboardStats {
  humanShelters: number;
  foodPoints: number;
  animalShelters: number;
  activeAlerts: number;
}

interface StatsResponse {
  success: boolean;
  message?: string;
  data?: DashboardStats;
}

const statCards = [
  {
    key: "humanShelters",
    label: "Human Shelters",
    description: "Active shelter locations",
    icon: House,
    color: "bg-mint-cream text-deep-sea-blue",
  },
  {
    key: "foodPoints",
    label: "Food Distribution",
    description: "Active relief points",
    icon: Package,
    color: "bg-cotton-candy/20 text-night-bordeaux",
  },
  {
    key: "animalShelters",
    label: "Animal Shelters",
    description: "Active animal facilities",
    icon: PawPrint,
    color: "bg-amethyst/10 text-amethyst",
  },
  {
    key: "activeAlerts",
    label: "Active Alerts",
    description: "Currently published alerts",
    icon: AlertTriangle,
    color: "bg-night-bordeaux/10 text-night-bordeaux",
  },
] as const;

const emptyStats: DashboardStats = {
  humanShelters: 0,
  foodPoints: 0,
  animalShelters: 0,
  activeAlerts: 0,
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const session = getAdminSession();
  const adminName = session?.user.name || "Administrator";
  const adminUsername = session?.user.username || "Admin account";

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activeNavigation = navigation.find((item) => item.id === activePage);

  const logout = useCallback(() => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  // Fetch dashboard statistics
  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      const currentSession = getAdminSession();

      if (!currentSession) {
        clearAdminSession();
        navigate("/admin/login", { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentSession.token}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          clearAdminSession();
          navigate("/admin/login", { replace: true });
          return;
        }

        const result = (await response.json()) as StatsResponse;

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "Unable to load dashboard statistics.",
          );
        }

        if (!controller.signal.aborted) {
          setStats(result.data);
          setStatsError("");
        }
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }

        setStatsError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading statistics.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      controller.abort();
    };
  }, [navigate, refreshKey]);

  // Refresh dashboard statistics
  function handleRefresh() {
    setIsLoading(true);
    setStatsError("");
    setRefreshKey((previous) => previous + 1);
  }

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
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cotton-candy font-bold text-deep-sea-blue">
                {initials || "A"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{adminName}</p>
                <p className="truncate text-xs text-white/50">
                  @{adminUsername}
                </p>
              </div>

              <button
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                title="Logout"
                aria-label="Logout"
                onClick={logout}
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
                <p className="text-sm font-semibold">{adminName}</p>
                <p className="text-xs text-deep-sea-blue/50">
                  @{adminUsername}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cotton-candy font-bold text-deep-sea-blue">
                {initials || "A"}
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {activePage === "shelters" ? (
              <HumanSheltersSection />
            ) : activePage === "food" ? (
              <FoodReliefSection />
            ) : activePage === "animals" ? (
              <AnimalSheltersSection />
            ) : (
              <>
                {/* Welcome Section */}
                <section className="mb-8 overflow-hidden rounded-2xl bg-deep-sea-blue p-7 text-white shadow-lg sm:p-9">
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                      <p className="mb-2 text-sm font-medium text-cotton-candy">
                        ADMINISTRATION CENTER
                      </p>
                      <h2 className="font-poppins text-2xl font-bold sm:text-3xl">
                        Welcome back, {adminName}.
                      </h2>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                        Manage disaster preparedness resources, monitor
                        community facilities and keep information up to date.
                      </p>
                    </div>
                    <div className="hidden h-24 w-24 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                      <Activity size={45} className="text-cotton-candy" />
                    </div>
                  </div>
                </section>

                {/* Statistics */}
                <section className="mb-9">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-poppins text-lg font-bold">
                        System Overview
                      </h3>
                      <p className="mt-1 text-sm text-deep-sea-blue/55">
                        Your resource management at a glance.
                      </p>
                    </div>

                    <button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-deep-sea-blue/10 bg-white px-4 py-2 text-sm font-medium transition hover:border-amethyst/40 hover:text-amethyst disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw
                        size={16}
                        className={isLoading ? "animate-spin" : ""}
                      />
                      Refresh
                    </button>
                  </div>

                  {isLoading && (
                    <div className="mb-4 rounded-xl border border-amethyst/20 bg-white p-4 text-sm text-deep-sea-blue/60">
                      Loading dashboard statistics...
                    </div>
                  )}

                  {statsError && !isLoading && (
                    <div
                      role="alert"
                      className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-night-bordeaux/20 bg-white p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-semibold text-night-bordeaux">
                          Could not load statistics
                        </p>
                        <p className="mt-1 text-xs text-deep-sea-blue/60">
                          {statsError}
                        </p>
                      </div>
                      <button
                        onClick={handleRefresh}
                        className="shrink-0 rounded-lg bg-deep-sea-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-amethyst"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      const value = stats[stat.key];

                      return (
                        <div
                          key={stat.key}
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
                          <p className="mt-5 text-3xl font-bold">
                            {isLoading ? "..." : statsError ? "—" : value}
                          </p>
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
                      {statsError
                        ? "Unable to retrieve the latest database statistics. Check your connection and try again."
                        : isLoading
                          ? "Connecting to the database and retrieving resource statistics..."
                          : "Dashboard statistics are successfully retrieved from the DigiKhizir database."}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
