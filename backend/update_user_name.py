"""
Script para actualizar el nombre del usuario propietario a Byron Betancur
"""
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuración de la base de datos
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ganadero_digital"

def update_user_name():
    """Actualiza el nombre del usuario propietario"""
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Primero verificar qué usuarios existen
        cursor.execute("SELECT id, email, nombre_completo, rol FROM usuarios;")
        users = cursor.fetchall()
        
        print("Usuarios actuales:")
        for user in users:
            print(f"  ID: {user['id']}, Email: {user['email']}, Nombre: {user['nombre_completo']}, Rol: {user['rol']}")
        
        # Actualizar el nombre del propietario
        cursor.execute("""
            UPDATE usuarios 
            SET nombre_completo = 'Byron Betancur'
            WHERE rol = 'propietario';
        """)
        
        affected = cursor.rowcount
        conn.commit()
        
        print(f"\n✅ Actualizados {affected} usuario(s) con rol 'propietario'")
        
        # Verificar el cambio
        cursor.execute("SELECT id, email, nombre_completo, rol FROM usuarios WHERE rol = 'propietario';")
        updated_users = cursor.fetchall()
        
        print("\nUsuarios propietarios actualizados:")
        for user in updated_users:
            print(f"  ID: {user['id']}, Email: {user['email']}, Nombre: {user['nombre_completo']}, Rol: {user['rol']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()

if __name__ == "__main__":
    update_user_name()
