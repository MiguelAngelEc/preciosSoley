import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import apiService from '../services/api';
import useDecimalInput from '../hooks/useDecimalInput';

interface UnitCalculatorProps {
  productId: number;
}

interface CalculationResult {
  product_id: number;
  quantity: number;
  unit: string;
  cost_per_gram_adjusted: string;
  total_cost: string;
  precio_publico: string;
  precio_mayorista: string;
  precio_distribuidor: string;
  iva_publico: string;
  iva_mayorista: string;
  iva_distribuidor: string;
  precio_publico_con_iva: string;
  precio_mayorista_con_iva: string;
  precio_distribuidor_con_iva: string;
}

const UNIT_OPTIONS = [
  { value: 'g', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'l', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (mL)' },
  { value: 'galon', label: 'Galón' },
  { value: 'caneca_20l', label: 'Caneca 20L' }
];

const UnitCalculator: React.FC<UnitCalculatorProps> = ({ productId }) => {
  const [unit, setUnit] = useState<string>('g');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantityInput = useDecimalInput(1, { min: 0.01, step: 0.01 });

  useEffect(() => {
    if (quantityInput.numericValue > 0) {
      calculateCost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantityInput.numericValue, unit, productId]);

  const calculateCost = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.calculateCostByUnit(productId, quantityInput.numericValue, unit);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al calcular el costo');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Calculadora de Costos por Unidad
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Cantidad"
            value={quantityInput.value}
            onChange={quantityInput.handleChange}
            onBlur={quantityInput.handleBlur}
            error={!!quantityInput.error}
            helperText={quantityInput.error}
            sx={{ flex: 1 }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Unidad</InputLabel>
            <Select
              value={unit}
              label="Unidad"
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNIT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Resultados del Cálculo
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Información General
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Cantidad:</strong> {result.quantity} {UNIT_OPTIONS.find(u => u.value === result.unit)?.label}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Costo por gramo ajustado:</strong> {formatCurrency(result.cost_per_gram_adjusted)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Costo total base:</strong> {formatCurrency(result.total_cost)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Precios de Venta
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          PVP (Público): {formatCurrency(result.precio_publico)}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          + IVA: {formatCurrency(result.iva_publico)} = {formatCurrency(result.precio_publico_con_iva)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="warning.main" fontWeight="medium">
                          PVM (Mayorista): {formatCurrency(result.precio_mayorista)}
                        </Typography>
                        <Typography variant="body2" color="warning.main">
                          + IVA: {formatCurrency(result.iva_mayorista)} = {formatCurrency(result.precio_mayorista_con_iva)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="info.main" fontWeight="medium">
                          PVD (Distribuidor): {formatCurrency(result.precio_distribuidor)}
                        </Typography>
                        <Typography variant="body2" color="info.main">
                          + IVA: {formatCurrency(result.iva_distribuidor)} = {formatCurrency(result.precio_distribuidor_con_iva)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        )}

        {loading && (
          <Typography variant="body2" color="text.secondary">
            Calculando...
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default UnitCalculator;