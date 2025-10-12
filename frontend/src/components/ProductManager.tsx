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
import useDecimalInput from '../hooks/useDecimalInput';

interface ProductManagerProps {
  materials: Material[];
  onProductsChange?: () => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ materials, onProductsChange }) => {
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
  const [newProductCostoEtiqueta, setNewProductCostoEtiqueta] = useState<string>('0');
  const [newProductCostoEnvase, setNewProductCostoEnvase] = useState<string>('0');
  const [newProductCostoCaja, setNewProductCostoCaja] = useState<string>('0');
  const [newProductCostoTransporte, setNewProductCostoTransporte] = useState<string>('0');
  const [newProductCostoManoObra, setNewProductCostoManoObra] = useState<string>('0');
  const [newProductCostoEnergia, setNewProductCostoEnergia] = useState<string>('0');
  const [newProductCostoDepreciacion, setNewProductCostoDepreciacion] = useState<string>('0');
  const [newProductCostoMantenimiento, setNewProductCostoMantenimiento] = useState<string>('0');
  const [newProductCostoAdministrativo, setNewProductCostoAdministrativo] = useState<string>('0');
  const [newProductCostoComercializacion, setNewProductCostoComercializacion] = useState<string>('0');
  const [newProductCostoFinanciero, setNewProductCostoFinanciero] = useState<string>('0');
  const [newProductPesoEmpaque, setNewProductPesoEmpaque] = useState<number | null>(null);
  const [newProductMaterials, setNewProductMaterials] = useState<ProductMaterialCreate[]>([]);

  // Decimal input hooks for create
  const ivaInput = useDecimalInput(newProductIvaPercentage, { min: 0, max: 100, step: 0.01 });
  const margenPublicoInput = useDecimalInput(newProductMargenPublico, { min: 0, max: 99.99, step: 0.01 });
  const margenMayoristaInput = useDecimalInput(newProductMargenMayorista, { min: 0, max: 99.99, step: 0.01 });
  const margenDistribuidorInput = useDecimalInput(newProductMargenDistribuidor, { min: 0, max: 99.99, step: 0.01 });
  const costoEtiquetaInput = useDecimalInput(newProductCostoEtiqueta, { min: 0, step: 0.01 });
  const costoEnvaseInput = useDecimalInput(newProductCostoEnvase, { min: 0, step: 0.01 });
  const costoCajaInput = useDecimalInput(newProductCostoCaja, { min: 0, step: 0.01 });
  const costoTransporteInput = useDecimalInput(newProductCostoTransporte, { min: 0, step: 0.01, required: true });
  const costoManoObraInput = useDecimalInput(newProductCostoManoObra, { min: 0, step: 0.01 });
  const costoEnergiaInput = useDecimalInput(newProductCostoEnergia, { min: 0, step: 0.01 });
  const costoDepreciacionInput = useDecimalInput(newProductCostoDepreciacion, { min: 0, step: 0.01 });
  const costoMantenimientoInput = useDecimalInput(newProductCostoMantenimiento, { min: 0, step: 0.01 });
  const costoAdministrativoInput = useDecimalInput(newProductCostoAdministrativo, { min: 0, step: 0.01 });
  const costoComercializacionInput = useDecimalInput(newProductCostoComercializacion, { min: 0, step: 0.01 });
  const costoFinancieroInput = useDecimalInput(newProductCostoFinanciero, { min: 0, step: 0.01 });

  // Product editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductIvaPercentage, setEditProductIvaPercentage] = useState<number | null>(null);
  const [editProductMargenPublico, setEditProductMargenPublico] = useState<number>(0);
  const [editProductMargenMayorista, setEditProductMargenMayorista] = useState<number>(0);
  const [editProductMargenDistribuidor, setEditProductMargenDistribuidor] = useState<number>(0);
  const [editProductCostoEtiqueta, setEditProductCostoEtiqueta] = useState<string>('0');
  const [editProductCostoEnvase, setEditProductCostoEnvase] = useState<string>('0');
  const [editProductCostoCaja, setEditProductCostoCaja] = useState<string>('0');
  const [editProductCostoTransporte, setEditProductCostoTransporte] = useState<string>('0');
  const [editProductCostoManoObra, setEditProductCostoManoObra] = useState<string>('0');
  const [editProductCostoEnergia, setEditProductCostoEnergia] = useState<string>('0');
  const [editProductCostoDepreciacion, setEditProductCostoDepreciacion] = useState<string>('0');
  const [editProductCostoMantenimiento, setEditProductCostoMantenimiento] = useState<string>('0');
  const [editProductCostoAdministrativo, setEditProductCostoAdministrativo] = useState<string>('0');
  const [editProductCostoComercializacion, setEditProductCostoComercializacion] = useState<string>('0');
  const [editProductCostoFinanciero, setEditProductCostoFinanciero] = useState<string>('0');
  const [editProductPesoEmpaque, setEditProductPesoEmpaque] = useState<number | null>(null);
  const [editProductMaterials, setEditProductMaterials] = useState<ProductMaterialCreate[]>([]);

  // Decimal input hooks for edit
  const editIvaInput = useDecimalInput(editProductIvaPercentage, { min: 0, max: 100, step: 0.01 });
  const editMargenPublicoInput = useDecimalInput(editProductMargenPublico, { min: 0, max: 99.99, step: 0.01 });
  const editMargenMayoristaInput = useDecimalInput(editProductMargenMayorista, { min: 0, max: 99.99, step: 0.01 });
  const editMargenDistribuidorInput = useDecimalInput(editProductMargenDistribuidor, { min: 0, max: 99.99, step: 0.01 });
  const editCostoEtiquetaInput = useDecimalInput(editProductCostoEtiqueta, { min: 0, step: 0.01 });
  const editCostoEnvaseInput = useDecimalInput(editProductCostoEnvase, { min: 0, step: 0.01 });
  const editCostoCajaInput = useDecimalInput(editProductCostoCaja, { min: 0, step: 0.01 });
  const editCostoTransporteInput = useDecimalInput(editProductCostoTransporte, { min: 0, step: 0.01, required: true });
  const editCostoManoObraInput = useDecimalInput(editProductCostoManoObra, { min: 0, step: 0.01 });
  const editCostoEnergiaInput = useDecimalInput(editProductCostoEnergia, { min: 0, step: 0.01 });
  const editCostoDepreciacionInput = useDecimalInput(editProductCostoDepreciacion, { min: 0, step: 0.01 });
  const editCostoMantenimientoInput = useDecimalInput(editProductCostoMantenimiento, { min: 0, step: 0.01 });
  const editCostoAdministrativoInput = useDecimalInput(editProductCostoAdministrativo, { min: 0, step: 0.01 });
  const editCostoComercializacionInput = useDecimalInput(editProductCostoComercializacion, { min: 0, step: 0.01 });
  const editCostoFinancieroInput = useDecimalInput(editProductCostoFinanciero, { min: 0, step: 0.01 });

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
        iva_percentage: ivaInput.numericValue || undefined,
        margen_publico: margenPublicoInput.numericValue,
        margen_mayorista: margenMayoristaInput.numericValue,
        margen_distribuidor: margenDistribuidorInput.numericValue,
        costo_etiqueta: costoEtiquetaInput.numericValue,
        costo_envase: costoEnvaseInput.numericValue,
        costo_caja: costoCajaInput.numericValue,
        costo_transporte: costoTransporteInput.numericValue,
        costo_mano_obra: costoManoObraInput.numericValue,
        costo_energia: costoEnergiaInput.numericValue,
        costo_depreciacion: costoDepreciacionInput.numericValue,
        costo_mantenimiento: costoMantenimientoInput.numericValue,
        costo_administrativo: costoAdministrativoInput.numericValue,
        costo_comercializacion: costoComercializacionInput.numericValue,
        costo_financiero: costoFinancieroInput.numericValue,
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
      setNewProductCostoEtiqueta('0');
      setNewProductCostoEnvase('0');
      setNewProductCostoCaja('0');
      setNewProductCostoTransporte('0');
      setNewProductCostoManoObra('0');
      setNewProductCostoEnergia('0');
      setNewProductCostoDepreciacion('0');
      setNewProductCostoMantenimiento('0');
      setNewProductCostoAdministrativo('0');
      setNewProductCostoComercializacion('0');
      setNewProductCostoFinanciero('0');
      setNewProductPesoEmpaque(null);
      setNewProductMaterials([]);
      // Reset hooks
      ivaInput.reset(0);
      margenPublicoInput.reset(0);
      margenMayoristaInput.reset(0);
      margenDistribuidorInput.reset(0);
      costoEtiquetaInput.reset(0);
      costoEnvaseInput.reset(0);
      costoCajaInput.reset(0);
      costoTransporteInput.reset(0);
      costoManoObraInput.reset(0);
      costoEnergiaInput.reset(0);
      costoDepreciacionInput.reset(0);
      costoMantenimientoInput.reset(0);
      costoAdministrativoInput.reset(0);
      costoComercializacionInput.reset(0);
      costoFinancieroInput.reset(0);
      setError(null);
      setSuccess('Producto creado exitosamente');
      await fetchProducts();
      await fetchTotalCosts();
      // Notify parent component to refresh products
      if (onProductsChange) {
        await onProductsChange();
      }
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
    setEditProductCostoEtiqueta(product.costo_etiqueta.toString());
    setEditProductCostoEnvase(product.costo_envase.toString());
    setEditProductCostoCaja(product.costo_caja.toString());
    setEditProductCostoTransporte(product.costo_transporte.toString());
    setEditProductCostoManoObra(product.costo_mano_obra.toString());
    setEditProductCostoEnergia(product.costo_energia.toString());
    setEditProductCostoDepreciacion(product.costo_depreciacion.toString());
    setEditProductCostoMantenimiento(product.costo_mantenimiento.toString());
    setEditProductCostoAdministrativo(product.costo_administrativo.toString());
    setEditProductCostoComercializacion(product.costo_comercializacion.toString());
    setEditProductCostoFinanciero(product.costo_financiero.toString());
    setEditProductPesoEmpaque(product.peso_empaque ?? null);
    setEditProductMaterials(
      product.product_materials.map(pm => ({
        material_id: pm.material_id,
        cantidad: pm.cantidad
      }))
    );
    // Reset edit hooks with product values
    editIvaInput.reset(product.iva_percentage || 0);
    editMargenPublicoInput.reset(product.margen_publico);
    editMargenMayoristaInput.reset(product.margen_mayorista);
    editMargenDistribuidorInput.reset(product.margen_distribuidor);
    editCostoEtiquetaInput.reset(parseFloat(product.costo_etiqueta));
    editCostoEnvaseInput.reset(parseFloat(product.costo_envase));
    editCostoCajaInput.reset(parseFloat(product.costo_caja));
    editCostoTransporteInput.reset(parseFloat(product.costo_transporte));
    editCostoManoObraInput.reset(parseFloat(product.costo_mano_obra));
    editCostoEnergiaInput.reset(parseFloat(product.costo_energia));
    editCostoDepreciacionInput.reset(parseFloat(product.costo_depreciacion));
    editCostoMantenimientoInput.reset(parseFloat(product.costo_mantenimiento));
    editCostoAdministrativoInput.reset(parseFloat(product.costo_administrativo));
    editCostoComercializacionInput.reset(parseFloat(product.costo_comercializacion));
    editCostoFinancieroInput.reset(parseFloat(product.costo_financiero));
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
        iva_percentage: editIvaInput.numericValue || undefined,
        margen_publico: editMargenPublicoInput.numericValue,
        margen_mayorista: editMargenMayoristaInput.numericValue,
        margen_distribuidor: editMargenDistribuidorInput.numericValue,
        costo_etiqueta: editCostoEtiquetaInput.numericValue,
        costo_envase: editCostoEnvaseInput.numericValue,
        costo_caja: editCostoCajaInput.numericValue,
        costo_transporte: editCostoTransporteInput.numericValue,
        costo_mano_obra: editCostoManoObraInput.numericValue,
        costo_energia: editCostoEnergiaInput.numericValue,
        costo_depreciacion: editCostoDepreciacionInput.numericValue,
        costo_mantenimiento: editCostoMantenimientoInput.numericValue,
        costo_administrativo: editCostoAdministrativoInput.numericValue,
        costo_comercializacion: editCostoComercializacionInput.numericValue,
        costo_financiero: editCostoFinancieroInput.numericValue,
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
      setEditProductCostoEtiqueta('0');
      setEditProductCostoEnvase('0');
      setEditProductCostoCaja('0');
      setEditProductCostoTransporte('0');
      setEditProductCostoManoObra('0');
      setEditProductCostoEnergia('0');
      setEditProductCostoDepreciacion('0');
      setEditProductCostoMantenimiento('0');
      setEditProductCostoAdministrativo('0');
      setEditProductCostoComercializacion('0');
      setEditProductCostoFinanciero('0');
      setEditProductPesoEmpaque(null);
      setEditProductMaterials([]);
      setError(null);
      setSuccess('Producto actualizado exitosamente');
      await fetchProducts();
      await fetchTotalCosts();
      // Notify parent component to refresh products
      if (onProductsChange) {
        await onProductsChange();
      }
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
      // Notify parent component to refresh products
      if (onProductsChange) {
        await onProductsChange();
      }
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
      // Notify parent component to refresh products
      if (onProductsChange) {
        await onProductsChange();
      }
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
            value={ivaInput.value}
            onChange={ivaInput.handleChange}
            onBlur={ivaInput.handleBlur}
            error={!!ivaInput.error}
            helperText={ivaInput.error || "Ingrese el porcentaje de IVA (ej. 21 para 21%). Si deja vacío, se usará 21% por defecto."}
            sx={{ mb: 2 }}
           />

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Márgenes de Ganancia
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Margen Público (%)"
               value={margenPublicoInput.value}
               onChange={margenPublicoInput.handleChange}
               onBlur={margenPublicoInput.handleBlur}
               error={!!margenPublicoInput.error}
               helperText={margenPublicoInput.error || "Margen para ventas al público"}
             />
             <TextField
               fullWidth
               label="Margen Mayorista (%)"
               value={margenMayoristaInput.value}
               onChange={margenMayoristaInput.handleChange}
               onBlur={margenMayoristaInput.handleBlur}
               error={!!margenMayoristaInput.error}
               helperText={margenMayoristaInput.error || "Margen para ventas mayoristas"}
             />
             <TextField
               fullWidth
               label="Margen Distribuidor (%)"
               value={margenDistribuidorInput.value}
               onChange={margenDistribuidorInput.handleChange}
               onBlur={margenDistribuidorInput.handleBlur}
               error={!!margenDistribuidorInput.error}
               helperText={margenDistribuidorInput.error || "Margen para ventas a distribuidores"}
             />
           </Box>

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Costos de Empaque
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
             Costos asociados al empaquetado del producto
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Costo Etiqueta"
               value={costoEtiquetaInput.value}
               onChange={costoEtiquetaInput.handleChange}
               onBlur={costoEtiquetaInput.handleBlur}
               error={!!costoEtiquetaInput.error}
               helperText={costoEtiquetaInput.error || "Costo de la etiqueta (opcional)"}
             />
             <TextField
               fullWidth
               label="Costo Envase"
               value={costoEnvaseInput.value}
               onChange={costoEnvaseInput.handleChange}
               onBlur={costoEnvaseInput.handleBlur}
               error={!!costoEnvaseInput.error}
               helperText={costoEnvaseInput.error || "Costo del envase (opcional)"}
             />
             <TextField
               fullWidth
               label="Costo Caja"
               value={costoCajaInput.value}
               onChange={costoCajaInput.handleChange}
               onBlur={costoCajaInput.handleBlur}
               error={!!costoCajaInput.error}
               helperText={costoCajaInput.error || "Costo de la caja (opcional)"}
             />
             <TextField
               fullWidth
               label="Costo Transporte"
               value={costoTransporteInput.value}
               onChange={costoTransporteInput.handleChange}
               onBlur={costoTransporteInput.handleBlur}
               error={!!costoTransporteInput.error}
               helperText={costoTransporteInput.error || "Costo de transporte (requerido)"}
               required
             />
           </Box>

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Costos de Producción
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
             Costos directos del proceso de fabricación
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Mano de Obra Directa"
               value={costoManoObraInput.value}
               onChange={costoManoObraInput.handleChange}
               onBlur={costoManoObraInput.handleBlur}
               error={!!costoManoObraInput.error}
               helperText={costoManoObraInput.error || "Costo de personal por unidad producida"}
             />
             <TextField
               fullWidth
               label="Energía y Servicios"
               value={costoEnergiaInput.value}
               onChange={costoEnergiaInput.handleChange}
               onBlur={costoEnergiaInput.handleBlur}
               error={!!costoEnergiaInput.error}
               helperText={costoEnergiaInput.error || "Electricidad, agua, gas por unidad"}
             />
             <TextField
               fullWidth
               label="Depreciación de Equipos"
               value={costoDepreciacionInput.value}
               onChange={costoDepreciacionInput.handleChange}
               onBlur={costoDepreciacionInput.handleBlur}
               error={!!costoDepreciacionInput.error}
               helperText={costoDepreciacionInput.error || "Desgaste de maquinaria por unidad"}
             />
             <TextField
               fullWidth
               label="Mantenimiento"
               value={costoMantenimientoInput.value}
               onChange={costoMantenimientoInput.handleChange}
               onBlur={costoMantenimientoInput.handleBlur}
               error={!!costoMantenimientoInput.error}
               helperText={costoMantenimientoInput.error || "Mantenimiento de equipos por unidad"}
             />
           </Box>

           <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
             Gastos Operacionales
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
             Gastos administrativos y comerciales
           </Typography>

           <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
             <TextField
               fullWidth
               label="Gastos Administrativos"
               value={costoAdministrativoInput.value}
               onChange={costoAdministrativoInput.handleChange}
               onBlur={costoAdministrativoInput.handleBlur}
               error={!!costoAdministrativoInput.error}
               helperText={costoAdministrativoInput.error || "Oficina, personal administrativo por unidad"}
             />
             <TextField
               fullWidth
               label="Comercialización"
               value={costoComercializacionInput.value}
               onChange={costoComercializacionInput.handleChange}
               onBlur={costoComercializacionInput.handleBlur}
               error={!!costoComercializacionInput.error}
               helperText={costoComercializacionInput.error || "Marketing, ventas, distribución por unidad"}
             />
             <TextField
               fullWidth
               label="Costos Financieros"
               value={costoFinancieroInput.value}
               onChange={costoFinancieroInput.handleChange}
               onBlur={costoFinancieroInput.handleBlur}
               error={!!costoFinancieroInput.error}
               helperText={costoFinancieroInput.error || "Intereses, préstamos por unidad (opcional)"}
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
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Información Básica</Typography>
              <TextField
                fullWidth
                label="Nombre del Producto"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Porcentaje de IVA"
                value={editIvaInput.value}
                onChange={editIvaInput.handleChange}
                onBlur={editIvaInput.handleBlur}
                error={!!editIvaInput.error}
                helperText={editIvaInput.error || "Ingrese el porcentaje de IVA (ej. 21 para 21%). Si deja vacío, se usará 21% por defecto."}
              />
            </CardContent>
          </Card>
  
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Márgenes de Ganancia</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Margen Público (%)"
                  value={editMargenPublicoInput.value}
                  onChange={editMargenPublicoInput.handleChange}
                  onBlur={editMargenPublicoInput.handleBlur}
                  error={!!editMargenPublicoInput.error}
                  helperText={editMargenPublicoInput.error || "Margen para ventas al público"}
                />
                <TextField
                  fullWidth
                  label="Margen Mayorista (%)"
                  value={editMargenMayoristaInput.value}
                  onChange={editMargenMayoristaInput.handleChange}
                  onBlur={editMargenMayoristaInput.handleBlur}
                  error={!!editMargenMayoristaInput.error}
                  helperText={editMargenMayoristaInput.error || "Margen para ventas mayoristas"}
                />
                <TextField
                  fullWidth
                  label="Margen Distribuidor (%)"
                  value={editMargenDistribuidorInput.value}
                  onChange={editMargenDistribuidorInput.handleChange}
                  onBlur={editMargenDistribuidorInput.handleBlur}
                  error={!!editMargenDistribuidorInput.error}
                  helperText={editMargenDistribuidorInput.error || "Margen para ventas a distribuidores"}
                />
              </Box>
            </CardContent>
          </Card>
  
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Costos de Empaque</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Costos asociados al empaquetado del producto
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Costo Etiqueta"
                  type="number"
                  value={editProductCostoEtiqueta === '0' ? '' : editProductCostoEtiqueta}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoEtiqueta(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Costo de la etiqueta (opcional)"
                />
                <TextField
                  fullWidth
                  label="Costo Envase"
                  type="number"
                  value={editProductCostoEnvase === '0' ? '' : editProductCostoEnvase}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoEnvase(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Costo del envase (opcional)"
                />
                <TextField
                  fullWidth
                  label="Costo Caja"
                  type="number"
                  value={editProductCostoCaja === '0' ? '' : editProductCostoCaja}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoCaja(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Costo de la caja (opcional)"
                />
                <TextField
                  fullWidth
                  label="Costo Transporte"
                  type="number"
                  value={editProductCostoTransporte === '0' ? '' : editProductCostoTransporte}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoTransporte(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Costo de transporte (requerido)"
                  required
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Costos de Producción</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Costos directos del proceso de fabricación
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Mano de Obra Directa"
                  type="number"
                  value={editProductCostoManoObra === '0' ? '' : editProductCostoManoObra}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoManoObra(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Costo de personal por unidad producida"
                />
                <TextField
                  fullWidth
                  label="Energía y Servicios"
                  type="number"
                  value={editProductCostoEnergia === '0' ? '' : editProductCostoEnergia}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoEnergia(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Electricidad, agua, gas por unidad"
                />
                <TextField
                  fullWidth
                  label="Depreciación de Equipos"
                  type="number"
                  value={editProductCostoDepreciacion === '0' ? '' : editProductCostoDepreciacion}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoDepreciacion(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Desgaste de maquinaria por unidad"
                />
                <TextField
                  fullWidth
                  label="Mantenimiento"
                  type="number"
                  value={editProductCostoMantenimiento === '0' ? '' : editProductCostoMantenimiento}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoMantenimiento(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Mantenimiento de equipos por unidad"
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Gastos Operacionales</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Gastos administrativos y comerciales
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Gastos Administrativos"
                  type="number"
                  value={editProductCostoAdministrativo === '0' ? '' : editProductCostoAdministrativo}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoAdministrativo(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Oficina, personal administrativo por unidad"
                />
                <TextField
                  fullWidth
                  label="Comercialización"
                  type="number"
                  value={editProductCostoComercializacion === '0' ? '' : editProductCostoComercializacion}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoComercializacion(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Marketing, ventas, distribución por unidad"
                />
                <TextField
                  fullWidth
                  label="Costos Financieros"
                  type="number"
                  value={editProductCostoFinanciero === '0' ? '' : editProductCostoFinanciero}
                  placeholder="0"
                  onChange={(e) => setEditProductCostoFinanciero(e.target.value || '0')}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Intereses, préstamos por unidad (opcional)"
                />
              </Box>
            </CardContent>
          </Card>
  
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Información del Empaque</Typography>
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
            </CardContent>
          </Card>
  
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Materiales</Typography>
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
            </CardContent>
          </Card>
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
                      Costo Total: ${detailProduct.product_materials.reduce((sum, pm) => sum + parseFloat(pm.costo), 0).toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Cost Summary Section */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Desglose de Costos por Paquete
                  </Typography>

                  {/* Packaging Costs */}
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                    Costos de Empaque
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Costo Etiqueta:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_etiqueta).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Costo Envase:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_envase).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Costo Caja:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_caja).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Costo Transporte:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_transporte).toFixed(2)}</Typography>
                    </Box>
                  </Box>

                  {/* Production Costs */}
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                    Costos de Producción
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Mano de Obra Directa:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_mano_obra).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Energía y Servicios:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_energia).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Depreciación de Equipos:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_depreciacion).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Mantenimiento:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_mantenimiento).toFixed(2)}</Typography>
                    </Box>
                  </Box>

                  {/* Operational Costs */}
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                    Gastos Operacionales
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Gastos Administrativos:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_administrativo).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Comercialización:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_comercializacion).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Costos Financieros:</Typography>
                      <Typography variant="body2">${parseFloat(detailProduct.costo_financiero).toFixed(2)}</Typography>
                    </Box>
                  </Box>

                  {/* Summary */}
                  <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        Costo Materiales por Paquete:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        ${(parseFloat(detailProduct.costo_paquete) - (parseFloat(detailProduct.costo_etiqueta) + parseFloat(detailProduct.costo_envase) + parseFloat(detailProduct.costo_caja) + parseFloat(detailProduct.costo_transporte) + parseFloat(detailProduct.costo_mano_obra) + parseFloat(detailProduct.costo_energia) + parseFloat(detailProduct.costo_depreciacion) + parseFloat(detailProduct.costo_mantenimiento) + parseFloat(detailProduct.costo_administrativo) + parseFloat(detailProduct.costo_comercializacion) + parseFloat(detailProduct.costo_financiero))).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Costo Base por Paquete:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        ${parseFloat(detailProduct.costo_paquete).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Costo Total de Producción:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                        ${parseFloat(detailProduct.costo_total).toFixed(2)}
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