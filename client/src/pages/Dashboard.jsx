import { useState, useEffect } from "react";
import {
  UserGroupIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import axios from "../services/axios";
import StatsCard from "../components/common/StatsCard";
import TrustScoreChart from "../components/charts/TrustScoreChart";
import Leaderboard from "../components/dashboard/Leaderboard";

function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    totalInfluencers: 0,
    totalClaims: 0,
    verifiedClaims: 0,
    averageTrustScore: 0,
    trustScoreTrend: 0,
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [statsResponse, chartResponse] = await Promise.all([
          axios.get("/influencers/stats"),
          axios.get("/influencers/trust-score-trend"),
        ]);

        setDashboardStats({
          totalInfluencers: statsResponse.data.totalInfluencers,
          totalClaims: statsResponse.data.totalClaims,
          verifiedClaims: statsResponse.data.verifiedClaims,
          averageTrustScore: statsResponse.data.averageTrustScore,
          trustScoreTrend: statsResponse.data.trustScoreTrend,
        });

        setChartData({
          labels: chartResponse.data.labels,
          datasets: [
            {
              label: "Average Trust Score",
              data: chartResponse.data.scores,
              borderColor: "#10B981",
              backgroundColor: "#10B98120",
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  const formatNumber = (num) => num.toLocaleString();
  const formatPercentage = (num) => `${Math.round(num)}%`;

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
          color: "#9CA3AF",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#9CA3AF",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Influencer Trust Leaderboard
        </h1>
        <p className="text-gray-400">
          Real-time rankings of health influencers based on scientific accuracy,
          credibility, and transparency. Updated daily using AI-powered
          analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Active Influencers"
          value={formatNumber(dashboardStats.totalInfluencers || 0)}
          icon={<UserGroupIcon className="w-6 h-6 text-emerald-500" />}
        />
        <StatsCard
          title="Claims Verified"
          value={formatNumber(dashboardStats.verifiedClaims || 0)}
          icon={<CheckCircleIcon className="w-6 h-6 text-emerald-500" />}
        />
        <StatsCard
          title="Average Trust Score"
          value={formatPercentage(dashboardStats.averageTrustScore || 0)}
          icon={<ChartBarIcon className="w-6 h-6 text-emerald-500" />}
          trend={dashboardStats.trustScoreTrend}
        />
      </div>

      <div className="mb-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">
          Trust Score Trend
        </h2>
        {chartData.labels?.length > 0 ? (
          <div className="h-[400px]">
            <TrustScoreChart data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p>No trend data available yet</p>
              <p className="text-sm mt-2">
                Start by analyzing some influencers
              </p>
            </div>
          </div>
        )}
      </div>

      <Leaderboard />
    </div>
  );
}

export default Dashboard;
