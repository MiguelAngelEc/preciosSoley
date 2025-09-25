from decimal import Decimal

# Conversion factors to grams
UNIT_CONVERSIONS = {
    'g': 1,
    'kg': 1000,
    'l': 1000,  # assuming 1L ≈ 1000g for liquids
    'ml': 1,
    'galon': 3785,  # 1 gallon ≈ 3785g
    'caneca_20l': 20000  # 20L caneca
}

def convert_to_grams(quantity: float, unit: str) -> float:
    """Convert quantity in specified unit to grams"""
    return quantity * UNIT_CONVERSIONS.get(unit, 1)

def calculate_cost_for_quantity(cost_per_gram: Decimal, quantity: float, unit: str) -> Decimal:
    """Calculate cost for specific quantity and unit"""
    grams = convert_to_grams(quantity, unit)
    return cost_per_gram * Decimal(str(grams))