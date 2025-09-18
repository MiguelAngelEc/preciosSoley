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
  Alert
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
import { Material, MaterialCreate } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMaterials();
      setMaterials(data);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
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
      setSuccess('Producto agregado exitosamente');
      await fetchMaterials(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el producto');
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

    // Optimistically update the UI
    const updatedMaterials = materials.map(m =>
      m.id === editingId
        ? { ...m, nombre: editFormData.nombre.trim(), precio_base: precioBase.toString() }
        : m
    );
    setMaterials(updatedMaterials);
    setEditingId(null);
    setEditFormData({ nombre: '', precio_base: '' });

    try {
      await apiService.updateMaterial(editingId!, {
        nombre: editFormData.nombre.trim(),
        precio_base: precioBase
      });
      setError(null);
      setSuccess('Producto actualizado exitosamente');
      await fetchMaterials(); // Refresh to get updated data
    } catch (err: any) {
      // Revert on error
      setMaterials(materials);
      setError(err.response?.data?.detail || 'Error al actualizar el producto');
      setSuccess(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) {
      return;
    }
    setSuccess(null);

    const originalMaterials = [...materials];
    setMaterials(materials.filter(m => m.id !== id));

    try {
      await apiService.deleteMaterial(id);
      setError(null);
      setSuccess('Producto eliminado exitosamente');
    } catch (err: any) {
      // Revert on error
      setMaterials(originalMaterials);
      setError(err.response?.data?.detail || 'Error al eliminar el producto');
      setSuccess(null);
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
            Precios Soley
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
          Gestión de Productos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Agregue productos y vea sus precios por kilogramo y gramo.
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

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="Precio por Kilogramo ($)"
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
                {loading ? 'Agregando...' : 'Agregar Producto'}
              </Button>
            </Box>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Producto</strong></TableCell>
                <TableCell align="right"><strong>Precio por Kilogramo</strong></TableCell>
                <TableCell align="right"><strong>Precio por Gramo</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay productos registrados
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
                        <TableCell align="right">${parseFloat(editFormData.precio_base || '0').toFixed(4)}</TableCell>
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
                        <TableCell align="right">${parseFloat(material.precio_unidad_pequena).toFixed(4)}</TableCell>
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
      </Container>
    </Box>
  );
};

export default Dashboard;