import { useEffect, useState } from "react";
import { Box, Button, Typography, Badge, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import BarChart from "../../components/BarChart";
import StatBox from "../../components/StatBox";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, transactionsRes, suppliersRes, alertsRes] = await Promise.all([
          fetch("http://localhost:8000/items/"),
          fetch("http://localhost:8000/transactions/"),
          fetch("http://localhost:8000/suppliers/"),
          fetch("http://localhost:8000/alerts/"),
        ]);

        setItems(await itemsRes.json());
        setTransactions(await transactionsRes.json());
        setSuppliers(await suppliersRes.json());
        setAlerts(await alertsRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold).length;
  const lowStockItemsPercentage = ((lowStockItems/items.length)*100).toPrecision(2);
  const totalSuppliers = suppliers.length;

  const getDateStr = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toDateString();
  };

  const sumRevenueForDate = (dateStr) =>
  transactions
    .filter(t => new Date(t.date).toDateString() === dateStr && t.type === "Inflow")
    .reduce((acc, t) => acc + t.amount, 0);

  const todayRevenue = sumRevenueForDate(getDateStr(0));
  const yesterdayRevenue = sumRevenueForDate(getDateStr(-1));

  let percentageDifference;
  let trend;

  if (yesterdayRevenue === 0) {
    percentageDifference = todayRevenue === 0 ? 0 : 100;
    trend = todayRevenue === 0 ? "no-change" : "up";
  } else {
    percentageDifference = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    trend = percentageDifference > 0 ? "up" : percentageDifference < 0 ? "down" : "no-change";
  }

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="DASHBOARD" subtitle="Welcome to your inventory dashboard" />
        <Box>
          {/* QUICK ACTIONS */}
          <Button
            sx={{
              backgroundColor: "success",
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
            onClick={() => navigate("/inventory")}
          >
            <AddIcon sx={{ mr: "10px" }} />
            Add New Item
          </Button>
          <Button
            sx={{
              backgroundColor: "primary",
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
            onClick={() => navigate("/transactions")}
          >
            <AddIcon sx={{ mr: "10px" }} />
            Record Transaction
          </Button>
          <Button
            sx={{
              backgroundColor: "secondary",
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
            onClick={() => navigate("/suppliers")}
          >
            <AddIcon sx={{ mr: "10px" }} />
            Add New Supplier
          </Button>
          <Button
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gridAutoRows="140px" gap="20px">
        {/* KEY METRICS */}
        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/inventory")}>
          <StatBox
            title={totalItems}
            subtitle="Total Items in Stock"
            icon={<InventoryIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
            showProgress={false}
          />
        </Box>

        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/alerts")}>
          <StatBox
            title={lowStockItems}
            subtitle="Items Low in Stock"
            progress={lowStockItemsPercentage/100}
            increase={lowStockItemsPercentage + "%"}
            icon={<WarningIcon sx={{ color: colors.redAccent[600], fontSize: "26px" }} />}
          />
        </Box>

        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/suppliers")}>
          <StatBox
            title={totalSuppliers}
            subtitle="Total Suppliers"
            icon={<LocalShippingIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
            showProgress={false}
          />
        </Box>

        <Box gridColumn="span 3" backgroundColor={colors.primary[400]} display="flex" alignItems="center" justifyContent="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/transactions")}>
          <StatBox
            title={`$${todayRevenue}`}
            subtitle="Revenue Today"
            icon={<PointOfSaleIcon sx={{ color: colors.greenAccent[600], fontSize: "26px" }} />}
            progress={percentageDifference / 100}
            increase={`${percentageDifference}%`}
            showProgress={true}
          />
        </Box>

        {/* ROW 2 - CHARTS */}
        <Box gridColumn="span 8" gridRow="span 2" backgroundColor={colors.primary[400]} p="20px">
          <Typography variant="h5" fontWeight="600" color={colors.grey[100]} mb="10px">
            Stock Level Trends
          </Typography>
          <LineChart isDashboard={true} data={items} />
        </Box>

        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Recent Transactions
            </Typography>
          </Box>

          {transactions.slice(-5).reverse().map((transaction, i) => {
            const isNegative = transaction.type == "Outflow";
            return (
              <Box
                key={`${transaction.id}-${i}`}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                borderBottom={`4px solid ${colors.primary[500]}`}
                p="15px"
              >
                <Box>
                  <Typography color={isNegative ? colors.redAccent[500] : colors.greenAccent[500]} variant="h5" fontWeight="600">
                    {transaction.id}
                  </Typography>
                  <Typography color={colors.grey[100]}>{transaction.description}</Typography>
                </Box>

                <Box color={colors.grey[100]}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Box>

                <Box
                  backgroundColor={isNegative ? colors.redAccent[500] : colors.greenAccent[500]}
                  p="5px 10px"
                  borderRadius="4px"
                >
                  ${Math.abs(transaction.amount)}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ROW 3 - MORE CHARTS */}
        <Box gridColumn="span 6" gridRow="span 2" backgroundColor={colors.primary[400]} p="30px" onClick={() => navigate("/analytics")}>
          <Typography variant="h5" fontWeight="600">Top Selling Items</Typography>
          <BarChart isDashboard={true} data={items} />
        </Box>

        <Box gridColumn="span 6" gridRow="span 2" backgroundColor={colors.primary[400]} p="30px" onClick={() => navigate("/forecast")}>
          <Typography variant="h5" fontWeight="600">Forecast / Demand Prediction</Typography>
          <LineChart isDashboard={true} data={items} />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;