"""
app.py — Flask REST API for Sport Shoes Catalog
Endpoints:
  POST /products  — add a new product
  GET  /products  — list all products (supports ?q= search)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from the Vue frontend


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_connection():
    """Open and return a MySQL connection."""
    return mysql.connector.connect(**DB_CONFIG)


def ensure_table():
    """Create the products table if it does not already exist."""
    ddl = """
    CREATE TABLE IF NOT EXISTS products (
        id          INT            AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(200)   NOT NULL,
        description TEXT           NOT NULL,
        price       DECIMAL(10, 2) NOT NULL,
        image       TEXT           NOT NULL,
        created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(ddl)
    conn.commit()
    cursor.close()
    conn.close()


# Run table bootstrap on startup
ensure_table()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/products", methods=["POST"])
def add_product():
    """
    Add a new product.
    Expects JSON body: { name, description, price, image }
    """
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    # --- Validate required fields ---
    errors = {}
    name        = str(data.get("name", "")).strip()
    description = str(data.get("description", "")).strip()
    image       = str(data.get("image", "")).strip()

    if not name:
        errors["name"] = "Product name is required."
    if not description:
        errors["description"] = "Description is required."
    if not image:
        errors["image"] = "Image URL or path is required."

    # Price must be a non-negative number
    try:
        price = float(data.get("price", ""))
        if price < 0:
            errors["price"] = "Price must be a non-negative number."
    except (TypeError, ValueError):
        errors["price"] = "A valid numeric price is required."

    if errors:
        return jsonify({"errors": errors}), 422

    # --- Insert into database ---
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO products (name, description, price, image) VALUES (%s, %s, %s, %s)",
            (name, description, price, image),
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()

        return jsonify({"message": "Product added successfully.", "id": new_id}), 201

    except Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500


@app.route("/products", methods=["GET"])
def get_products():
    """
    Retrieve all products.
    Optional query param ?q=<text> filters by name.
    Products whose name *starts with* the query appear first (priority sort).
    """
    query = request.args.get("q", "").strip()

    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        if query:
            # Priority: names that start with the query come first, then others that contain it
            sql = """
                SELECT id, name, description, price, image, created_at
                FROM   products
                WHERE  name LIKE %s
                ORDER BY
                    CASE WHEN name LIKE %s THEN 0 ELSE 1 END,
                    name
            """
            like_any    = f"%{query}%"
            like_starts = f"{query}%"
            cursor.execute(sql, (like_any, like_starts))
        else:
            cursor.execute(
                "SELECT id, name, description, price, image, created_at FROM products ORDER BY created_at DESC"
            )

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        # Convert Decimal → float and datetime → str for JSON serialisation
        for row in rows:
            row["price"]      = float(row["price"])
            row["created_at"] = str(row["created_at"])

        return jsonify(rows), 200

    except Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
