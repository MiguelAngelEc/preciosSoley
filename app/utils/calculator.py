from decimal import Decimal

def calcular_precio_unidad_pequena(precio_base: Decimal, unidad_base: str) -> Decimal:
    # Assuming precio_base is per kg or litros, small unit is gram or ml
    # 1 kg = 1000 grams, 1 litro = 1000 ml
    return precio_base / Decimal('1000')