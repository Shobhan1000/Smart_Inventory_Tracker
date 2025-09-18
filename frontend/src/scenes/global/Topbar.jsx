import {
  Box,
  IconButton,
  useTheme,
  Badge,
  Popover,
  Typography,
  Stack,
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";

// Map alert types to icons
const typeIcons = {
  info: <InfoIcon fontSize="small" sx={{ color: "#2196f3" }} />,
  warning: <WarningIcon fontSize="small" sx={{ color: "#ff9800" }} />,
  error: <ErrorIcon fontSize="small" sx={{ color: "#f44336" }} />,
  success: <CheckCircleIcon fontSize="small" sx={{ color: "#4caf50" }} />,
};

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const id = open ? "notifications-popover" : undefined;

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

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* SEARCH BAR */}
      <Box display="flex" backgroundColor={colors.primary[400]} borderRadius="3px">
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* ICONS */}
      <Box display="flex" alignItems="center">
        {/* Dark / Light Mode Toggle */}
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>

        {/* Notifications */}
        <IconButton onClick={handleClick}>
          <Badge badgeContent={alerts.length} color="error">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ mt: 1 }}
        >
          <Box p={2} minWidth={250}>
            <Typography variant="h6" mb={1}>
              Notifications
            </Typography>
            <Stack spacing={1}>
              {loading ? (
                <Typography variant="body2" color={colors.grey[100]}>
                  Loading...
                </Typography>
              ) : alerts.length > 0 ? (
                alerts.map((alert) => (
                  <Box
                    key={alert.id}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    p={1}
                    borderRadius={1}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        alert.type === "info"
                          ? colors.blueAccent[700]
                          : alert.type === "warning"
                          ? colors.yellowAccent?.[700] || "#FFA726"
                          : alert.type === "error"
                          ? colors.redAccent[700]
                          : colors.greenAccent[700],
                    }}
                    onClick={() => {
                      navigate(`/alerts?alertId=${alert.id}`);
                      handleClose();
                    }}
                  >
                    {typeIcons[alert.type] || typeIcons.info}
                    <Typography variant="body2" color="white">
                      {alert.message}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color={colors.grey[100]}>
                  No notifications
                </Typography>
              )}
            </Stack>
          </Box>
        </Popover>

        {/* Settings / Profile */}
        <IconButton>
          <SettingsOutlinedIcon />
        </IconButton>
        <IconButton>
          <PersonOutlinedIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;