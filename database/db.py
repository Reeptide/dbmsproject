import mysql.connector
from mysql.connector import Error
import os
from contextlib import contextmanager

class Database:
    def __init__(self):
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'flight_management'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'autocommit': False
        }
    
    def get_connection(self):
        """Create and return a database connection"""
        try:
            connection = mysql.connector.connect(**self.config)
            return connection
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            raise
    
    @contextmanager
    def get_cursor(self, dictionary=True):
        """Context manager for database cursor"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=dictionary)
        try:
            yield cursor, connection
            connection.commit()
        except Exception as e:
            connection.rollback()
            raise
        finally:
            cursor.close()
            connection.close()
    
    def execute_query(self, query, params=None, fetch_one=False):
        """Execute a SELECT query and return results"""
        with self.get_cursor() as (cursor, connection):
            cursor.execute(query, params or ())
            if fetch_one:
                return cursor.fetchone()
            return cursor.fetchall()
    
    def execute_update(self, query, params=None):
        """Execute INSERT, UPDATE, or DELETE query"""
        with self.get_cursor() as (cursor, connection):
            cursor.execute(query, params or ())
            return cursor.rowcount
    
    def call_procedure(self, proc_name, params=None):
        """Call a stored procedure"""
        with self.get_cursor() as (cursor, connection):
            cursor.callproc(proc_name, params or ())
            results = []
            for result in cursor.stored_results():
                results.extend(result.fetchall())
            return results
    
    def call_function(self, func_name, params):
        """Call a MySQL function and return result"""
        placeholders = ', '.join(['%s'] * len(params))
        query = f"SELECT {func_name}({placeholders}) AS result"
        with self.get_cursor() as (cursor, connection):
            cursor.execute(query, params)
            result = cursor.fetchone()
            return result['result'] if result else None

# Global database instance
db = Database()