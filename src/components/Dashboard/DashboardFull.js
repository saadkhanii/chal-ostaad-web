import React, { useState, useEffect } from 'react';
import './DashboardFull.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardFull = () => {
  const [workers, setWorkers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const workersUnsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkers(workersData);
    });

    const officesUnsubscribe = onSnapshot(collection(db, 'offices'), (snapshot) => {
      const officesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffices(officesData);
    });

    const categoriesUnsubscribe = onSnapshot(collection(db, 'workCategories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
      setLoading(false);
    });

    return () => {
      workersUnsubscribe();
      officesUnsubscribe();
      categoriesUnsubscribe();
    };
  }, []);

  // Calculate statistics
  const totalWorkers = workers.length;
  const verifiedWorkers = workers.filter(w => w.verification?.status === 'verified').length;
  const pendingWorkers = workers.filter(w => w.verification?.status === 'pending').length;
  const activeOffices = offices.filter(o => o.details?.status === 'active').length;
  const totalCategories = categories.length;

  // Worker registration data for last 30 days
  const getRegistrationData = () => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    const registrationCounts = last30Days.map(date => {
      return workers.filter(worker => {
        const workerDate = worker.createdAt?.toDate?.().toISOString().split('T')[0];
        return workerDate === date;
      }).length;
    });

    return {
      labels: last30Days.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      data: registrationCounts
    };
  };

  // Verification status data
  const getVerificationData = () => {
    const verified = workers.filter(w => w.verification?.status === 'verified').length;
    const pending = workers.filter(w => w.verification?.status === 'pending').length;
    const rejected = workers.filter(w => w.verification?.status === 'rejected').length;

    return {
      labels: ['Verified', 'Pending', 'Rejected'],
      data: [verified, pending, rejected],
      colors: ['#10b981', '#f59e0b', '#ef4444']
    };
  };

  // Office performance data
  const getOfficePerformanceData = () => {
    const officeData = offices.map(office => {
      const workerCount = workers.filter(worker => 
        worker.officeInfo?.officeId === office.id
      ).length;
      
      return {
        name: office.basicInfo?.name || 'Unknown',
        workers: workerCount
      };
    }).sort((a, b) => b.workers - a.workers).slice(0, 8); // Top 8 offices

    return {
      labels: officeData.map(office => office.name),
      data: officeData.map(office => office.workers)
    };
  };

  // Category distribution data
  const getCategoryDistributionData = () => {
    const categoryData = categories.map(category => {
      const workerCount = workers.filter(worker => 
        worker.workInfo?.categoryId === category.id
      ).length;
      
      return {
        name: category.name,
        workers: workerCount,
        icon: category.icon
      };
    }).sort((a, b) => b.workers - a.workers).slice(0, 8); // Top 8 categories

    return {
      labels: categoryData.map(cat => cat.name),
      data: categoryData.map(cat => cat.workers),
      icons: categoryData.map(cat => cat.icon)
    };
  };

  // HIGH QUALITY CHART OPTIONS
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: 'Worker Registration Trend - Last 30 Days',
        color: '#f9fafb',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif"
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9ca3af',
          stepSize: 1,
          font: {
            size: 11
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Worker Verification Status',
        color: '#f9fafb',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif"
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb'
      }
    },
    cutout: '60%'
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        color: '#f9fafb',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif"
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb'
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        ticks: {
          color: '#9ca3af',
          stepSize: 1,
          font: {
            size: 11
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  const registrationData = getRegistrationData();
  const verificationData = getVerificationData();
  const officePerformanceData = getOfficePerformanceData();
  const categoryDistributionData = getCategoryDistributionData();

  return (
    <div className="dashboard-container">
      {/* <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <p>Comprehensive overview of your Chal Ostaad system performance</p>
      </div> */}

      {/* Quick Stats Cards - Full Width */}
      <div className="stats-grid">
        <div className="stat-card total-workers">
          <div className="stat-icon">👷</div>
          <div className="stat-content">
            <div className="stat-number">{totalWorkers}</div>
            <div className="stat-label">Total Workers</div>
            <div className="stat-trend">All registered service providers</div>
          </div>
        </div>

        <div className="stat-card verified-workers">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{verifiedWorkers}</div>
            <div className="stat-label">Verified Workers</div>
            <div className="stat-trend">Ready for service</div>
          </div>
        </div>

        <div className="stat-card pending-workers">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{pendingWorkers}</div>
            <div className="stat-label">Pending Verification</div>
            <div className="stat-trend">Awaiting approval</div>
          </div>
        </div>

        <div className="stat-card active-offices">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-number">{activeOffices}</div>
            <div className="stat-label">Active Offices</div>
            <div className="stat-trend">Operational locations</div>
          </div>
        </div>

        <div className="stat-card total-categories">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-number">{totalCategories}</div>
            <div className="stat-label">Work Categories</div>
            <div className="stat-trend">Service types available</div>
          </div>
        </div>
      </div>

      {/* Full Width Charts Row 1 */}
      <div className="charts-full-row">
        <div className="chart-full-card">
          <div className="chart-container">
            <Line 
              data={{
                labels: registrationData.labels,
                datasets: [
                  {
                    label: 'Workers Registered',
                    data: registrationData.data,
                    borderColor: 'rgb(255, 165, 0)',
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(255, 165, 0)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                  },
                ],
              }}
              options={lineChartOptions}
            />
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Two Columns */}
      <div className="charts-row">
        <div className="chart-card large">
          <div className="chart-container">
            <Doughnut 
              data={{
                labels: verificationData.labels,
                datasets: [
                  {
                    data: verificationData.data,
                    backgroundColor: verificationData.colors,
                    borderColor: verificationData.colors.map(color => color),
                    borderWidth: 3,
                    hoverOffset: 15,
                  },
                ],
              }}
              options={doughnutOptions}
            />
          </div>
        </div>

        <div className="chart-card large">
          <div className="chart-container">
            <Bar 
              data={{
                labels: officePerformanceData.labels,
                datasets: [
                  {
                    data: officePerformanceData.data,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                  },
                ],
              }}
              options={{
                ...barOptions,
                plugins: {
                  ...barOptions.plugins,
                  title: {
                    display: true,
                    text: 'Top Offices - Worker Distribution'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Full Width Charts Row 3 */}
      <div className="charts-full-row">
        <div className="chart-full-card">
          <div className="chart-container">
            <Bar 
              data={{
                labels: categoryDistributionData.labels,
                datasets: [
                  {
                    data: categoryDistributionData.data,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                  },
                ],
              }}
              options={{
                ...barOptions,
                plugins: {
                  ...barOptions.plugins,
                  title: {
                    display: true,
                    text: 'Category Distribution - Workers per Service Type'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFull;