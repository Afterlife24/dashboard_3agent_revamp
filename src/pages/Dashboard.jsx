import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import "../styles/Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || 'https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com';

const COLORS = {
  verified: "#00d4aa",
  unverified: "#ff9800",
  email: "#64b5f6",
  google: "#ef5350",
  web: "#00d4aa",
  calling: "#64b5f6",
  whatsapp: "#25d366",
};

function Dashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeView, setActiveView] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    emailUsers: 0,
    googleUsers: 0,
  });
  const [agentUsage, setAgentUsage] = useState({
    perUser: [],
    totals: [],
    recent: [],
  });
  const [agentLoading, setAgentLoading] = useState(false);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [companyDetails, setCompanyDetails] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAgentUsage();
    fetchWaitlist();
    fetchCompanyDetails();
    const interval = setInterval(() => {
      fetchUsers(true);
      fetchAgentUsage(true);
      fetchWaitlist(true);
      fetchCompanyDetails(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/users`);
      const userData = response.data.users;
      setUsers(userData);
      setLastUpdated(new Date());
      setStats({
        total: userData.length,
        verified: userData.filter((u) => u.isVerified).length,
        unverified: userData.filter((u) => !u.isVerified).length,
        emailUsers: userData.filter((u) => u.provider === "email").length,
        googleUsers: userData.filter((u) => u.provider === "google").length,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch users");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAgentUsage = async (silent = false) => {
    try {
      if (!silent) setAgentLoading(true);
      const response = await axios.get(`${API_URL}/api/agent-usage/summary`);
      setAgentUsage(response.data);
    } catch (err) {
      // Silently fail — agent usage is supplementary
      console.warn("Failed to fetch agent usage:", err.message);
    } finally {
      if (!silent) setAgentLoading(false);
    }
  };

  const fetchWaitlist = async (silent = false) => {
    try {
      if (!silent) setWaitlistLoading(true);
      const response = await axios.get(`${API_URL}/api/waitlist/entries`);
      if (response.data.success) {
        setWaitlistEntries(response.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch waitlist:", err.message);
    } finally {
      if (!silent) setWaitlistLoading(false);
    }
  };

  const fetchCompanyDetails = async (silent = false) => {
    try {
      if (!silent) setCompanyLoading(true);
      const response = await axios.get(`${API_URL}/api/company-details/all`);
      if (response.data.success) {
        setCompanyDetails(response.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch company details:", err.message);
    } finally {
      if (!silent) setCompanyLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = users.map((user) => ({
      Name: user.name,
      Email: user.email,
      Provider: user.provider,
      Status: user.isVerified ? "Verified" : "Unverified",
      "Joined Date": new Date(user.createdAt).toLocaleString(),
      "Last Updated": new Date(user.updatedAt).toLocaleString(),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 10 }, // Provider
      { wch: 12 }, // Status
      { wch: 20 }, // Joined Date
      { wch: 20 }, // Last Updated
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    // Generate filename with current date
    const fileName = `users_export_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

  const exportCompanyDetails = () => {
    // Prepare data for export
    const exportData = companyDetails.map((company) => ({
      "Company Name": company.companyName,
      Industry: company.industry,
      "Company Size": company.companySize,
      Website: company.website || "-",
      Country: company.country,
      "Phone Number": company.phoneNumber,
      Address: company.address || "-",
      Description: company.description || "-",
      "User Name": company.userId?.name || "-",
      "User Email": company.userId?.email || "-",
      "Submitted Date": new Date(company.createdAt).toLocaleString(),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // Company Name
      { wch: 20 }, // Industry
      { wch: 15 }, // Company Size
      { wch: 30 }, // Website
      { wch: 15 }, // Country
      { wch: 18 }, // Phone Number
      { wch: 35 }, // Address
      { wch: 40 }, // Description
      { wch: 20 }, // User Name
      { wch: 30 }, // User Email
      { wch: 20 }, // Submitted Date
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Company Details");

    // Generate filename with current date
    const fileName = `company_details_export_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

  // Chart data
  const verificationData = [
    { name: "Verified", value: stats.verified },
    { name: "Unverified", value: stats.unverified },
  ];

  const providerData = [
    { name: "Email", value: stats.emailUsers },
    { name: "Google", value: stats.googleUsers },
  ];

  const barChartData = [
    { name: "Total", value: stats.total, fill: "#00d4aa" },
    { name: "Verified", value: stats.verified, fill: "#00d4aa" },
    { name: "Unverified", value: stats.unverified, fill: "#ff9800" },
    { name: "Email", value: stats.emailUsers, fill: "#64b5f6" },
    { name: "Google", value: stats.googleUsers, fill: "#ef5350" },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{payload[0].value} users</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-layout">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      <div className="ambient-glow-3"></div>

      {/* Mobile Hamburger Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h2>Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="close-btn">✕</button>
            </div>
            <nav className="mobile-menu-nav">
              <button
                className={`mobile-menu-item ${activeView === "analytics" ? "active" : ""}`}
                onClick={() => { setActiveView("analytics"); setMobileMenuOpen(false); }}
              >
                <span className="nav-icon">📈</span>
                <span className="nav-text">Analytics</span>
              </button>
              <button
                className={`mobile-menu-item ${activeView === "agentUsage" ? "active" : ""}`}
                onClick={() => { setActiveView("agentUsage"); setMobileMenuOpen(false); }}
              >
                <span className="nav-icon">🤖</span>
                <span className="nav-text">Agent Usage</span>
              </button>
              <button
                className={`mobile-menu-item ${activeView === "waitlist" ? "active" : ""}`}
                onClick={() => { setActiveView("waitlist"); setMobileMenuOpen(false); }}
              >
                <span className="nav-icon">📝</span>
                <span className="nav-text">Waitlist</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🎯 Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === "overview" ? "active" : ""}`}
            onClick={() => setActiveView("overview")}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Overview</span>
          </button>
          <button
            className={`nav-item ${activeView === "users" ? "active" : ""}`}
            onClick={() => setActiveView("users")}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Users</span>
          </button>
          <button
            className={`nav-item nav-item-desktop-only ${activeView === "analytics" ? "active" : ""}`}
            onClick={() => setActiveView("analytics")}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </button>
          <button
            className={`nav-item nav-item-desktop-only ${activeView === "agentUsage" ? "active" : ""}`}
            onClick={() => setActiveView("agentUsage")}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-text">Agent Usage</span>
          </button>
          <button
            className={`nav-item nav-item-desktop-only ${activeView === "waitlist" ? "active" : ""}`}
            onClick={() => setActiveView("waitlist")}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Waitlist</span>
          </button>
          <button
            className={`nav-item ${activeView === "companyDetails" ? "active" : ""}`}
            onClick={() => setActiveView("companyDetails")}
          >
            <span className="nav-icon">🏢</span>
            <span className="nav-text">Companies</span>
          </button>
          <div className="nav-divider"></div>
          <button
            className="nav-item nav-item-whatsapp"
            onClick={() => navigate("/whatsapp")}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">WhatsApp Agent</span>
          </button>
          {/* Mobile Hamburger Button */}
          <button
            className="nav-item nav-item-hamburger"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="nav-icon">☰</span>
            <span className="nav-text">More</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <p className="last-updated-sidebar">
            Last updated
            <br />
            {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </aside>

      <main className="main-container">
        <header className="content-header">
          <div>
            <h1>
              {activeView === "overview" && "📊 Overview"}
              {activeView === "users" && "👥 Users Management"}
              {activeView === "analytics" && "📈 Analytics"}
              {activeView === "agentUsage" && "🤖 Agent Usage"}
              {activeView === "waitlist" && "📝 Waitlist"}
              {activeView === "companyDetails" && "🏢 Company Details"}
            </h1>
            <p className="header-subtitle">User Management Dashboard</p>
          </div>
          <div className="header-actions">
            {activeView === "users" && (
              <button onClick={exportToExcel} className="export-btn">
                📥 Export Excel
              </button>
            )}
            {activeView === "companyDetails" && (
              <button onClick={exportCompanyDetails} className="export-btn">
                📥 Export Excel
              </button>
            )}
            <button onClick={() => fetchUsers()} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        </header>

        <div className="content-area">
          {error && <div className="error-banner">⚠️ {error}</div>}

          {loading && !users.length ? (
            <div className="loading">⏳ Loading...</div>
          ) : (
            <>
              {activeView === "overview" && (
                <div className="view-content">
                  <div className="stats-row">
                    <div className="stat-card">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <h3>Total Users</h3>
                        <p className="stat-value">{stats.total}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">✅</div>
                      <div className="stat-info">
                        <h3>Verified</h3>
                        <p className="stat-value verified">{stats.verified}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-info">
                        <h3>Unverified</h3>
                        <p className="stat-value unverified">
                          {stats.unverified}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="charts-row">
                    <div className="chart-card">
                      <h3>Verification Status</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={verificationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill={COLORS.verified} />
                            <Cell fill={COLORS.unverified} />
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                      <h3>Signup Methods</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={providerData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill={COLORS.email} />
                            <Cell fill={COLORS.google} />
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "users" && (
                <div className="view-content">
                  <div className="table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Provider</th>
                          <th>Status</th>
                          <th>Joined</th>
                          <th>Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id}>
                            <td>
                              <div className="user-cell">
                                <div className="avatar">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="user-name">{user.name}</span>
                              </div>
                            </td>
                            <td className="email-cell">{user.email}</td>
                            <td>
                              <span className={`badge ${user.provider}`}>
                                {user.provider === "email" ? "📧" : "🔐"}{" "}
                                {user.provider}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${user.isVerified ? "verified" : "unverified"}`}
                              >
                                {user.isVerified ? "✅ Verified" : "⏳ Pending"}
                              </span>
                            </td>
                            <td className="date-cell">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="date-cell">
                              {formatDate(user.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeView === "analytics" && (
                <div className="view-content">
                  <div className="chart-card-full">
                    <h3>User Statistics Overview</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={barChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.7)"
                          style={{ fontSize: "0.875rem" }}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.7)"
                          style={{ fontSize: "0.875rem" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="charts-row">
                    <div className="chart-card">
                      <h3>Verification Breakdown</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={verificationData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.7)"
                            style={{ fontSize: "0.875rem" }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            style={{ fontSize: "0.875rem" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            <Cell fill={COLORS.verified} />
                            <Cell fill={COLORS.unverified} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                      <h3>Provider Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={providerData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.7)"
                            style={{ fontSize: "0.875rem" }}
                          />
                          <YAxis
                            stroke="rgba(255,255,255,0.7)"
                            style={{ fontSize: "0.875rem" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            <Cell fill={COLORS.email} />
                            <Cell fill={COLORS.google} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "agentUsage" && (
                <div className="view-content">
                  {agentLoading && !agentUsage.perUser.length ? (
                    <div className="loading">⏳ Loading agent usage...</div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="users-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Provider</th>
                            <th>🌐 Web</th>
                            <th>📞 Calling</th>
                            <th>💬 WhatsApp</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => {
                            const webCount =
                              agentUsage.perUser.find(
                                (r) =>
                                  r._id.userEmail === user.email &&
                                  r._id.agentType === "web",
                              )?.count || 0;
                            const callingCount =
                              agentUsage.perUser.find(
                                (r) =>
                                  r._id.userEmail === user.email &&
                                  r._id.agentType === "calling",
                              )?.count || 0;
                            const whatsappCount =
                              agentUsage.perUser.find(
                                (r) =>
                                  r._id.userEmail === user.email &&
                                  r._id.agentType === "whatsapp",
                              )?.count || 0;
                            const total =
                              webCount + callingCount + whatsappCount;
                            return (
                              <tr key={user._id}>
                                <td>
                                  <div className="user-cell">
                                    <div className="avatar">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="user-name">
                                      {user.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="email-cell">{user.email}</td>
                                <td>
                                  <span className={`badge ${user.provider}`}>
                                    {user.provider === "email" ? "📧" : "🔐"}{" "}
                                    {user.provider}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className="stat-value"
                                    style={{ color: COLORS.web }}
                                  >
                                    {webCount}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className="stat-value"
                                    style={{ color: COLORS.calling }}
                                  >
                                    {callingCount}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className="stat-value"
                                    style={{ color: COLORS.whatsapp }}
                                  >
                                    {whatsappCount}
                                  </span>
                                </td>
                                <td>
                                  <span className="stat-value">{total}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeView === "waitlist" && (
                <div className="view-content">
                  {waitlistLoading && !waitlistEntries.length ? (
                    <div className="loading">⏳ Loading waitlist...</div>
                  ) : waitlistEntries.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <p>No waitlist entries yet</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="users-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Company</th>
                            <th>Message</th>
                            <th>Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waitlistEntries.map((entry) => (
                            <tr key={entry._id}>
                              <td>
                                <div className="user-cell">
                                  <div className="avatar">
                                    {entry.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="user-name">{entry.name}</span>
                                </div>
                              </td>
                              <td className="email-cell">{entry.email}</td>
                              <td>{entry.phone || "-"}</td>
                              <td>{entry.company || "-"}</td>
                              <td className="message-cell">
                                {entry.message ? (
                                  <span title={entry.message}>
                                    {entry.message.length > 50
                                      ? entry.message.substring(0, 50) + "..."
                                      : entry.message}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="date-cell">
                                {formatDate(entry.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeView === "companyDetails" && (
                <div className="view-content">
                  {companyLoading && !companyDetails.length ? (
                    <div className="loading">⏳ Loading company details...</div>
                  ) : companyDetails.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🏢</div>
                      <p>No company details submitted yet</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="users-table">
                        <thead>
                          <tr>
                            <th>Company Name</th>
                            <th>Industry</th>
                            <th>Size</th>
                            <th>Country</th>
                            <th>Phone</th>
                            <th>Website</th>
                            <th>User</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companyDetails.map((company) => (
                            <tr key={company._id}>
                              <td>
                                <div className="user-cell">
                                  <div className="avatar">
                                    {company.companyName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="user-name">{company.companyName}</span>
                                </div>
                              </td>
                              <td>{company.industry}</td>
                              <td>{company.companySize}</td>
                              <td>{company.country}</td>
                              <td>{company.phoneNumber}</td>
                              <td className="email-cell">
                                {company.website ? (
                                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                                    {company.website}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>
                                <div className="user-info-cell">
                                  <div>{company.userId?.name || "-"}</div>
                                  <div className="email-cell" style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                                    {company.userId?.email || "-"}
                                  </div>
                                </div>
                              </td>
                              <td className="date-cell">
                                {formatDate(company.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
