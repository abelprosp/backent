"""Backent Python SDK"""

from typing import Any, Dict, List, Optional
import requests


class BackentError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(f"Backent API Error ({status_code}): {message}")


class TableClient:
    def __init__(self, api_url: str, api_key: str, table: str):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.table = table
        self._headers = {
            "Content-Type": "application/json",
            "X-API-Key": api_key,
        }

    @property
    def _base(self) -> str:
        return f"{self.api_url}/{self.table}"

    def list(
        self,
        page: int = 1,
        limit: int = 50,
        sort: Optional[str] = None,
        order: str = "desc",
    ) -> Dict[str, Any]:
        params = {"page": page, "limit": limit, "order": order}
        if sort:
            params["sort"] = sort
        response = requests.get(self._base, headers=self._headers, params=params)
        if not response.ok:
            raise BackentError(response.status_code, response.text)
        return response.json()

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(self._base, headers=self._headers, json=data)
        if not response.ok:
            raise BackentError(response.status_code, response.text)
        return response.json()

    def update(self, record_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.put(
            f"{self._base}/{record_id}", headers=self._headers, json=data
        )
        if not response.ok:
            raise BackentError(response.status_code, response.text)
        return response.json()

    def delete(self, record_id: str) -> Dict[str, Any]:
        response = requests.delete(
            f"{self._base}/{record_id}", headers=self._headers
        )
        if not response.ok:
            raise BackentError(response.status_code, response.text)
        return response.json()


class BackentClient:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key

    def table(self, name: str) -> TableClient:
        return TableClient(self.api_url, self.api_key, name)
