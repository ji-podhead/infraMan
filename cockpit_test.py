import requests
import json

# --- Konfiguration ---
NETDATA_HOST = "10.0.0.107"
NETDATA_PORT = 19999

# Beispiel: Wir wollen die CPU-Last und die Speichernutzung
charts_to_query = {
    "cpu": "system.cpu",
    "memory": "system.ram"
}

base_url = f"http://{NETDATA_HOST}:{NETDATA_PORT}/api/v1/data"

# --- Daten abfragen ---
all_stats = {}

try:
    for name, chart in charts_to_query.items():
        # Parameter für die API: letzte Sekunde, nur 1 Datenpunkt, Durchschnitt
        params = {
            'chart': chart,
            'after': -1,
            'points': 1,
            'group': 'average',
            'format': 'json'
        }
        
        print(f"Frage '{name}' ab von Netdata...")
        response = requests.get(base_url, params=params)
        response.raise_for_status() # Stellt sicher, dass die Anfrage erfolgreich war
        
        all_stats[name] = response.json()
        
    # Gib die gesammelten Stats aus
    print("\n--- Gesammelte Server-Statistiken ---")
    print(json.dumps(all_stats, indent=2))

except requests.exceptions.RequestException as e:
    print(f"\nFehler bei der Verbindung mit der Netdata-API: {e}")
    print("Stelle sicher, dass Netdata läuft und Port 19999 in der Firewall offen ist.")