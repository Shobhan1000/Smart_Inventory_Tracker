import {
  Box,
  Typography,
  useTheme,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Type styles
const typeStyles = (type, colors) => {
  switch (type) {
    case "info":
      return { color: colors.blueAccent?.[400] || "#2196f3", icon: <InfoIcon /> };
    case "warning":
      return { color: colors.yellowAccent?.[400] || "#FFA726", icon: <WarningIcon /> };
    case "error":
      return { color: colors.redAccent?.[400] || "#f44336", icon: <ErrorIcon /> };
    case "success":
      return { color: colors.greenAccent?.[400] || "#4caf50", icon: <CheckCircleIcon /> };
    default:
      return { color: colors.blueAccent?.[400] || "#2196f3", icon: <InfoIcon /> };
  }
};

const Alerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const alertIdFromQuery = Number(query.get("alertId"));

  const [expandedAlert, setExpandedAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------- FETCH ALERTS --------------------
  useEffect(() => {
    fetch("http://localhost:8000/alerts/")
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch alerts:", err);
        setAlerts([]);
        setLoading(false);
      });
  }, []);

  // Expand specific alert if passed in query
  useEffect(() => {
    if (alertIdFromQuery) {
      setExpandedAlert(alertIdFromQuery);
    }
  }, [alertIdFromQuery]);

  const handleChange = (id) => (event, isExpanded) => {
    setExpandedAlert(isExpanded ? id : null);
  };

  return (
    <Box m="20px">
      <Header title="Alerts" subtitle="Important Alerts and Notifications" />
      {loading ? (
        <Typography>Loading alerts...</Typography>
      ) : (
        <Stack spacing={2}>
          {alerts.map((alert) => {
            const { color, icon } = typeStyles(alert.type, colors);
            return (
              <Accordion
                key={alert.id}
                expanded={expandedAlert === alert.id}
                onChange={handleChange(alert.id)}
                sx={{ boxShadow: 3, borderRadius: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {icon}
                    <Typography variant="h6" sx={{ color }}>
                      {alert.title}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{alert.message}</Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
          {alerts.length === 0 && !loading && (
            <Typography>No alerts found.</Typography>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Alerts;