import { Box, Button, TextField, Typography } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import Header from "../../components/Header";

const Forecast = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [forecastResult, setForecastResult] = useState(null);

  const handleFormSubmit = async (values) => {
    console.log("Submitting values for forecast:", values);

    try {
      // Use full backend URL
      const response = await fetch("http://127.0.0.1:8000/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      setForecastResult(data.forecast); // forecast is an array of numbers
    } catch (error) {
      console.error("Error fetching forecast:", error);
      setForecastResult("Error fetching forecast. Try again.");
    }
  };

  return (
    <Box m="20px">
      <Header title="DEMAND FORECAST" subtitle="Predict Future Demand" />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{ "& > div": { gridColumn: isNonMobile ? undefined : "span 4" } }}
            >
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Product Name"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.product}
                name="product"
                error={!!touched.product && !!errors.product}
                helperText={touched.product && errors.product}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Current Stock"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.currentStock}
                name="currentStock"
                error={!!touched.currentStock && !!errors.currentStock}
                helperText={touched.currentStock && errors.currentStock}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Monthly Sales Data (comma-separated)"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.salesData}
                name="salesData"
                error={!!touched.salesData && !!errors.salesData}
                helperText={touched.salesData && errors.salesData}
                sx={{ gridColumn: "span 4" }}
              />
            </Box>

            <Box display="flex" justifyContent="end" mt="20px">
              <Button type="submit" color="secondary" variant="contained">
                Predict Demand
              </Button>
            </Box>
          </form>
        )}
      </Formik>

      {forecastResult && Array.isArray(forecastResult) && (
        <Box mt="30px">
          <Typography variant="h6">Forecast Result (next 6 months):</Typography>
          <ul>
            {forecastResult.map((value, index) => (
              <li key={index}>{`Month ${index + 1}: ${value.toFixed(2)}`}</li>
            ))}
          </ul>
        </Box>
      )}

      {typeof forecastResult === "string" && (
        <Typography color="error" mt="20px">{forecastResult}</Typography>
      )}
    </Box>
  );
};

const checkoutSchema = yup.object().shape({
  product: yup.string().required("required"),
  currentStock: yup.number().required("required"),
  salesData: yup
    .string()
    .matches(/^(\d+,?)+$/, "Must be comma-separated numbers")
    .required("required"),
});

const initialValues = {
  product: "",
  currentStock: "",
  salesData: "",
};

export default Forecast;