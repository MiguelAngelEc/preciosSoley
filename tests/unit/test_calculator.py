import pytest
from decimal import Decimal

from app.utils.calculator import calcular_precio_unidad_pequena


def test_calcular_precio_unidad_pequena_happy_path():
    precio = Decimal('10.00')
    result = calcular_precio_unidad_pequena(precio, 'kg')
    assert result == Decimal('0.01')


def test_calcular_precio_unidad_pequena_zero():
    precio = Decimal('0')
    result = calcular_precio_unidad_pequena(precio, 'litro')
    assert result == Decimal('0')


def test_calcular_precio_unidad_pequena_negative():
    precio = Decimal('-5.00')
    result = calcular_precio_unidad_pequena(precio, 'kg')
    assert result == Decimal('-0.005')