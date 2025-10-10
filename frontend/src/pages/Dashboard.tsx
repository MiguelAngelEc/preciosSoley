import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccountCircle,
  Edit,
  Delete,
  Check,
  Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Material, MaterialCreate, Product } from '../types';
import ProductManager from '../components/ProductManager';
import ProformaManager from '../components/ProformaManager';
import InventoryManager from '../components/InventoryManager';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tabValue, setTabValue] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    precio_base: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    precio_base: ''
  });

  useEffect(() => {
    fetchMaterials();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    if (productsError) {
      const timer = setTimeout(() => {
        setProductsError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [productsError]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMaterials();
      setMaterials(data);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar los materiales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiService.getProducts();
      setProducts(data);
      setProductsError(null);
    } catch (err: any) {
      setProductsError('Error al cargar los productos');
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.precio_base.trim()) {
      setError('Por favor complete todos los campos');
      setSuccess(null);
      return;
    }

    const precioBase = parseFloat(formData.precio_base);
    if (isNaN(precioBase) || precioBase <= 0) {
      setError('El precio debe ser un número positivo');
      setSuccess(null);
      return;
    }

    try {
      setLoading(true);
      const newMaterial: MaterialCreate = {
        nombre: formData.nombre.trim(),
        precio_base: precioBase,
        unidad_base: 'kg'
      };

      await apiService.createMaterial(newMaterial);
      setFormData({ nombre: '', precio_base: '' });
      setError(null);
      setSuccess('Material agregado exitosamente');
      await fetchMaterials(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el material');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setEditFormData({
      nombre: material.nombre,
      precio_base: material.precio_base
    });
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ nombre: '', precio_base: '' });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.nombre.trim() || !editFormData.precio_base.trim()) {
      setError('Por favor complete todos los campos');
      setSuccess(null);
      return;
    }

    const precioBase = parseFloat(editFormData.precio_base);
    if (isNaN(precioBase) || precioBase <= 0) {
      setError('El precio debe ser un número positivo');
      setSuccess(null);
      return;
    }

    const originalMaterial = materials.find(m => m.id === editingId);
    if (!originalMaterial) return;

    try {
      setLoading(true);
      await apiService.updateMaterial(editingId!, {
        nombre: editFormData.nombre.trim(),
        precio_base: precioBase
      });
      setEditingId(null);
      setEditFormData({ nombre: '', precio_base: '' });
      setError(null);
      setSuccess('Material actualizado exitosamente');
      await fetchMaterials(); // Refresh to get updated data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar el material');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este material?')) {
      return;
    }
    setSuccess(null);
    setError(null);

    try {
      setLoading(true);
      await apiService.deleteMaterial(id);
      setSuccess('Material eliminado exitosamente');
      await fetchMaterials(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar el material');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Soley Jaboneria
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.username}
          </Typography>
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Precios Soley - Gestión
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gestione materiales y productos con sus respectivos costos.
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="management tabs">
            <Tab label="Materiales" />
            <Tab label="Productos" />
            <Tab label="Inventario" />
            <Tab label="Proformas" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <>
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

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="Nombre del Material"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="Precio por Kilogramo"
                name="precio_base"
                type="number"
                value={formData.precio_base}
                onChange={handleInputChange}
                inputProps={{ min: "0", step: "0.01" }}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
                sx={{ height: '56px' }}
              >
                {loading ? 'Agregando...' : 'Agregar Material'}
              </Button>
            </Box>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Material</strong></TableCell>
                <TableCell align="right"><strong>Precio por Kilogramo</strong></TableCell>
                <TableCell align="right"><strong>Precio por Unidad Pequeña</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay materiales registrados
                  </TableCell>
                </TableRow>
              ) : (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    {editingId === material.id ? (
                      <>
                        <TableCell>
                          <TextField
                            size="small"
                            name="nombre"
                            value={editFormData.nombre}
                            onChange={handleEditInputChange}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            name="precio_base"
                            type="number"
                            value={editFormData.precio_base}
                            onChange={handleEditInputChange}
                            inputProps={{ min: "0", step: "0.01" }}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="right">${parseFloat(editFormData.precio_base || '0').toFixed(6)}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={handleSaveEdit} color="primary" size="small">
                            <Check />
                          </IconButton>
                          <IconButton onClick={handleCancelEdit} color="secondary" size="small">
                            <Close />
                          </IconButton>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{material.nombre}</TableCell>
                        <TableCell align="right">${parseFloat(material.precio_base).toFixed(2)}</TableCell>
                        <TableCell align="right">${parseFloat(material.precio_unidad_pequena).toFixed(6)}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleEdit(material)} color="primary" size="small">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(material.id)} color="error" size="small">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
          </>
        )}

        {tabValue === 1 && (
          <>
            {productsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {productsError}
              </Alert>
            )}
            <ProductManager materials={materials} onProductsChange={fetchProducts} />
          </>
        )}

        {tabValue === 2 && (
          <InventoryManager products={products} />
        )}

        {tabValue === 3 && (
          <ProformaManager products={products} />
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;