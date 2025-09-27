import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Chip
} from '@mui/material';
import {
  Add,
  Delete,
  Description,
  PictureAsPdf
} from '@mui/icons-material';
import apiService from '../services/api';
import { Proforma, ProformaCreate, ProformaItemCreate, Product } from '../types';
import ProformaDetailModal from './ProformaDetailModal';

interface ProformaManagerProps {
  products: Product[];
}

const ProformaManager: React.FC<ProformaManagerProps> = ({ products }) => {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Proforma creation state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [clienteRuc, setClienteRuc] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [tipoCliente, setTipoCliente] = useState<'publico' | 'mayorista' | 'distribuidor'>('publico');
  const [ivaAplicado, setIvaAplicado] = useState(12);
  const [selectedProducts, setSelectedProducts] = useState<{ productId: number; cantidad: number }[]>([]);

  // Detail modal state
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getPriceForClientType = (product: Product, clientType: string) => {
    if (product.peso_empaque) {
      // Package-based pricing
      switch (clientType) {
        case 'publico':
          return parseFloat(product.precio_publico_paquete).toFixed(2);
        case 'mayorista':
          return parseFloat(product.precio_mayorista_paquete).toFixed(2);
        case 'distribuidor':
          return parseFloat(product.precio_distribuidor_paquete).toFixed(2);
        default:
          return parseFloat(product.precio_publico_paquete).toFixed(2);
      }
    } else {
      // Standard pricing
      switch (clientType) {
        case 'publico':
          return parseFloat(product.precio_publico).toFixed(2);
        case 'mayorista':
          return parseFloat(product.precio_mayorista).toFixed(2);
        case 'distribuidor':
          return parseFloat(product.precio_distribuidor).toFixed(2);
        default:
          return parseFloat(product.precio_publico).toFixed(2);
      }
    }
  };

  useEffect(() => {
    fetchProformas();
  }, []);

  const fetchProformas = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProformas();
      setProformas(data.proformas);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar las proformas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProforma = async () => {
    if (!clienteNombre.trim()) {
      setError('El nombre del cliente es requerido');
      return;
    }

    if (selectedProducts.length === 0) {
      setError('Debe seleccionar al menos un producto');
      return;
    }

    // Validate quantities
    for (const item of selectedProducts) {
      if (item.cantidad <= 0) {
        setError('Todas las cantidades deben ser positivas');
        return;
      }
    }

    try {
      setLoading(true);
      const proformaData: ProformaCreate = {
        tipo_cliente: tipoCliente,
        cliente_nombre: clienteNombre.trim(),
        cliente_empresa: clienteEmpresa.trim() || undefined,
        cliente_ruc: clienteRuc.trim() || undefined,
        cliente_direccion: clienteDireccion.trim() || undefined,
        cliente_telefono: clienteTelefono.trim() || undefined,
        cliente_email: clienteEmail.trim() || undefined,
        iva_aplicado: ivaAplicado,
        items: selectedProducts.map(item => ({
          product_id: item.productId,
          cantidad: item.cantidad
        }))
      };

      await apiService.createProforma(proformaData);
      setShowCreateDialog(false);
      resetForm();
      setError(null);
      setSuccess('Proforma creada exitosamente');
      await fetchProformas();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la proforma');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClienteNombre('');
    setClienteEmpresa('');
    setClienteRuc('');
    setClienteDireccion('');
    setClienteTelefono('');
    setClienteEmail('');
    setTipoCliente('publico');
    setIvaAplicado(12);
    setSelectedProducts([]);
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { productId: 0, cantidad: 1 }]);
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleDeleteProforma = async (proformaId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta proforma?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteProforma(proformaId);
      setError(null);
      setSuccess('Proforma eliminada exitosamente');
      await fetchProformas();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar la proforma');
    } finally {
      setLoading(false);
    }
  };

  const getTipoClienteLabel = (tipo: string) => {
    switch (tipo) {
      case 'publico': return 'Público';
      case 'mayorista': return 'Mayorista';
      case 'distribuidor': return 'Distribuidor';
      default: return tipo;
    }
  };

  const handleViewDetails = async (proforma: Proforma) => {
    try {
      setLoading(true);
      // Fetch the complete proforma details with all relationships
      const fullProforma = await apiService.getProforma(proforma.id);
      setSelectedProforma(fullProforma);
      setShowDetailModal(true);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los detalles de la proforma');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProforma(null);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Create Proforma Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
          disabled={loading}
        >
          Crear Nueva Proforma
        </Button>
      </Box>

      {/* Proformas Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Número</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell align="right"><strong>Total</strong></TableCell>
              <TableCell><strong>Fecha Emisión</strong></TableCell>
              <TableCell><strong>Fecha Validez</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proformas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay proformas registradas
                </TableCell>
              </TableRow>
            ) : (
              proformas.map((proforma) => (
                <TableRow key={proforma.id}>
                  <TableCell>{proforma.numero_proforma}</TableCell>
                  <TableCell>
                    {proforma.cliente_nombre}
                    {proforma.cliente_empresa && (
                      <Typography variant="body2" color="text.secondary">
                        {proforma.cliente_empresa}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTipoClienteLabel(proforma.tipo_cliente)}
                      size="small"
                      color={
                        proforma.tipo_cliente === 'publico' ? 'primary' :
                        proforma.tipo_cliente === 'mayorista' ? 'warning' : 'info'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(proforma.total_final).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(proforma.fecha_emision).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(proforma.fecha_validez).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      title="Ver detalles"
                      onClick={() => handleViewDetails(proforma)}
                      disabled={loading}
                    >
                      <Description />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      size="small"
                      title="Generar PDF"
                    >
                      <PictureAsPdf />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteProforma(proforma.id)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Proforma Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Proforma</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Información del Cliente
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Cliente"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Empresa"
              value={clienteEmpresa}
              onChange={(e) => setClienteEmpresa(e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="RUC"
              value={clienteRuc}
              onChange={(e) => setClienteRuc(e.target.value)}
            />
            <TextField
              fullWidth
              label="Teléfono"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
            />
            <TextField
              fullWidth
              label="Dirección"
              value={clienteDireccion}
              onChange={(e) => setClienteDireccion(e.target.value)}
            />
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Configuración de Proforma
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <Select
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value as 'publico' | 'mayorista' | 'distribuidor')}
              >
                <MenuItem value="publico">Público</MenuItem>
                <MenuItem value="mayorista">Mayorista</MenuItem>
                <MenuItem value="distribuidor">Distribuidor</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="IVA (%)"
              type="number"
              value={ivaAplicado}
              onChange={(e) => setIvaAplicado(Number(e.target.value))}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Productos
          </Typography>

          {selectedProducts.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FormControl sx={{ minWidth: 200, mr: 2 }}>
                <Select
                  value={item.productId || ''}
                  onChange={(e) => updateProduct(index, 'productId', Number(e.target.value))}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Seleccionar Producto</em>
                  </MenuItem>
                  {products.map((product) => {
                    const price = getPriceForClientType(product, tipoCliente);
                    return (
                      <MenuItem key={product.id} value={product.id}>
                        {product.nombre} ({product.peso_empaque}g) - ${price}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <TextField
                label="Cantidad"
                type="number"
                value={item.cantidad}
                onChange={(e) => updateProduct(index, 'cantidad', Number(e.target.value))}
                inputProps={{ min: 1 }}
                sx={{ mr: 2, width: 100 }}
              />

              <Button onClick={() => removeProduct(index)} color="error">
                Remover
              </Button>
            </Box>
          ))}

          <Button onClick={addProduct} startIcon={<Add />} variant="outlined">
            Agregar Producto
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateProforma} variant="contained" disabled={loading}>
            Crear Proforma
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proforma Detail Modal */}
      <ProformaDetailModal
        proforma={selectedProforma}
        open={showDetailModal}
        onClose={handleCloseDetailModal}
      />
    </Box>
  );
};

export default ProformaManager;
export {};