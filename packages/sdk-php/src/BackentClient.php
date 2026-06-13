<?php

namespace Backent;

class BackentError extends \Exception
{
    public int $statusCode;

    public function __construct(int $statusCode, string $message)
    {
        $this->statusCode = $statusCode;
        parent::__construct("Backent API Error ($statusCode): $message");
    }
}

class TableClient
{
    private string $apiUrl;
    private string $apiKey;
    private string $table;

    public function __construct(string $apiUrl, string $apiKey, string $table)
    {
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->apiKey = $apiKey;
        $this->table = $table;
    }

    private function request(string $method, string $path, ?array $data = null): array
    {
        $url = "{$this->apiUrl}/{$this->table}{$path}";
        $ch = curl_init($url);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "X-API-Key: {$this->apiKey}",
            ],
        ]);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($statusCode >= 400) {
            throw new BackentError($statusCode, (string) $response);
        }

        return json_decode((string) $response, true) ?? [];
    }

    public function list(int $page = 1, int $limit = 50): array
    {
        return $this->request('GET', "?page={$page}&limit={$limit}");
    }

    public function create(array $data): array
    {
        return $this->request('POST', '', $data);
    }

    public function update(string $id, array $data): array
    {
        return $this->request('PUT', "/{$id}", $data);
    }

    public function delete(string $id): array
    {
        return $this->request('DELETE', "/{$id}");
    }
}

class BackentClient
{
    private string $apiUrl;
    private string $apiKey;

    public function __construct(string $apiUrl, string $apiKey)
    {
        $this->apiUrl = rtrim($apiUrl, '/');
        $this->apiKey = $apiKey;
    }

    public function table(string $name): TableClient
    {
        return new TableClient($this->apiUrl, $this->apiKey, $name);
    }
}
