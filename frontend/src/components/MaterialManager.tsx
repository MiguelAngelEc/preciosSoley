import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Edit,
  Delete,
  Check,
  Close
} from '@mui/icons-material';
import { useMaterials } from '../hooks/useMaterials';
import { Material } from '../types';
import useDecimalInput from '../hooks/useDecimalInput';

const MaterialManager: React.FC = () => {
  const { materials, loading, error, success, createMaterial, updateMaterial, deleteMaterial } = useMaterials();

  const [formData, setFormData] = useState({
    nombre: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: ''
  });

  const precioBaseInput = useDecimalInput('', { min: 0, step: 0.01, required: true });
  const editPrecioBaseInput = useDecimalInput('', { min: 0, step: 0.01, required: true });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !precioBaseInput.isValid) {
      return;
    }

    await createMaterial({
      nombre: formData.nombre.trim(),
      precio_base: precioBaseInput.numericValue,
      unidad_base: 'kg',
      cantidades_deseadas: []
    });
    setFormData({ nombre: '' });
    precioBaseInput.reset(0);
  };

  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setEditFormData({
      nombre: material.nombre
    });
    editPrecioBaseInput.reset(parseFloat(material.precio_base));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ nombre: '' });
    editPrecioBaseInput.reset(0);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.nombre.trim() || !editPrecioBaseInput.isValid) {
      return;
    }

    await updateMaterial(editingId!, {
      nombre: editFormData.nombre.trim(),
      precio_base: editPrecioBaseInput.numericValue,
      unidad_base: 'kg'
    });
    setEditingId(null);
    setEditFormData({ nombre: '' });
    editPrecioBaseInput.reset(0);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este material?')) {
      return;
    }
    await deleteMaterial(id);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Gestión de Materiales
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
              value={precioBaseInput.value}
              onChange={precioBaseInput.handleChange}
              onBlur={precioBaseInput.handleBlur}
              error={!!precioBaseInput.error}
              helperText={precioBaseInput.error}
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
                          value={editPrecioBaseInput.value}
                          onChange={editPrecioBaseInput.handleChange}
                          onBlur={editPrecioBaseInput.handleBlur}
                          error={!!editPrecioBaseInput.error}
                          helperText={editPrecioBaseInput.error}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">${editPrecioBaseInput.numericValue.toFixed(6)}</TableCell>
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
    </Box>
  );
};

export default MaterialManager;