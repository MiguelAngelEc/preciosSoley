import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  Badge
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Inventory as InventoryIcon,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Warning,
  CheckCircle,
  Info,
  ReceiptLong
} from '@mui/icons-material';
import apiService from '../services/api';
import {
  Inventory,
  InventoryCreate,
  InventoryUpdate,
  InventoryMovement,
  InventoryMovementCreate,
  InventoryDashboard,
  InventoryEgreso,
  InventoryEgresoCreate,
  InventoryEgresoUpdate,
  Product
} from '../types';

interface InventoryManagerProps {
  products: Product[];
  onProductsChange?: () => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, onProductsChange }) => {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<Inventory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to extract readable error messages from API responses
  const extractErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.response?.data?.detail) {
      const detail = error.response.data.detail;

      // Handle Pydantic validation errors
      if (Array.isArray(detail)) {
        return detail.map(err => {
          if (err.loc && err.msg) {
            const field = err.loc[err.loc.length - 1];
            return `${field}: ${err.msg}`;
          }
          return err.msg || 'Validation error';
        }).join(', ');
      }

      // Handle string detail
      if (typeof detail === 'string') {
        return detail;
      }

      // Handle object detail
      if (typeof detail === 'object' && detail.msg) {
        return detail.msg;
      }
    }

    return error?.message || 'An unexpected error occurred';
  };
  const [success, setSuccess] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);

  // Production entry state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newInventory, setNewInventory] = useState<InventoryCreate>({
    product_id: 0,
    fecha_produccion: new Date().toISOString().split('T')[0],
    cantidad_producida: '',
    stock_minimo: '',
    ubicacion: '',
    lote: '',
    notas: ''
  });

  // Edit inventory state
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [editInventory, setEditInventory] = useState<InventoryUpdate>({});

  // Stock movement state
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [movementInventory, setMovementInventory] = useState<Inventory | null>(null);
  const [newMovement, setNewMovement] = useState<InventoryMovementCreate>({
    tipo_movimiento: 'entrada',
    cantidad: '',
    motivo: '',
    referencia: ''
  });

  // Movement history state (kept for reference but not used in dashboard)
  const [movementHistory, setMovementHistory] = useState<InventoryMovement[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyInventory, setHistoryInventory] = useState<Inventory | null>(null);

  // Egreso state
  const [showEgresoDialog, setShowEgresoDialog] = useState(false);
  const [egresoInventory, setEgresoInventory] = useState<Inventory | null>(null);
  const [newEgreso, setNewEgreso] = useState<InventoryEgresoCreate>({
    cantidad: '',
    tipo_cliente: 'publico',
    motivo: '',
    referencia: '',
    usuario_responsable: 'Usuario'
  });

  // Egreso history state
  const [egresosHistory, setEgresosHistory] = useState<InventoryEgreso[]>([]);
  const [showEgresosDialog, setShowEgresosDialog] = useState(false);
  const [egresosInventory, setEgresosInventory] = useState<Inventory | null>(null);

  // Edit egreso state
  const [editingEgreso, setEditingEgreso] = useState<InventoryEgreso | null>(null);
  const [editEgreso, setEditEgreso] = useState<InventoryEgresoUpdate>({});

  // Filters
  const [productFilter, setProductFilter] = useState<number | ''>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('');

  const applyFilters = useCallback(() => {
    let filtered = inventories;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(inventory =>
        inventory.product?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventory.lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventory.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Product filter
    if (productFilter) {
      filtered = filtered.filter(inventory => inventory.product_id === productFilter);
    }

    // Stock status filter
    if (stockStatusFilter) {
      if (stockStatusFilter === 'low') {
        filtered = filtered.filter(inventory => inventory.stock_status === 'low');
      } else if (stockStatusFilter === 'ok') {
        filtered = filtered.filter(inventory => inventory.stock_status === 'ok');
      }
    }

    setFilteredInventories(filtered);
  }, [inventories, searchTerm, productFilter, stockStatusFilter]);

  useEffect(() => {
    fetchInventories();
    fetchDashboard();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const data = await apiService.getInventories();
      setInventories(data);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const data = await apiService.getInventorySummary();
      setDashboard(data);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
    }
  };

  const handleCreateInventory = async () => {
    if (!newInventory.product_id || !newInventory.cantidad_producida) {
      setError('Producto y cantidad producida son requeridos');
      return;
    }

    const cantidad = parseInt(newInventory.cantidad_producida);
    if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      setError('La cantidad producida debe ser un número entero positivo');
      return;
    }

    try {
      setLoading(true);
      // Convert date string to ISO format for backend
      const fechaProduccionISO = new Date(newInventory.fecha_produccion + 'T00:00:00').toISOString();

      await apiService.createInventory({
        product_id: newInventory.product_id,
        fecha_produccion: fechaProduccionISO,
        cantidad_producida: cantidad.toString(),
        stock_minimo: newInventory.stock_minimo ? parseFloat(newInventory.stock_minimo).toString() : undefined,
        ubicacion: newInventory.ubicacion || undefined,
        lote: newInventory.lote || undefined,
        notas: newInventory.notas || undefined
      });

      setShowCreateDialog(false);
      setNewInventory({
        product_id: 0,
        fecha_produccion: new Date().toISOString().split('T')[0],
        cantidad_producida: '',
        stock_minimo: '',
        ubicacion: '',
        lote: '',
        notas: ''
      });
      setError(null);
      setSuccess('Entrada de producción registrada exitosamente');
      await fetchInventories();
      await fetchDashboard();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEditInventory = (inventory: Inventory) => {
    setEditingInventory(inventory);
    setEditInventory({
      product_id: inventory.product_id,
      fecha_produccion: inventory.fecha_produccion.split('T')[0],
      cantidad_producida: inventory.cantidad_producida,
      stock_minimo: inventory.stock_minimo || '',
      ubicacion: inventory.ubicacion || '',
      lote: inventory.lote || '',
      notas: inventory.notas || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingInventory) return;

    try {
      setLoading(true);
      await apiService.updateInventory(editingInventory.id, editInventory);
      setEditingInventory(null);
      setEditInventory({});
      setError(null);
      setSuccess('Inventario actualizado exitosamente');
      await fetchInventories();
      await fetchDashboard();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInventory = async (inventoryId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta entrada de inventario?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteInventory(inventoryId);
      setError(null);
      setSuccess('Entrada de inventario eliminada exitosamente');
      await fetchInventories();
      await fetchDashboard();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMovement = async () => {
    if (!movementInventory || !newMovement.cantidad || !newMovement.motivo) {
      setError('Todos los campos son requeridos');
      return;
    }

    const cantidad = parseInt(newMovement.cantidad);
    if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      setError('La cantidad debe ser un número entero positivo');
      return;
    }

    try {
      setLoading(true);
      await apiService.registerStockMovement(
        movementInventory.id,
        {
          ...newMovement,
          cantidad: cantidad.toString()
        },
        'Usuario' // In a real app, this would come from auth context
      );

      setShowMovementDialog(false);
      setMovementInventory(null);
      setNewMovement({
        tipo_movimiento: 'entrada',
        cantidad: '',
        motivo: '',
        referencia: ''
      });
      setError(null);
      setSuccess('Movimiento de stock registrado exitosamente');
      await fetchInventories();
      await fetchDashboard();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewEgresos = async (inventory: Inventory) => {
    try {
      const egresos = await apiService.getInventoryEgresos(inventory.id);
      setEgresosHistory(egresos);
      setEgresosInventory(inventory);
      setShowEgresosDialog(true);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    }
  };

  const handleCreateEgreso = async () => {
    if (!egresoInventory || !newEgreso.cantidad || !newEgreso.tipo_cliente) {
      setError('Todos los campos son requeridos');
      return;
    }

    const cantidad = parseInt(newEgreso.cantidad);
    if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      setError('La cantidad debe ser un número entero positivo');
      return;
    }

    // Validate stock availability
    const stockActual = parseFloat(egresoInventory.stock_actual);
    if (cantidad > stockActual) {
      setError(`Stock insuficiente. Disponible: ${stockActual.toFixed(0)} unidades`);
      return;
    }

    try {
      setLoading(true);
      await apiService.createEgreso(egresoInventory.id, {
        ...newEgreso,
        cantidad: cantidad.toString()
      });

      setShowEgresoDialog(false);
      setEgresoInventory(null);
      setNewEgreso({
        cantidad: '',
        tipo_cliente: 'publico',
        motivo: '',
        referencia: '',
        usuario_responsable: 'Usuario'
      });
      setError(null);
      setSuccess('Egreso registrado exitosamente');
      await fetchInventories();
      await fetchDashboard();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEditEgreso = (egreso: InventoryEgreso) => {
    setEditingEgreso(egreso);
    setEditEgreso({
      cantidad: egreso.cantidad,
      tipo_cliente: egreso.tipo_cliente,
      motivo: egreso.motivo || '',
      referencia: egreso.referencia || '',
      usuario_responsable: egreso.usuario_responsable
    });
  };

  const handleSaveEditEgreso = async () => {
    if (!editingEgreso) return;

    try {
      setLoading(true);
      await apiService.updateEgreso(editingEgreso.id, editEgreso);
      setEditingEgreso(null);
      setEditEgreso({});
      setError(null);
      setSuccess('Egreso actualizado exitosamente');

      // Refresh egresos history if dialog is open
      if (showEgresosDialog && egresosInventory) {
        await handleViewEgresos(egresosInventory);
      }

      await fetchInventories();
      await fetchDashboard();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEgreso = async (egresoId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este egreso? El stock será devuelto al inventario.')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteEgreso(egresoId);
      setError(null);
      setSuccess('Egreso eliminado exitosamente');

      // Refresh egresos history if dialog is open
      if (showEgresosDialog && egresosInventory) {
        await handleViewEgresos(egresosInventory);
      }

      await fetchInventories();
      await fetchDashboard();
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'warning';
      case 'ok': return 'success';
      default: return 'default';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'low': return <Warning />;
      case 'ok': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const getMovementIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return <TrendingUp color="success" />;
      case 'salida': return <TrendingDown color="error" />;
      case 'ajuste': return <SwapHoriz color="info" />;
      default: return <SwapHoriz />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Gestión de Inventario
      </Typography>

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

      {/* Dashboard Summary Cards */}
      {dashboard && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Card sx={{ flex: '1 1 250px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Productos
              </Typography>
              <Typography variant="h4">
                {dashboard.total_products}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 250px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Egresos Hoy (Cantidad)
              </Typography>
              <Typography variant="h4">
                {parseFloat(dashboard.today_egresos).toFixed(0)} unidades
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 250px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valor Egresos Hoy
              </Typography>
              <Typography variant="h4" color="success.main">
                ${parseFloat(dashboard.today_egresos_value).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 250px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Alertas Stock Bajo
              </Typography>
              <Typography variant="h4" color={dashboard.low_stock_count > 0 ? 'error' : 'success'}>
                <Badge badgeContent={dashboard.low_stock_count} color="error">
                  {dashboard.low_stock_count}
                </Badge>
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 250px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Producción Hoy
              </Typography>
              <Typography variant="h4">
                {parseFloat(dashboard.today_production).toFixed(0)} unidades
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                placeholder="Buscar por producto, lote o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ color: 'action.active', mr: 1 }} />
                  ),
                }}
                size="small"
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Producto</InputLabel>
                <Select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value as number | '')}
                  label="Producto"
                >
                  <MenuItem value="">
                    <em>Todos los productos</em>
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 150 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado Stock</InputLabel>
                <Select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  label="Estado Stock"
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  <MenuItem value="ok">Stock OK</MenuItem>
                  <MenuItem value="low">Stock Bajo</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Create Production Entry Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
          disabled={loading}
        >
          Registrar Producción
        </Button>
      </Box>

      {/* Inventory Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell><strong>Lote</strong></TableCell>
              <TableCell><strong>Fecha Producción</strong></TableCell>
              <TableCell align="right"><strong>Cantidad Producida</strong></TableCell>
              <TableCell align="right"><strong>Stock Actual</strong></TableCell>
              <TableCell align="right"><strong>Stock Mínimo</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Ubicación</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No hay entradas de inventario
                </TableCell>
              </TableRow>
            ) : (
              filteredInventories.map((inventory) => (
                <TableRow key={inventory.id}>
                  <TableCell>{inventory.product?.nombre || 'Producto desconocido'}</TableCell>
                  <TableCell>{inventory.lote || '-'}</TableCell>
                  <TableCell>{new Date(inventory.fecha_produccion).toLocaleDateString()}</TableCell>
                  <TableCell align="right">{parseFloat(inventory.cantidad_producida).toFixed(0)} unidades</TableCell>
                  <TableCell align="right">{parseFloat(inventory.stock_actual).toFixed(0)} unidades</TableCell>
                  <TableCell align="right">
                    {inventory.stock_minimo ? `${parseFloat(inventory.stock_minimo).toFixed(0)} unidades` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStockStatusIcon(inventory.stock_status)}
                      label={inventory.stock_status === 'low' ? 'Stock Bajo' : 'Stock OK'}
                      color={getStockStatusColor(inventory.stock_status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{inventory.ubicacion || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleViewEgresos(inventory)}
                      color="info"
                      size="small"
                      title="Ver egresos"
                    >
                      <ReceiptLong />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setEgresoInventory(inventory);
                        setShowEgresoDialog(true);
                      }}
                      color="primary"
                      size="small"
                      title="Registrar egreso"
                    >
                      <TrendingDown />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEditInventory(inventory)}
                      color="secondary"
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteInventory(inventory.id)}
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

      {/* Create Production Entry Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Producción</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Producto</InputLabel>
              <Select
                value={newInventory.product_id || ''}
                onChange={(e) => setNewInventory((prev: InventoryCreate) => ({ ...prev, product_id: Number(e.target.value) }))}
                label="Producto"
              >
                <MenuItem value="">
                  <em>Seleccionar producto</em>
                </MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Fecha de Producción"
              type="date"
              value={newInventory.fecha_produccion}
              onChange={(e) => setNewInventory((prev: InventoryCreate) => ({ ...prev, fecha_produccion: e.target.value }))}
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Cantidad Producida (unidades)"
              type="number"
              value={newInventory.cantidad_producida}
              onChange={(e) => setNewInventory((prev: InventoryCreate) => ({ ...prev, cantidad_producida: e.target.value }))}
              required
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              fullWidth
              label="Stock Mínimo (unidades)"
              type="number"
              value={newInventory.stock_minimo}
              onChange={(e) => setNewInventory((prev: InventoryCreate) => ({ ...prev, stock_minimo: e.target.value }))}
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              fullWidth
              label="Ubicación"
              value={newInventory.ubicacion}
              onChange={(e) => setNewInventory((prev: InventoryCreate) => ({ ...prev, ubicacion: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Lote/Batch"
              value={newInventory.lote}
              onChange={(e) => setNewInventory((prev: InventoryCreate) => ({ ...prev, lote: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={3}
              value={newInventory.notas}
              onChange={(e) => setNewInventory((prev: InventoryCreate) => ({ ...prev, notas: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateInventory} variant="contained" disabled={loading}>
            Registrar Producción
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={!!editingInventory} onClose={() => setEditingInventory(null)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Entrada de Inventario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Producto</InputLabel>
              <Select
                value={editInventory.product_id || ''}
                onChange={(e) => setEditInventory((prev: InventoryUpdate) => ({ ...prev, product_id: Number(e.target.value) }))}
                label="Producto"
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Fecha de Producción"
              type="date"
              value={editInventory.fecha_produccion || ''}
              onChange={(e) => setEditInventory((prev: InventoryUpdate) => ({ ...prev, fecha_produccion: e.target.value }))}
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Cantidad Producida (unidades)"
              type="number"
              value={editInventory.cantidad_producida || ''}
              onChange={(e) => setEditInventory((prev: InventoryUpdate) => ({ ...prev, cantidad_producida: e.target.value }))}
              required
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              fullWidth
              label="Stock Mínimo (unidades)"
              type="number"
              value={editInventory.stock_minimo || ''}
              onChange={(e) => setEditInventory((prev: InventoryUpdate) => ({ ...prev, stock_minimo: e.target.value }))}
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              fullWidth
              label="Ubicación"
              value={editInventory.ubicacion || ''}
              onChange={(e) => setEditInventory((prev: InventoryUpdate) => ({ ...prev, ubicacion: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Lote/Batch"
              value={editInventory.lote || ''}
              onChange={(e) => setEditInventory((prev: InventoryUpdate) => ({ ...prev, lote: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={3}
              value={editInventory.notas || ''}
              onChange={(e) => setEditInventory((prev: InventoryUpdate) => ({ ...prev, notas: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingInventory(null)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={loading}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Egreso Dialog */}
      <Dialog open={showEgresoDialog} onClose={() => setShowEgresoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Registrar Egreso
          {egresoInventory && ` - ${egresoInventory.product?.nombre}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Cliente</InputLabel>
              <Select
                value={newEgreso.tipo_cliente}
                onChange={(e) => setNewEgreso((prev: InventoryEgresoCreate) => ({ ...prev, tipo_cliente: e.target.value as any }))}
                label="Tipo de Cliente"
              >
                <MenuItem value="publico">Venta al Público</MenuItem>
                <MenuItem value="mayorista">Venta por Mayor</MenuItem>
                <MenuItem value="distribuidor">Venta a Distribuidor</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Cantidad (unidades)"
              type="number"
              value={newEgreso.cantidad}
              onChange={(e) => setNewEgreso((prev: InventoryEgresoCreate) => ({ ...prev, cantidad: e.target.value }))}
              required
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              fullWidth
              label="Motivo del Egreso"
              value={newEgreso.motivo}
              onChange={(e) => setNewEgreso((prev: InventoryEgresoCreate) => ({ ...prev, motivo: e.target.value }))}
              multiline
              rows={2}
              placeholder="Ej: Venta, muestra, donación"
            />

            <TextField
              fullWidth
              label="Referencia"
              value={newEgreso.referencia}
              onChange={(e) => setNewEgreso((prev: InventoryEgresoCreate) => ({ ...prev, referencia: e.target.value }))}
              placeholder="Número de factura, orden, etc."
            />

            {egresoInventory && (
              <Alert severity="info">
                Stock actual disponible: {parseFloat(egresoInventory.stock_actual).toFixed(0)} unidades
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEgresoDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateEgreso} variant="contained" disabled={loading}>
            Registrar Egreso
          </Button>
        </DialogActions>
      </Dialog>

      {/* Egresos History Dialog */}
      <Dialog open={showEgresosDialog} onClose={() => setShowEgresosDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Historial de Egresos
          {egresosInventory && ` - ${egresosInventory.product?.nombre} (Lote: ${egresosInventory.lote || 'N/A'})`}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Tipo Cliente</strong></TableCell>
                  <TableCell align="right"><strong>Cantidad</strong></TableCell>
                  <TableCell align="right"><strong>Precio Unitario</strong></TableCell>
                  <TableCell align="right"><strong>Valor Total</strong></TableCell>
                  <TableCell><strong>Motivo</strong></TableCell>
                  <TableCell><strong>Referencia</strong></TableCell>
                  <TableCell><strong>Responsable</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {egresosHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No hay egresos registrados para este producto
                    </TableCell>
                  </TableRow>
                ) : (
                  egresosHistory.map((egreso) => (
                    <TableRow key={egreso.id}>
                      <TableCell>{new Date(egreso.fecha_egreso).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={egreso.tipo_cliente_display}
                          size="small"
                          color={egreso.tipo_cliente === 'publico' ? 'primary' : egreso.tipo_cliente === 'mayorista' ? 'secondary' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="right">{parseFloat(egreso.cantidad).toFixed(0)} unidades</TableCell>
                      <TableCell align="right">${parseFloat(egreso.precio_unitario).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ${parseFloat(egreso.valor_total).toFixed(2)}
                      </TableCell>
                      <TableCell>{egreso.motivo || '-'}</TableCell>
                      <TableCell>{egreso.referencia || '-'}</TableCell>
                      <TableCell>{egreso.usuario_responsable}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleEditEgreso(egreso)}
                          color="secondary"
                          size="small"
                          title="Editar egreso"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteEgreso(egreso.id)}
                          color="error"
                          size="small"
                          title="Eliminar egreso"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEgresosDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Egreso Dialog */}
      <Dialog open={!!editingEgreso} onClose={() => { setEditingEgreso(null); setEditEgreso({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Egreso</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Cliente</InputLabel>
              <Select
                value={editEgreso.tipo_cliente || ''}
                onChange={(e) => setEditEgreso((prev: InventoryEgresoUpdate) => ({ ...prev, tipo_cliente: e.target.value as any }))}
                label="Tipo de Cliente"
              >
                <MenuItem value="publico">Venta al Público</MenuItem>
                <MenuItem value="mayorista">Venta por Mayor</MenuItem>
                <MenuItem value="distribuidor">Venta a Distribuidor</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Cantidad (unidades)"
              type="number"
              value={editEgreso.cantidad || ''}
              onChange={(e) => setEditEgreso((prev: InventoryEgresoUpdate) => ({ ...prev, cantidad: e.target.value }))}
              required
              inputProps={{ min: 0, step: 1 }}
            />

            <TextField
              fullWidth
              label="Motivo del Egreso"
              value={editEgreso.motivo || ''}
              onChange={(e) => setEditEgreso((prev: InventoryEgresoUpdate) => ({ ...prev, motivo: e.target.value }))}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Referencia"
              value={editEgreso.referencia || ''}
              onChange={(e) => setEditEgreso((prev: InventoryEgresoUpdate) => ({ ...prev, referencia: e.target.value }))}
            />

            <Alert severity="warning">
              Si cambia la cantidad, el stock del inventario se ajustará automáticamente
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditingEgreso(null); setEditEgreso({}); }}>Cancelar</Button>
          <Button onClick={handleSaveEditEgreso} variant="contained" disabled={loading}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryManager;