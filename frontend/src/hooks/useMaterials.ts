import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Material, MaterialCreate, MaterialUpdate } from '../types';

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
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

  const createMaterial = async (materialData: MaterialCreate) => {
    try {
      setLoading(true);
      await apiService.createMaterial(materialData);
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

  const updateMaterial = async (id: number, materialData: MaterialUpdate) => {
    try {
      setLoading(true);
      await apiService.updateMaterial(id, materialData);
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

  const deleteMaterial = async (id: number) => {
    try {
      setLoading(true);
      await apiService.deleteMaterial(id);
      setError(null);
      setSuccess('Material eliminado exitosamente');
      await fetchMaterials(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar el material');
    } finally {
      setLoading(false);
    }
  };

  return {
    materials,
    loading,
    error,
    success,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  };
};