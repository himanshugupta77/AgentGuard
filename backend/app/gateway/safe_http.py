import urllib.request
import urllib.error
import json
from typing import Any

class SafeHTTP:
    """Restricted outbound HTTP executor."""

    @staticmethod
    def request(
        method: str,
        url: str,
        headers: dict[str, str] | None = None,
        body: str | dict | None = None,
        timeout: int = 5
    ) -> dict[str, Any]:
        req_headers = headers or {}
        data_bytes = None
        if body:
            if isinstance(body, dict):
                data_bytes = json.dumps(body).encode("utf-8")
                req_headers["Content-Type"] = "application/json"
            else:
                data_bytes = str(body).encode("utf-8")

        req = urllib.request.Request(
            url=url,
            data=data_bytes,
            headers=req_headers,
            method=method.upper()
        )

        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                resp_body = response.read().decode("utf-8", errors="replace")
                return {
                    "success": 200 <= response.status < 300,
                    "status_code": response.status,
                    "response": resp_body[:2000]
                }
        except urllib.error.HTTPError as e:
            return {
                "success": False,
                "status_code": e.code,
                "error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "status_code": 500,
                "error": str(e)
            }

safe_http = SafeHTTP()
