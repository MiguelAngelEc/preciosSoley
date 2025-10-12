import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  AccountCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Material, Product } from '../types';
import ProductManager from '../components/ProductManager';
import ProformaManager from '../components/ProformaManager';
import InventoryManager from '../components/InventoryManager';
import MaterialManager from '../components/MaterialManager';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tabValue, setTabValue] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const data = await apiService.getMaterials();
        setMaterials(data);
      } catch (err) {
        // ignore
      }
    };
    loadMaterials();
    fetchProducts();
  }, []);


  useEffect(() => {
    if (productsError) {
      const timer = setTimeout(() => {
        setProductsError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [productsError]);


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
          <MaterialManager />
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
          <InventoryManager products={products} onProductsChange={fetchProducts} />
        )}

        {tabValue === 3 && (
          <ProformaManager products={products} />
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;