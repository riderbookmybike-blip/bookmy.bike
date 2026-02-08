import json
import sys

def find_apache_2v(data):
    # Traverse the JSON finding the vehicle with code "102" or name containing "Apache RTR 160 2V"
    if isinstance(data, dict):
        if data.get('VehicleName', {}).get('value') == "TVS Apache RTR 160 CC 2V":
             return data
        if data.get('VehicleCode', {}).get('value') == "102":
             return data
        for key, value in data.items():
            result = find_apache_2v(value)
            if result:
                return result
    elif isinstance(data, list):
        for item in data:
            result = find_apache_2v(item)
            if result:
                return result
    return None

if __name__ == "__main__":
    with open('jss_state.json', 'r') as f:
        data = json.load(f)
    
    apache_data = find_apache_2v(data)
    if apache_data:
        print(json.dumps(apache_data, indent=2))
    else:
        print("Apache RTR 160 2V not found", file=sys.stderr)
