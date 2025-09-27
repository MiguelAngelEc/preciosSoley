import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Remove,
  Search,
  ContentCopy
} from '@mui/icons-material';
import apiService from '../services/api';
import { Product, ProductCreate, ProductMaterialCreate, Material, CostosTotalesResponse } from '../types';

interface ProductManagerProps {
  materials: Material[];
}

const ProductManager: React.FC<ProductManagerProps> = ({ materials }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCosts, setTotalCosts] = useState<CostosTotalesResponse | null>(null);

  // Product creation state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductIvaPercentage, setNewProductIvaPercentage] = useState<number | null>(null);
  const [newProductMargenPublico, setNewProductMargenPublico] = useState<number>(0);
  const [newProductMargenMayorista, setNewProductMargenMayorista] = useState<number>(0);
  const [newProductMargenDistribuidor, setNewProductMargenDistribuidor] = useState<number>(0);
  const [newProductCostoEtiqueta, setNewProductCostoEtiqueta] = useState<number>(0);
  const [newProductCostoEnvase, setNewProductCostoEnvase] = useState<number>(0);
  const [newProductCostoCaja, setNewProductCostoCaja] = useState<number>(0);
  const [newProductCostoTransporte, setNewProductCostoTransporte] = useState<number>(0);
  const [newProductPesoEmpaque, setNewProductPesoEmpaque] = useState<number | null>(null);
  const [newProductMaterials, setNewProductMaterials] = useState<ProductMaterialCreate[]>([]);

  // Product editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductIvaPercentage, setEditProductIvaPercentage] = useState<number | null>(null);
  const [editProductMargenPublico, setEditProductMargenPublico] = useState<number>(0);
  const [editProductMargenMayorista, setEditProductMargenMayorista] = useState<number>(0);
  const [editProductMargenDistribuidor, setEditProductMargenDistribuidor] = useState<number>(0);
  const [editProductCostoEtiqueta, setEditProductCostoEtiqueta] = useState<number>(0);
  const [editProductCostoEnvase, setEditProductCostoEnvase] = useState<number>(0);
  const [editProductCostoCaja, setEditProductCostoCaja] = useState<number>(0);
  const [editProductCostoTransporte, setEditProductCostoTransporte] = useState<number>(0);
  const [editProductPesoEmpaque, setEditProductPesoEmpaque] = useState<number | null>(null);
  const [editProductMaterials, setEditProductMaterials] = useState<ProductMaterialCreate[]>([]);

  // Product detail modal state
  // Product duplicate state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatingProduct, setDuplicatingProduct] = useState<Product | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicatePesoEmpaque, setDuplicatePesoEmpaque] = useState<number | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchTotalCosts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProducts();
      setProducts(data);
      setFilteredProducts(data);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalCosts = async () => {
    try {
      const data = await apiService.calculateTotalCosts();
      setTotalCosts(data);
    } catch (err: any) {
      console.error('Error fetching total costs:', err);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (newProductMaterials.length === 0) {
      setError('Debe agregar al menos un material');
      return;
    }

    // Validate that all materials have valid quantities and materials selected
    for (const pm of newProductMaterials) {
      const cantidad = parseFloat(pm.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        setError('Todas las cantidades deben ser positivas');
        return;
      }
      if (!pm.material_id || pm.material_id === 0) {
        setError('Debe seleccionar un material para cada entrada');
        return;
      }
    }

    // Check for duplicate materials
    const materialIds = newProductMaterials.map(pm => pm.material_id);
    if (new Set(materialIds).size !== materialIds.length) {
      setError('No se permiten materiales duplicados en el mismo producto');
      return;
    }

    // Validate peso_empaque is selected
    if (!newProductPesoEmpaque) {
      setError('Debe seleccionar un peso del empaque');
      return;
    }

    try {
      setLoading(true);
      const productData: ProductCreate = {
        nombre: newProductName.trim(),
        iva_percentage: newProductIvaPercentage ?? undefined,
        margen_publico: newProductMargenPublico,
        margen_mayorista: newProductMargenMayorista,
        margen_distribuidor: newProductMargenDistribuidor,
        costo_etiqueta: newProductCostoEtiqueta,
        costo_envase: newProductCostoEnvase,
        costo_caja: newProductCostoCaja,
        costo_transporte: newProductCostoTransporte,
        peso_empaque: newProductPesoEmpaque ?? undefined,
        product_materials: newProductMaterials
      };

      await apiService.createProduct(productData);
      setShowCreateDialog(false);
      setNewProductName('');
      setNewProductIvaPercentage(null);
      setNewProductMargenPublico(0);
      setNewProductMargenMayorista(0);
      setNewProductMargenDistribuidor(0);
      setNewProductCostoEtiqueta(0);
      setNewProductCostoEnvase(0);
      setNewProductCostoCaja(0);
      setNewProductCostoTransporte(0);
      setNewProductPesoEmpaque(null);
      setNewProductMaterials([]);
      setError(null);
      setSuccess('Producto creado exitosamente');
      await fetchProducts();
      await fetchTotalCosts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProductName(product.nombre);
    setEditProductIvaPercentage(product.iva_percentage);
    setEditProductMargenPublico(product.margen_publico);
    setEditProductMargenMayorista(product.margen_mayorista);
    setEditProductMargenDistribuidor(product.margen_distribuidor);
    setEditProductCostoEtiqueta(parseFloat(product.costo_etiqueta));
    setEditProductCostoEnvase(parseFloat(product.costo_envase));
    setEditProductCostoCaja(parseFloat(product.costo_caja));
    setEditProductCostoTransporte(parseFloat(product.costo_transporte));
    setEditProductPesoEmpaque(product.peso_empaque ?? null);
    setEditProductMaterials(
      product.product_materials.map(pm => ({
        material_id: pm.material_id,
        cantidad: pm.cantidad
      }))
    );
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    if (!editProductName.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (editProductMaterials.length === 0) {
      setError('Debe tener al menos un material');
      return;
    }

    // Validate peso_empaque is selected
    if (!editProductPesoEmpaque) {
      setError('Debe seleccionar un peso del empaque');
      return;
    }

    // Validate that all materials have valid quantities and materials selected
    for (const pm of editProductMaterials) {
      const cantidad = parseFloat(pm.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        setError('Todas las cantidades deben ser positivas');
        return;
      }
      if (!pm.material_id || pm.material_id === 0) {
        setError('Debe seleccionar un material para cada entrada');
        return;
      }
    }

    try {
      setLoading(true);
      const productData: ProductCreate = {
        nombre: editProductName.trim(),
        iva_percentage: editProductIvaPercentage ?? undefined,
        margen_publico: editProductMargenPublico,
        margen_mayorista: editProductMargenMayorista,
        margen_distribuidor: editProductMargenDistribuidor,
        costo_etiqueta: editProductCostoEtiqueta,
        costo_envase: editProductCostoEnvase,
        costo_caja: editProductCostoCaja,
        costo_transporte: editProductCostoTransporte,
        peso_empaque: editProductPesoEmpaque ?? undefined,
        product_materials: editProductMaterials
      };

      await apiService.updateProduct(editingProduct.id, productData);
      setEditingProduct(null);
      setEditProductName('');
      setEditProductIvaPercentage(null);
      setEditProductMargenPublico(0);
      setEditProductMargenMayorista(0);
      setEditProductMargenDistribuidor(0);
      setEditProductCostoEtiqueta(0);
      setEditProductCostoEnvase(0);
      setEditProductCostoCaja(0);
      setEditProductCostoTransporte(0);
      setEditProductPesoEmpaque(null);
      setEditProductMaterials([]);
      setError(null);
      setSuccess('Producto actualizado exitosamente');
      await fetchProducts();
      await fetchTotalCosts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDuplicate = async () => {
    if (!duplicatingProduct) return;

    if (!duplicateName.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (!duplicatePesoEmpaque) {
      setError('Debe seleccionar un peso del empaque');
      return;
    }

    try {
      setLoading(true);
      await apiService.duplicateProduct(duplicatingProduct.id, {
        nombre: duplicateName.trim(),
        peso_empaque: duplicatePesoEmpaque
      });
      setShowDuplicateDialog(false);
      setDuplicatingProduct(null);
      setDuplicateName('');
      setDuplicatePesoEmpaque(null);
      setError(null);
      setSuccess('Producto duplicado exitosamente');
      await fetchProducts();
      await fetchTotalCosts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al duplicar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.deleteProduct(productId);
      setError(null);
      setSuccess('Producto eliminado exitosamente');
      await fetchProducts();
      await fetchTotalCosts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    setDuplicatingProduct(product);
    setDuplicateName(`${product.nombre} (Copia)`);
    setDuplicatePesoEmpaque(product.peso_empaque ?? null);
    setShowDuplicateDialog(true);
  };
  const addMaterialToNewProduct = () => {
    setNewProductMaterials([...newProductMaterials, { material_id: 0, cantidad: '0' }]);
  };

  const updateNewProductMaterial = (index: number, field: string, value: any) => {
    const updated = [...newProductMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setNewProductMaterials(updated);
  };

  const removeNewProductMaterial = (index: number) => {
    setNewProductMaterials(newProductMaterials.filter((_, i) => i !== index));
  };

  const addMaterialToEditProduct = () => {
    setEditProductMaterials([...editProductMaterials, { material_id: 0, cantidad: '0' }]);
  };

  const updateEditProductMaterial = (index: number, field: string, value: any) => {
    const updated = [...editProductMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setEditProductMaterials(updated);
  };

  const removeEditProductMaterial = (index: number) => {
    setEditProductMaterials(editProductMaterials.filter((_, i) => i !== index));
  };

  const calculateMaterialCost = (materialId: number | string, cantidad: string) => {
    if (!materialId || materialId === '' || !cantidad || cantidad === '') return 0;
    const material = materials.find(m => m.id === Number(materialId));
    if (!material) return 0;
    const precio = parseFloat(material.precio_unidad_pequena);
    const cant = parseFloat(cantidad);
    return isNaN(precio) || isNaN(cant) ? 0 : precio * cant;
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Gestión de Productos
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

      {/* Search and Product Count */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                placeholder="Buscar productos por nombre..."
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
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Productos
              </Typography>
              <Typography variant="h6">
                {totalCosts?.total_productos || products.length}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Create Product Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowCreateDialog(true)}
          disabled={loading}
        >
          Crear Nuevo Producto
        </Button>
      </Box>

      {/* Products Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell align="right"><strong>Costo Base</strong></TableCell>
              <TableCell align="right"><strong>Precio PVP</strong></TableCell>
              <TableCell align="right"><strong>PVP + IVA</strong></TableCell>
              <TableCell align="right"><strong>Precio PVM</strong></TableCell>
              <TableCell align="right"><strong>PVM + IVA</strong></TableCell>
              <TableCell align="right"><strong>Precio PVD</strong></TableCell>
              <TableCell align="right"><strong>PVD + IVA</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No hay productos registrados
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.nombre} ({product.peso_empaque}g)</TableCell>
                  <TableCell align="right">
                    ${parseFloat(product.costo_paquete).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(product.precio_publico_paquete).toFixed(2)} ({product.margen_publico}%)
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(product.precio_publico_con_iva_paquete).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(product.precio_mayorista_paquete).toFixed(2)} ({product.margen_mayorista}%)
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(product.precio_mayorista_con_iva_paquete).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(product.precio_distribuidor_paquete).toFixed(2)} ({product.margen_distribuidor}%)
                  </TableCell>
                  <TableCell align="right">
                    ${parseFloat(product.precio_distribuidor_con_iva_paquete).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => setDetailProduct(product)}
                      color="info"
                      size="small"
                      title="Ver detalles"
                    >
                      <Search />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEditProduct(product)}
                      color="primary"
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDuplicateProduct(product)}
                      color="secondary"
                      size="small"
                      title="Duplicar producto"
                    >
                      <ContentCopy />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteProduct(product.id)}
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

      {/* Create Product Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Producto</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre del Producto"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="Porcentaje de IVA"
            type="number"
            value={newProductIvaPercentage ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                setNewProductIvaPercentage(null);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                  setNewProductIvaPercentage(value);
                }
              }
            }}
            onBlur={(e) => {
              const value = parseFloat(e.target.value);
              if (isNaN(value) || value < 0 || value > 100) {
                setNewProductIvaPercentage(21); // Default to 21% if invalid
              }
            }}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            sx={{ mb: 2 }}
            helperText="Ingrese el porcentaje de IVA (ej. 21 para 21%). Si deja vacío, se usará 21% por defecto."
           />

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Márgenes de Ganancia
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Margen Público (%)"
               type="number"
               value={newProductMargenPublico === 0 ? '' : newProductMargenPublico}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setNewProductMargenPublico(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0 && value < 100) {
                     setNewProductMargenPublico(value);
                   }
                 }
               }}
               inputProps={{ min: 0, max: 99.99, step: 0.01 }}
               helperText="Margen para ventas al público"
             />
             <TextField
               fullWidth
               label="Margen Mayorista (%)"
               type="number"
               value={newProductMargenMayorista === 0 ? '' : newProductMargenMayorista}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setNewProductMargenMayorista(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0 && value < 100) {
                     setNewProductMargenMayorista(value);
                   }
                 }
               }}
               inputProps={{ min: 0, max: 99.99, step: 0.01 }}
               helperText="Margen para ventas mayoristas"
             />
             <TextField
               fullWidth
               label="Margen Distribuidor (%)"
               type="number"
               value={newProductMargenDistribuidor === 0 ? '' : newProductMargenDistribuidor}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setNewProductMargenDistribuidor(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0 && value < 100) {
                     setNewProductMargenDistribuidor(value);
                   }
                 }
               }}
               inputProps={{ min: 0, max: 99.99, step: 0.01 }}
               helperText="Margen para ventas a distribuidores"
             />
           </Box>

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Costos Adicionales
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Costo Etiqueta"
               type="number"
               value={newProductCostoEtiqueta === 0 ? '' : newProductCostoEtiqueta}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setNewProductCostoEtiqueta(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setNewProductCostoEtiqueta(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo de la etiqueta (opcional)"
             />
             <TextField
               fullWidth
               label="Costo Envase"
               type="number"
               value={newProductCostoEnvase === 0 ? '' : newProductCostoEnvase}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setNewProductCostoEnvase(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setNewProductCostoEnvase(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo del envase (opcional)"
             />
             <TextField
               fullWidth
               label="Costo Caja"
               type="number"
               value={newProductCostoCaja === 0 ? '' : newProductCostoCaja}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setNewProductCostoCaja(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setNewProductCostoCaja(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo de la caja (opcional)"
             />
             <TextField
               fullWidth
               label="Costo Transporte"
               type="number"
               value={newProductCostoTransporte === 0 ? '' : newProductCostoTransporte}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setNewProductCostoTransporte(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setNewProductCostoTransporte(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo de transporte (requerido)"
               required
             />
           </Box>


           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Peso del Empaque
           </Typography>

           <Box sx={{ mb: 2 }}>
             <FormControl fullWidth required>
               <Select
                 value={newProductPesoEmpaque || ''}
                 onChange={(e) => setNewProductPesoEmpaque(Number(e.target.value) || null)}
                 displayEmpty
               >
                 <MenuItem value="">
                   <em>Seleccionar peso del empaque</em>
                 </MenuItem>
                 <MenuItem value={100}>100g - Envase Pequeño</MenuItem>
                 <MenuItem value={500}>500g - Envase Mediano</MenuItem>
                 <MenuItem value={1000}>1000g - Envase Grande (1kg)</MenuItem>
                 <MenuItem value={3785}>3785g - Galón</MenuItem>
                 <MenuItem value={20000}>20000g - Caneca (20kg)</MenuItem>
               </Select>
             </FormControl>
           </Box>

           <Typography variant="h6" gutterBottom>
             Materiales
           </Typography>

          {newProductMaterials.map((pm, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FormControl sx={{ minWidth: 200, mr: 2 }}>
                <Select
                  value={pm.material_id || ''}
                  onChange={(e) => updateNewProductMaterial(index, 'material_id', Number(e.target.value))}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Seleccionar Material</em>
                  </MenuItem>
                  {materials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Cantidad (g/ml)"
                type="number"
                value={pm.cantidad === '0' ? '' : pm.cantidad}
                placeholder="0"
                onChange={(e) => updateNewProductMaterial(index, 'cantidad', e.target.value || '0')}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ mr: 2, width: 150 }}
              />

              <Typography sx={{ mr: 2 }}>
                Costo: ${pm.material_id && pm.cantidad ? calculateMaterialCost(pm.material_id, pm.cantidad).toFixed(2) : '0.00'}
              </Typography>

              <IconButton onClick={() => removeNewProductMaterial(index)} color="error">
                <Remove />
              </IconButton>
            </Box>
          ))}

          <Button onClick={addMaterialToNewProduct} startIcon={<Add />} variant="outlined">
            Agregar Material
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateProduct} variant="contained" disabled={loading}>
            Crear Producto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onClose={() => setEditingProduct(null)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Producto</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre del Producto"
            value={editProductName}
            onChange={(e) => setEditProductName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="Porcentaje de IVA"
            type="number"
            value={editProductIvaPercentage ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                setEditProductIvaPercentage(null);
              } else {
                const value = parseFloat(inputValue);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                  setEditProductIvaPercentage(value);
                }
              }
            }}
            onBlur={(e) => {
              const value = parseFloat(e.target.value);
              if (isNaN(value) || value < 0 || value > 100) {
                setEditProductIvaPercentage(21); // Default to 21% if invalid
              }
            }}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            sx={{ mb: 2 }}
            helperText="Ingrese el porcentaje de IVA (ej. 21 para 21%). Si deja vacío, se usará 21% por defecto."
           />

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Márgenes de Ganancia
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Margen Público (%)"
               type="number"
               value={editProductMargenPublico === 0 ? '' : editProductMargenPublico}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setEditProductMargenPublico(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0 && value < 100) {
                     setEditProductMargenPublico(value);
                   }
                 }
               }}
               inputProps={{ min: 0, max: 99.99, step: 0.01 }}
               helperText="Margen para ventas al público"
             />
             <TextField
               fullWidth
               label="Margen Mayorista (%)"
               type="number"
               value={editProductMargenMayorista === 0 ? '' : editProductMargenMayorista}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setEditProductMargenMayorista(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0 && value < 100) {
                     setEditProductMargenMayorista(value);
                   }
                 }
               }}
               inputProps={{ min: 0, max: 99.99, step: 0.01 }}
               helperText="Margen para ventas mayoristas"
             />
             <TextField
               fullWidth
               label="Margen Distribuidor (%)"
               type="number"
               value={editProductMargenDistribuidor === 0 ? '' : editProductMargenDistribuidor}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setEditProductMargenDistribuidor(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0 && value < 100) {
                     setEditProductMargenDistribuidor(value);
                   }
                 }
               }}
               inputProps={{ min: 0, max: 99.99, step: 0.01 }}
               helperText="Margen para ventas a distribuidores"
             />
           </Box>

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Costos Adicionales
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Costo Etiqueta"
               type="number"
               value={editProductCostoEtiqueta === 0 ? '' : editProductCostoEtiqueta}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setEditProductCostoEtiqueta(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setEditProductCostoEtiqueta(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo de la etiqueta (opcional)"
             />
             <TextField
               fullWidth
               label="Costo Envase"
               type="number"
               value={editProductCostoEnvase === 0 ? '' : editProductCostoEnvase}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setEditProductCostoEnvase(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setEditProductCostoEnvase(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo del envase (opcional)"
             />
             <TextField
               fullWidth
               label="Costo Caja"
               type="number"
               value={editProductCostoCaja === 0 ? '' : editProductCostoCaja}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setEditProductCostoCaja(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setEditProductCostoCaja(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo de la caja (opcional)"
             />
             <TextField
               fullWidth
               label="Costo Transporte"
               type="number"
               value={editProductCostoTransporte === 0 ? '' : editProductCostoTransporte}
               placeholder="0"
               onChange={(e) => {
                 const inputValue = e.target.value;
                 if (inputValue === '') {
                   setEditProductCostoTransporte(0);
                 } else {
                   const value = parseFloat(inputValue);
                   if (!isNaN(value) && value >= 0) {
                     setEditProductCostoTransporte(value);
                   }
                 }
               }}
               inputProps={{ min: 0, step: 0.01 }}
               helperText="Costo de transporte (requerido)"
               required
             />
           </Box>


           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Peso del Empaque
           </Typography>

           <Box sx={{ mb: 2 }}>
             <FormControl fullWidth required>
               <Select
                 value={editProductPesoEmpaque || ''}
                 onChange={(e) => setEditProductPesoEmpaque(Number(e.target.value) || null)}
                 displayEmpty
               >
                 <MenuItem value="">
                   <em>Seleccionar peso del empaque</em>
                 </MenuItem>
                 <MenuItem value={100}>100g - Envase Pequeño</MenuItem>
                 <MenuItem value={500}>500g - Envase Mediano</MenuItem>
                 <MenuItem value={1000}>1000g - Envase Grande (1kg)</MenuItem>
                 <MenuItem value={3785}>3785g - Galón</MenuItem>
                 <MenuItem value={20000}>20000g - Caneca (20kg)</MenuItem>
               </Select>
             </FormControl>
           </Box>

           <Typography variant="h6" gutterBottom>
             Materiales
           </Typography>

          {editProductMaterials.map((pm, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FormControl sx={{ minWidth: 200, mr: 2 }}>
                <Select
                  value={pm.material_id || ''}
                  onChange={(e) => updateEditProductMaterial(index, 'material_id', Number(e.target.value))}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Seleccionar Material</em>
                  </MenuItem>
                  {materials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Cantidad (g/ml)"
                type="number"
                value={pm.cantidad === '0' ? '' : pm.cantidad}
                placeholder="0"
                onChange={(e) => updateEditProductMaterial(index, 'cantidad', e.target.value || '0')}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ mr: 2, width: 150 }}
              />

              <Typography sx={{ mr: 2 }}>
                Costo: ${pm.material_id && pm.cantidad ? calculateMaterialCost(pm.material_id, pm.cantidad).toFixed(2) : '0.00'}
              </Typography>

              <IconButton onClick={() => removeEditProductMaterial(index)} color="error">
                <Remove />
              </IconButton>
            </Box>
          ))}

          <Button onClick={addMaterialToEditProduct} startIcon={<Add />} variant="outlined">
            Agregar Material
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProduct(null)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={loading}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Product Dialog */}
      <Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Duplicar Producto: {duplicatingProduct?.nombre}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nuevo Nombre del Producto"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            required
          />

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Peso del Empaque
          </Typography>

          <FormControl fullWidth required sx={{ mb: 2 }}>
            <Select
              value={duplicatePesoEmpaque || ''}
              onChange={(e) => setDuplicatePesoEmpaque(Number(e.target.value) || null)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Seleccionar peso del empaque</em>
              </MenuItem>
              <MenuItem value={100}>100g - Envase Pequeño</MenuItem>
              <MenuItem value={500}>500g - Envase Mediano</MenuItem>
              <MenuItem value={1000}>1000g - Envase Grande (1kg)</MenuItem>
              <MenuItem value={3785}>3785g - Galón</MenuItem>
              <MenuItem value={20000}>20000g - Caneca (20kg)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            Se duplicarán todos los materiales y configuraciones del producto original, solo cambiando el nombre y el peso del empaque.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicateDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveDuplicate} variant="contained" disabled={loading}>
            Duplicar Producto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles del Producto: {detailProduct?.nombre}
        </DialogTitle>
        <DialogContent>
          {detailProduct && (
            <Box sx={{ pt: 1 }}>
              {/* Product Header Section */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
                    {detailProduct.nombre} ({detailProduct.peso_empaque || 0}g)
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    <Typography variant="body1">
                      <strong>Costo Base:</strong> ${parseFloat(detailProduct.costo_paquete).toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>IVA Aplicable:</strong> {detailProduct.iva_percentage}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Pricing Summary Table */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Resumen de Precios
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Tipo de Cliente</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Margen</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio con Margen</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>IVA ($)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio Final</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>Público</TableCell>
                          <TableCell align="right">{detailProduct.margen_publico}%</TableCell>
                          <TableCell align="right">${parseFloat(detailProduct.precio_publico_paquete).toFixed(2)}</TableCell>
                          <TableCell align="right">${(parseFloat(detailProduct.precio_publico_con_iva_paquete) - parseFloat(detailProduct.precio_publico_paquete)).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>${parseFloat(detailProduct.precio_publico_con_iva_paquete).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>Mayorista</TableCell>
                          <TableCell align="right">{detailProduct.margen_mayorista}%</TableCell>
                          <TableCell align="right">${parseFloat(detailProduct.precio_mayorista_paquete).toFixed(2)}</TableCell>
                          <TableCell align="right">${(parseFloat(detailProduct.precio_mayorista_con_iva_paquete) - parseFloat(detailProduct.precio_mayorista_paquete)).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>${parseFloat(detailProduct.precio_mayorista_con_iva_paquete).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'medium' }}>Distribuidor</TableCell>
                          <TableCell align="right">{detailProduct.margen_distribuidor}%</TableCell>
                          <TableCell align="right">${parseFloat(detailProduct.precio_distribuidor_paquete).toFixed(2)}</TableCell>
                          <TableCell align="right">${(parseFloat(detailProduct.precio_distribuidor_con_iva_paquete) - parseFloat(detailProduct.precio_distribuidor_paquete)).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>${parseFloat(detailProduct.precio_distribuidor_con_iva_paquete).toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Materials Section - Keep Exactly As Is */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Desglose de Materiales
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {detailProduct.product_materials.map((pm, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          bgcolor: 'grey.50',
                          borderRadius: 1
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {pm.material.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cantidad: {parseFloat(pm.cantidad).toFixed(2)} {pm.material.unidad_base === 'kg' ? 'kg' : 'litros'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            Costo unitario: ${Number(parseFloat(pm.material.precio_unidad_pequena).toFixed(6))}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            Subtotal: ${Number(parseFloat(pm.costo).toFixed(2))}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" align="right">
                      Costo Total: ${parseFloat(detailProduct.costo_total).toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Cost Summary Section */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Resumen de Costos
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Costo Total de Materiales
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        ${parseFloat(detailProduct.costo_total).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Peso del Empaque
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {detailProduct.peso_empaque || 0}g
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Costo por Gramo
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {detailProduct.peso_empaque ?
                          `$${(parseFloat(detailProduct.costo_total) / detailProduct.peso_empaque!).toFixed(4)}` :
                          'N/A'
                        }
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailProduct(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductManager;