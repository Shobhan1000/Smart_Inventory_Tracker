import { useState, useEffect } from "react";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const Suppliers = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionModel, setSelectionModel] = useState([]);
  const [actionType, setActionType] = useState(null); // 'edit' or 'delete'
  const [pendingAction, setPendingAction] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplierName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    address: "",
    itemsProvided: "",
    rating: 0,
  });

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
    setNewSupplier({
      supplierName: "",
      contactPerson: "",
      email: "",
      phoneNumber: "",
      address: "",
      itemsProvided: "",
      rating: 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Correct payload with proper types
      const payload = {
        ...newSupplier,
        phoneNumber: newSupplier.phoneNumber || null,
        rating: Number(newSupplier.rating),
      };

      const response = await fetch("http://localhost:8000/suppliers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add supplier:", errorData);
        return;
      }

      const savedSupplier = await response.json();

      // Add to local state
      const supplierWithId = {
        id: savedSupplier.id || suppliers.length + 1,
        ...savedSupplier,
      };
      setSuppliers((prev) => [...prev, supplierWithId]);
      handleClose();
    } catch (err) {
      console.error("Error adding supplier:", err);
    }
  };

  // Fetch suppliers from backend
  useEffect(() => {
    fetch("http://localhost:8000/suppliers/")
      .then((res) => res.json())
      .then((data) => {
        const suppliersWithIds = data.map((supplier, index) => ({
          id: supplier.id || index + 1,
          supplierName: supplier.supplierName || "Unknown Supplier",
          contactPerson: supplier.contactPerson || "Not specified",
          email: supplier.email || "No email",
          phoneNumber: supplier.phoneNumber || "No phone",
          address: supplier.address || "Address not provided",
          itemsProvided: supplier.itemsProvided || "Various items",
          rating: supplier.rating || 0,
          status: supplier.status || "Active",
        }));
        setSuppliers(suppliersWithIds);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
        setSuppliers([]);
      });
  }, []);

  // Action handlers
  const handleEdit = () => {
    setActionType("edit");
    setPendingAction(true);
  };

  const handleDelete = () => {
    setActionType("delete");
    setPendingAction(true);
  };

  const handleConfirm = () => {
    if (actionType === "delete") {
      setSuppliers((prev) =>
        prev.filter((s) => !selectionModel.includes(s.id))
      );
    }
    console.log(`${actionType} confirmed for`, selectionModel);

    setPendingAction(false);
    setActionType(null);
    setSelectionModel([]);
  };

  const handleCancel = () => {
    setPendingAction(false);
    setActionType(null);
    setSelectionModel([]);
  };

  // Define columns for DataGrid
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "supplierName",
      headerName: "Supplier Name",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    { field: "contactPerson", headerName: "Contact Person", width: 150 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phoneNumber", headerName: "Phone", width: 130 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "itemsProvided", headerName: "Items Provided", width: 150 },
    {
      field: "rating",
      headerName: "Rating",
      width: 100,
      renderCell: (params) => {
        const rating = params.value || 0;
        return (
          <Box
            sx={{
              backgroundColor:
                rating >= 4
                  ? colors.greenAccent[600]
                  : rating >= 3
                  ? colors.blueAccent[500]
                  : colors.redAccent[600],
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            {rating}/5
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const status = params.value || "Active";
        const color =
          status === "Active"
            ? colors.greenAccent[500]
            : status === "Pending"
            ? colors.blueAccent[500]
            : colors.redAccent[500];

        return (
          <Typography color={color} fontWeight="bold">
            {status}
          </Typography>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Header title="Suppliers" subtitle="Managing the Suppliers" />

      {/* Action Buttons */}
      <Box mb="10px" display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
          disabled={pendingAction}
        >
          Add New Supplier
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleEdit}
          disabled={pendingAction && actionType !== "edit"}
          sx={{
            backgroundColor:
              pendingAction && actionType === "edit"
                ? colors.greenAccent[600]
                : undefined,
          }}
        >
          {pendingAction && actionType === "edit"
            ? "Select Rows to Edit"
            : "Edit"}
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={pendingAction && actionType !== "delete"}
          sx={{
            backgroundColor:
              pendingAction && actionType === "delete"
                ? colors.redAccent[600]
                : undefined,
          }}
        >
          {pendingAction && actionType === "delete"
            ? "Select Rows to Delete"
            : "Delete"}
        </Button>

        {pendingAction && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirm}
              disabled={selectionModel.length === 0}
            >
              Confirm {actionType === "edit" ? "Edit" : "Delete"}
            </Button>
            <Button variant="outlined" color="warning" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
      </Box>

      {/* Info Bar */}
      {pendingAction && (
        <Box mb="10px" p="10px" bgcolor={colors.primary[400]} borderRadius="8px">
          <Typography
            color={
              actionType === "edit"
                ? colors.greenAccent[500]
                : colors.redAccent[500]
            }
          >
            {selectionModel.length > 0
              ? `Ready to ${actionType} ${selectionModel.length} row${
                  selectionModel.length > 1 ? "s" : ""
                } - Please confirm or cancel`
              : `Please select row(s) to ${actionType} then confirm`}
          </Typography>
        </Box>
      )}

      <Box
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={suppliers}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          onSelectionModelChange={(newSelection) =>
            setSelectionModel(newSelection)
          }
          selectionModel={selectionModel}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Add Supplier Modal */}
      <Dialog open={isModalOpen} onClose={handleClose}>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Supplier Name"
            name="supplierName"
            value={newSupplier.supplierName}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Contact Person"
            name="contactPerson"
            value={newSupplier.contactPerson}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            value={newSupplier.email}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Phone Number"
            name="phoneNumber"
            value={newSupplier.phoneNumber}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Address"
            name="address"
            value={newSupplier.address}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Items Provided"
            name="itemsProvided"
            value={newSupplier.itemsProvided}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Rating"
            type="number"
            name="rating"
            value={newSupplier.rating}
            onChange={handleInputChange}
            fullWidth
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

export default Suppliers;