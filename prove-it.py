import requests
import json
import time
import threading

def prove_it():
    token = "apify_api_Ppr1B2otoD26lfV85cWmaSnaO3V5Mh4loXZN"
    base_url = "https://6dldqi3lucov.runs.apify.net"
    
    print(f"🔗 Attempting connection to {base_url}...")
    
    # Use a list to store results from thread
    results = []
    session_ready = threading.Event()
    endpoint_data = {"path": None}
    
    def read_sse():
        nonlocal results
        sse_url_full = f"{base_url}/sse?token={token}"
        headers = {"Authorization": f"Bearer {token}"}
        try:
            with requests.get(sse_url_full, headers=headers, stream=True, timeout=120) as r:
                if r.status_code != 200:
                    print(f"❌ SSE Handshake failed: {r.status_code} {r.text}")
                    return
                
                for line in r.iter_lines():
                    if line:
                        decoded = line.decode('utf-8')
                        if decoded.startswith("data: "):
                            data = decoded[len("data: "):].strip()
                            if not session_ready.is_set() and ("/messages" in data):
                                endpoint_data["path"] = data
                                session_ready.set()
                            else:
                                results.append(data)
                                # If we see a result for our call, we can stop
                                if '"result":' in data and '"id":1' in data:
                                    print("✅ Result received in SSE stream!")
                                    return
        except Exception as e:
            print(f"❌ SSE Thread Error: {e}")

    # Start SSE thread
    sse_thread = threading.Thread(target=read_sse)
    sse_thread.daemon = True
    sse_thread.start()
    
    # Wait for session
    if not session_ready.wait(timeout=20):
        print("❌ Timeout waiting for SSE session")
        return
    
    endpoint_path = endpoint_data["path"]
    print(f"✅ Session established! Endpoint: {endpoint_path}")
    
    # Construct messages_url
    if "?" in endpoint_path:
        messages_url = f"{base_url}{endpoint_path}&token={token}"
    else:
        messages_url = f"{base_url}{endpoint_path}?token={token}"
    
    print(f"🎯 Calling search_web via {messages_url}...")
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "search_web",
            "arguments": {
                "query": "venture capital trends London 2026",
                "num_results": 3
            }
        }
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(messages_url, json=payload, headers=headers, timeout=60)
    if res.status_code not in [200, 202]:
        print(f"❌ Tool call failed: {res.status_code} {res.text}")
        return
    
    print("✅ Tool call submitted! Waiting for result via SSE...")
    sse_thread.join(timeout=60)
    
    # Print results
    print("\n--- TOOL OUTPUT ---")
    for r in results:
        try:
            parsed = json.loads(r)
            if "result" in parsed and "content" in parsed["result"]:
                for item in parsed["result"]["content"]:
                    print(item.get("text", ""))
            else:
                print(json.dumps(parsed, indent=2))
        except:
            print(r)
    print("-------------------\n")

if __name__ == "__main__":
    prove_it()
