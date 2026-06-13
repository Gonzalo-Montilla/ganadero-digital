"""Rubros de ingreso para ventas (operación ganadera)."""

RUBROS_VENTA = ("animal_sacrificio", "leche", "otro")

RUBRO_ANIMAL_SACRIFICIO = "animal_sacrificio"
RUBRO_LECHE = "leche"
RUBRO_OTRO = "otro"


def resolver_rubro_venta(tipo: str, rubro_venta: str | None, animal_id: int | None) -> str | None:
    if tipo != "venta":
        return None
    if rubro_venta:
        return rubro_venta
    return RUBRO_ANIMAL_SACRIFICIO if animal_id else RUBRO_OTRO
