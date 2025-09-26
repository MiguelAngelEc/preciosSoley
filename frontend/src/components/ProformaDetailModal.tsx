import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { Proforma } from '../types';

interface ProformaDetailModalProps {
  proforma: Proforma | null;
  open: boolean;
  onClose: () => void;
}

const ProformaDetailModal: React.FC<ProformaDetailModalProps> = ({
  proforma,
  open,
  onClose
}) => {
  if (!proforma) return null;

  const formatCurrency = (amount: string | number) => {
    return `$${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTipoClienteLabel = (tipo: string) => {
    switch (tipo) {
      case 'publico': return 'Público';
      case 'mayorista': return 'Mayorista';
      case 'distribuidor': return 'Distribuidor';
      default: return tipo;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          '@media print': {
            boxShadow: 'none',
            maxWidth: 'none',
            maxHeight: 'none',
            width: '100%',
            height: '100%'
          }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          PROFOMA
        </Typography>
        <Typography variant="h5" component="div" sx={{ textAlign: 'center', mt: 1 }}>
          {proforma.numero_proforma}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 2 }}>
          {/* Header Section - Company and Proforma Info */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            {/* Company Information */}
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    PRECIOS SOLEY
                  </Typography>
                  <Typography variant="body2">
                    Dirección: [Dirección de la empresa]<br/>
                    Teléfono: [Teléfono de la empresa]<br/>
                    Email: [Email de la empresa]<br/>
                    RUC: [RUC de la empresa]
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Proforma Information */}
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Información de Proforma
                  </Typography>
                  <Typography variant="body2">
                    <strong>Número:</strong> {proforma.numero_proforma}<br/>
                    <strong>Fecha de Emisión:</strong> {formatDate(proforma.fecha_emision)}<br/>
                    <strong>Fecha de Validez:</strong> {formatDate(proforma.fecha_validez)}<br/>
                    <strong>Tipo de Cliente:</strong> {getTipoClienteLabel(proforma.tipo_cliente)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Client Information Section */}
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Información del Cliente
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 250px' }}>
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {proforma.cliente_nombre}
                  </Typography>
                  {proforma.cliente_empresa && (
                    <Typography variant="body2">
                      <strong>Empresa:</strong> {proforma.cliente_empresa}
                    </Typography>
                  )}
                  {proforma.cliente_ruc && (
                    <Typography variant="body2">
                      <strong>RUC:</strong> {proforma.cliente_ruc}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  {proforma.cliente_direccion && (
                    <Typography variant="body2">
                      <strong>Dirección:</strong> {proforma.cliente_direccion}
                    </Typography>
                  )}
                  {proforma.cliente_telefono && (
                    <Typography variant="body2">
                      <strong>Teléfono:</strong> {proforma.cliente_telefono}
                    </Typography>
                  )}
                  {proforma.cliente_email && (
                    <Typography variant="body2">
                      <strong>Email:</strong> {proforma.cliente_email}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Detalle de Productos
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio Unitario</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proforma.proforma_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.cantidad}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {item.product.nombre}
                      </Typography>
                      {item.product.peso_empaque && (
                        <Typography variant="caption" color="text.secondary">
                          Peso empaque: {item.product.peso_empaque}g
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.precio_unitario)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.subtotal_item)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals Section */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
            <Card variant="outlined" sx={{ minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Resumen Total
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Subtotal:</Typography>
                  <Typography variant="body1">{formatCurrency(proforma.subtotal)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">
                    IVA ({parseFloat(proforma.iva_aplicado).toFixed(0)}%):
                  </Typography>
                  <Typography variant="body1">{formatCurrency(proforma.total_iva)}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    TOTAL:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(proforma.total_final)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Footer Section */}
          <Card variant="outlined" sx={{ backgroundColor: '#f9f9f9' }}>
            <CardContent>
              <Typography variant="body2" align="center" sx={{ mb: 1 }}>
                <strong>Términos y Condiciones:</strong>
              </Typography>
              <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                Esta proforma tiene una validez de 15 días a partir de la fecha de emisión.
                Los precios están sujetos a cambios sin previo aviso.
              </Typography>
              <Typography variant="body2" align="center" sx={{ fontStyle: 'italic' }}>
                Gracias por su preferencia. Precios Soley - Calidad y Servicio Garantizado.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
        <Button
          variant="contained"
          onClick={() => window.print()}
          sx={{
            '@media print': {
              display: 'none'
            }
          }}
        >
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProformaDetailModal;