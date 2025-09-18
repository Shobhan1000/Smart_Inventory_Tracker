import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Transactions = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // -------------------- STATE --------------------
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState([]);
  const [actionType, setActionType] = useState(null);
  const [pendingAction, setPendingAction] = useState(false);

  const [filterType, setFilterType] = useState("All");
  const [showCalendar, setShowCalendar] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: "",
    description: "",
    amount: "",
    type: "Inflow",
    category: "",
    status: "Completed",
  });

  // -------------------- MODAL HANDLERS --------------------
  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
    setNewTransaction({
      date: "",
      description: "",
      amount: "",
      type: "Inflow",
      category: "",
      status: "Completed",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...newTransaction,
        amount: Number(newTransaction.amount),
        date: newTransaction.date || new Date().toISOString().split("T")[0],
      };

      if (actionType === "edit") {
        // Update transaction via API
        const response = await fetch(
          `http://localhost:8000/transactions/${selectionModel[0]}/`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to update transaction:", errorData);
          return;
        }

        // Update local state after successful API call
        setTransactions((prev) =>
          prev.map((t) => (t.id === selectionModel[0] ? { ...payload, id: t.id } : t))
        );
        setActionType(null);
        handleClose();
        return;
      }

      // For new transactions
      const response = await fetch("http://localhost:8000/transactions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add transaction:", errorData);
        return;
      }

      const savedTransaction = await response.json();
      const transactionWithId = {
        id: savedTransaction.id || transactions.length + 1,
        ...savedTransaction,
      };
      setTransactions((prev) => [...prev, transactionWithId]);
      handleClose();
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  // -------------------- FETCH TRANSACTIONS --------------------
  useEffect(() => {
    fetch("http://localhost:8000/transactions/")
      .then((res) => res.json())
      .then((data) => {
        const transactionsWithIds = data.map((t, index) => ({
          id: t.id || index + 1,
          date: t.date || "N/A",
          description: t.description || "No description",
          amount: t.amount || 0,
          type: t.type || "Inflow",
          category: t.category || "General",
          status: t.status || "Completed",
        }));
        setTransactions(transactionsWithIds);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setTransactions([]);
        setLoading(false);
      });
  }, []);

  // -------------------- ACTION HANDLERS --------------------
  const handleEdit = () => {
    if (selectionModel.length !== 1) {
      alert("Please select exactly one transaction to edit.");
      return;
    }
    const transactionToEdit = transactions.find(
      (t) => t.id === selectionModel[0]
    );
    setNewTransaction(transactionToEdit);
    setActionType("edit");
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (selectionModel.length === 0) {
      alert("Please select at least one transaction to delete.");
      return;
    }
    setActionType("delete");
    setPendingAction(true);
  };

  const handleConfirm = async () => {
    if (actionType === "delete") {
      try {
        // Ensure selectionModel is always treated as an array
        const selectedIds = Array.isArray(selectionModel) 
          ? selectionModel 
          : [selectionModel];

        // Delete each selected transaction via API
        for (const id of selectedIds) {
          const response = await fetch(
            `http://localhost:8000/transactions/${id}/`,
            {
              method: "DELETE",
            }
          );
          
          if (!response.ok) {
            console.error(`Failed to delete transaction ${id}`);
            return;
          }
        }

        // Update local state after successful API calls
        setTransactions((prev) =>
          prev.filter((t) => !selectedIds.includes(t.id))
        );
        setSelectionModel([]);
      } catch (err) {
        console.error("Error deleting transactions:", err);
      } finally {
        setPendingAction(false);
        setActionType(null);
      }
    }
  };

  const handleCancel = () => {
    setPendingAction(false);
    setActionType(null);
    setSelectionModel([]); // Deselect all rows
  };

  // Handle row click for selection
  const handleRowClick = (params) => {
    setSelectionModel([params.id]);
  };

  // Handle row double-click for editing
  const handleRowDoubleClick = (params) => {
    setSelectionModel([params.id]);
    const transactionToEdit = transactions.find((t) => t.id === params.id);
    setNewTransaction(transactionToEdit);
    setActionType("edit");
    setIsModalOpen(true);
  };

  // -------------------- FILTERED TRANSACTIONS --------------------
  const filteredTransactions = useMemo(() => {
    if (filterType === "All") return transactions;
    return transactions.filter((t) => t.type === filterType);
  }, [transactions, filterType]);

  // -------------------- SUMMARY CALCULATIONS --------------------
  const { totalInflow, totalOutflow, netBalance } = useMemo(() => {
    const inflow = transactions
      .filter((t) => t.type === "Inflow")
      .reduce((sum, t) => sum + t.amount, 0);
    const outflow = transactions
      .filter((t) => t.type === "Outflow")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netBalance: inflow - outflow,
    };
  }, [transactions]);

  // -------------------- COLUMNS FOR DATAGRID --------------------
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "date", headerName: "Date", width: 120 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "amount",
      headerName: "Amount",
      width: 130,
      renderCell: (params) => (
        <Typography
          fontWeight="bold"
          color={
            params.row.type === "Inflow"
              ? colors.greenAccent[500]
              : colors.redAccent[500]
          }
        >
          {params.row.type === "Inflow"
            ? `+${params.value}`
            : `-${params.value}`}
        </Typography>
      ),
    },
    { field: "type", headerName: "Type", width: 120 },
    { field: "category", headerName: "Category", width: 150 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const color =
          params.value === "Completed"
            ? colors.greenAccent[500]
            : params.value === "Pending"
            ? colors.blueAccent[500]
            : colors.redAccent[500];
        return <Typography color={color}>{params.value}</Typography>;
      },
    },
  ];

  // -------------------- CALENDAR EVENTS --------------------
  const transactionEvents = transactions.map((t) => ({
    id: t.id,
    title: `${t.type}: $${t.amount}`,
    date: t.date,
    backgroundColor:
      t.type === "Inflow" ? colors.greenAccent[500] : colors.redAccent[500],
    borderColor:
      t.type === "Inflow" ? colors.greenAccent[700] : colors.redAccent[700],
  }));

  // -------------------- JSX --------------------
  return (
    <Box m="20px">
      <Header title="Transactions" subtitle="Track inflows and outflows" />

      {/* SUMMARY BAR */}
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2} mb={3}>
        <Card sx={{ backgroundColor: colors.greenAccent[700] }}>
          <CardContent>
            <Typography variant="h6" color="white">
              Total Inflows
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="white">
              +{totalInflow}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: colors.redAccent[700] }}>
          <CardContent>
            <Typography variant="h6" color="white">
              Total Outflows
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="white">
              -{totalOutflow}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: colors.blueAccent[700] }}>
          <CardContent>
            <Typography variant="h6" color="white">
              Net Balance
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="white">
              {netBalance >= 0 ? `+${netBalance}` : `${netBalance}`}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* ACTION BUTTONS */}
      <Box mb="10px" display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
          disabled={pendingAction}
        >
          Add New Transaction
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleEdit}
          disabled={selectionModel.length !== 1 || pendingAction}
        >
          Edit
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={selectionModel.length === 0 || pendingAction}
        >
          Delete
        </Button>

        {/* Filter Dropdown */}
        <TextField
          select
          label="Filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Inflow">Inflows</MenuItem>
          <MenuItem value="Outflow">Outflows</MenuItem>
        </TextField>

        {/* Calendar Toggle */}
        <Button
          variant="contained"
          color="info"
          onClick={() => setShowCalendar((prev) => !prev)}
          disabled={pendingAction}
        >
          {showCalendar ? "Show Table View" : "Show Calendar View"}
        </Button>

        {pendingAction && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirm}
            >
              Confirm {actionType === "edit" ? "Edit" : "Delete"}
            </Button>
            <Button variant="outlined" color="warning" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
      </Box>

      {/* MAIN VIEW: TABLE OR CALENDAR */}
      {showCalendar ? (
        <Box>
          <FullCalendar
            height="75vh"
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={transactionEvents}
            eventClick={(info) => {
              alert(`${info.event.title} on ${info.event.startStr}`);
            }}
          />
        </Box>
      ) : (
        <Box
          height="75vh"
          sx={{
            "& .MuiDataGrid-root": {
              border: "none",
              backgroundColor: colors.primary[400],
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.blueAccent[700],
              borderBottom: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
              backgroundColor: colors.blueAccent[700],
            },
          }}
        >
          <DataGrid
            rows={filteredTransactions}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10]}
            checkboxSelection
            onRowSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
            selectionModel={selectionModel}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
            getRowId={(row) => row.id}
          />
        </Box>
      )}

      {/* ADD/EDIT TRANSACTION MODAL */}
      <Dialog open={isModalOpen} onClose={handleClose}>
        <DialogTitle>
          {actionType === "edit" ? "Edit Transaction" : "Add New Transaction"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Date"
            name="date"
            type="date"
            value={newTransaction.date}
            onChange={handleInputChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Description"
            name="description"
            value={newTransaction.description}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Amount"
            type="number"
            name="amount"
            value={newTransaction.amount}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            select
            label="Transaction Type"
            name="type"
            value={newTransaction.type || ""}
            onChange={handleInputChange}
            fullWidth
            variant="outlined"
            margin="normal"
          >
            <MenuItem value="Inflow">Inflow</MenuItem>
            <MenuItem value="Outflow">Outflow</MenuItem>
          </TextField>
          <TextField
            label="Category"
            name="category"
            value={newTransaction.category}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            select
            label="Status"
            name="status"
            value={newTransaction.status}
            onChange={handleInputChange}
            fullWidth
          >
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="warning" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {actionType === "edit" ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;