import { useState, useEffect } from "react";
import { Box, Typography, useTheme, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Inventory = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState([]);
  const [actionType, setActionType] = useState(null); // 'edit' or 'delete'
  const [pendingAction, setPendingAction] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: "",
    category: "",
    quantity: 0,
    unit: "",
    supplier: "",
    lastRestocked: "",
    expiryDate: "",
    lowStockThreshold: 5,
  });

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
    setNewItem({
      itemName: "",
      category: "",
      quantity: 0,
      unit: "",
      supplier: "",
      lastRestocked: "",
      expiryDate: "",
      lowStockThreshold: 5,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Prepare payload with correct types
      const payload = {
        ...newItem,
        quantity: Number(newItem.quantity),
        lowStockThreshold: Number(newItem.lowStockThreshold),
        lastRestocked: newItem.lastRestocked || null,
        expiryDate: newItem.expiryDate || null,
      };

      const response = await fetch("http://localhost:8000/items/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add item:", errorData);
        return;
      }

      const savedItem = await response.json();

      // Add to local state
      const itemWithId = { id: savedItem.id || items.length + 1, ...savedItem };
      setItems((prev) => [...prev, itemWithId]);
      handleClose();
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  // Fetch inventory items from backend
  useEffect(() => {
    fetch("http://localhost:8000/items/")
      .then(res => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Expected array from /items/, got:", data);
          setItems([]);
          setLoading(false);
          return;
        }

        const itemsWithIds = data.map((item, index) => ({
          id: item.id || index + 1,
          itemName: item.itemName || "Unknown Item",
          category: item.category || "Uncategorized",
          quantity: item.quantity || 0,
          unit: item.unit || "pcs",
          supplier: item.supplier || "Unknown Supplier",
          lastRestocked: item.lastRestocked || null,
          expiryDate: item.expiryDate || null,
          lowStockThreshold: item.lowStockThreshold || 5,
        }));

        setItems(itemsWithIds);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setItems([]);
        setLoading(false);
      });
  }, []);

  // Safe value getter for dates
  const safeDateGetter = (params) => {
    if (!params || !params.row) return "";
    const dateValue = params.row[params.field];
    return dateValue ? new Date(dateValue).toLocaleDateString() : "";
  };

  // Handle edit action
  const handleEdit = () => {
    if (selectionModel.length === 0) {
      setActionType("edit");
      setPendingAction(true);
      return;
    }
    setPendingAction(true);
    setActionType("edit");
  };

  // Handle delete action
  const handleDelete = () => {
    if (selectionModel.length === 0) {
      setActionType("delete");
      setPendingAction(true);
      return;
    }
    setPendingAction(true);
    setActionType("delete");
  };

  // Confirm the action
  const handleConfirm = async () => {
    if (selectionModel.length === 0) {
      setPendingAction(false);
      setActionType(null);
      return;
    }

    if (actionType === "delete") {
      // Call backend DELETE
      await Promise.all(
        selectionModel.map(id =>
          fetch(`http://localhost:8000/items/${id}`, { method: "DELETE" })
        )
      );
      setItems(prev => prev.filter(item => !selectionModel.includes(item.id)));
    } else if (actionType === "edit") {
      // Example: open an edit dialog for selected item(s)
      // After saving changes, call PUT
      const id = selectionModel[0];
      const updatedData = { quantity: 20 }; // Example payload
      const res = await fetch(`http://localhost:8000/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setItems(prev => prev.map(item => (item.id === id ? updatedItem : item)));
      }
    }

    setPendingAction(false);
    setActionType(null);
    setSelectionModel([]);
  };

  const handleCancel = () => {
    setPendingAction(false);
    setActionType(null);
    if (pendingAction) {
      setSelectionModel([]);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "itemName", headerName: "Item Name", flex: 1, cellClassName: "name-column--cell" },
    { field: "category", headerName: "Category", width: 130 },
    { field: "quantity", headerName: "Quantity", width: 100, type: "number" },
    { field: "unit", headerName: "Unit", width: 80 },
    { field: "supplier", headerName: "Supplier", flex: 1 },
    { field: "lastRestocked", headerName: "Last Restocked", width: 130, valueGetter: safeDateGetter },
    { field: "expiryDate", headerName: "Expiry Date", width: 130, valueGetter: safeDateGetter },
    { field: "lowStockThreshold", headerName: "Low Stock Threshold", width: 150, type: "number" },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography color={colors.grey[500]}>N/A</Typography>;
        const quantity = params.row.quantity || 0;
        const threshold = params.row.lowStockThreshold || 5;
        return (
          <Typography color={quantity <= threshold ? colors.redAccent[500] : colors.greenAccent[500]}>
            {quantity <= threshold ? "Low Stock" : "OK"}
          </Typography>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="Inventory" subtitle="Managing the Inventory Items" />

      {/* Action Buttons */}
      <Box mb="10px" display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Button variant="contained" color="primary" onClick={handleOpen} disabled={pendingAction}>
          Add New Item
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleEdit}
          disabled={pendingAction && actionType !== "edit"}
          sx={{ backgroundColor: pendingAction && actionType === "edit" ? colors.greenAccent[600] : undefined }}
        >
          {pendingAction && actionType === "edit" ? "Select Rows to Edit" : "Edit"}
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={pendingAction && actionType !== "delete"}
          sx={{ backgroundColor: pendingAction && actionType === "delete" ? colors.redAccent[600] : undefined }}
        >
          {pendingAction && actionType === "delete" ? "Select Rows to Delete" : "Delete"}
        </Button>

        {pendingAction && (
          <>
            <Button variant="contained" color="success" onClick={handleConfirm} disabled={selectionModel.length === 0}>
              Confirm {actionType === "edit" ? "Edit" : "Delete"}
            </Button>
            <Button variant="outlined" color="warning" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
      </Box>

      {/* Action Status */}
      {pendingAction && (
        <Box mb="10px" p="10px" bgcolor={colors.primary[400]} borderRadius="8px">
          <Typography color={actionType === "edit" ? colors.greenAccent[500] : colors.redAccent[500]}>
            {selectionModel.length > 0
              ? `Ready to ${actionType} ${selectionModel.length} row${selectionModel.length > 1 ? "s" : ""} - Please confirm or cancel`
              : `Please select row(s) to ${actionType} then confirm`}
          </Typography>
        </Box>
      )}

      {!pendingAction && selectionModel.length > 0 && (
        <Box mb="10px" p="10px" bgcolor={colors.primary[400]} borderRadius="8px">
          <Typography>{selectionModel.length} row{selectionModel.length > 1 ? "s" : ""} selected</Typography>
        </Box>
      )}

      {/* DataGrid */}
      <Box
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none", backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid
          rows={items}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          onSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
          selectionModel={selectionModel}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Add Item Modal */}
      <Dialog open={isModalOpen} onClose={handleClose}>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Item Name"
            variant="outlined"
            fullWidth
            name="itemName"
            value={newItem.itemName}
            onChange={handleInputChange}
          />
          <TextField
            label="Category"
            variant="outlined"
            fullWidth
            name="category"
            value={newItem.category}
            onChange={handleInputChange}
          />
          <TextField
            label="Quantity"
            type="number"
            variant="outlined"
            fullWidth
            name="quantity"
            value={newItem.quantity}
            onChange={handleInputChange}
          />
          <TextField
            label="Unit"
            variant="outlined"
            fullWidth
            name="unit"
            value={newItem.unit}
            onChange={handleInputChange}
          />
          <TextField
            label="Supplier"
            variant="outlined"
            fullWidth
            name="supplier"
            value={newItem.supplier}
            onChange={handleInputChange}
          />
          <TextField
            label="Last Restocked"
            type="date"
            variant="outlined"
            fullWidth
            name="lastRestocked"
            InputLabelProps={{ shrink: true }}
            value={newItem.lastRestocked}
            onChange={handleInputChange}
          />
          <TextField
            label="Expiry Date"
            type="date"
            variant="outlined"
            fullWidth
            name="expiryDate"
            InputLabelProps={{ shrink: true }}
            value={newItem.expiryDate}
            onChange={handleInputChange}
          />
          <TextField
            label="Low Stock Threshold"
            type="number"
            variant="outlined"
            fullWidth
            name="lowStockThreshold"
            value={newItem.lowStockThreshold}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="warning" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;