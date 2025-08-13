<?php
// KHS CRM Sync Server
// Place this in a folder like: public_html/crm-sync/

// Set timezone
date_default_timezone_set('America/New_York');

// CORS headers for your CRM
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simple authentication token (change this!)
$AUTH_TOKEN = 'khs-sync-2024-secure-token';

// Check authentication
$headers = getallheaders();
$providedToken = isset($headers['X-Auth-Token']) ? $headers['X-Auth-Token'] : '';

if ($providedToken !== $AUTH_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Sync data directory
$SYNC_DIR = __DIR__ . '/sync-data';
if (!file_exists($SYNC_DIR)) {
    mkdir($SYNC_DIR, 0755, true);
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'GET':
        if ($action === 'latest') {
            // Get latest sync file
            $files = glob($SYNC_DIR . '/khs-sync-*.json');
            if (empty($files)) {
                echo json_encode(['error' => 'No sync files found']);
                exit;
            }
            
            // Sort by modification time
            usort($files, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            $latestFile = $files[0];
            $content = file_get_contents($latestFile);
            $data = json_decode($content, true);
            
            echo json_encode([
                'success' => true,
                'filename' => basename($latestFile),
                'timestamp' => filemtime($latestFile),
                'data' => $data
            ]);
        } else {
            // List all sync files
            $files = glob($SYNC_DIR . '/khs-sync-*.json');
            $fileList = [];
            
            foreach ($files as $file) {
                $fileList[] = [
                    'filename' => basename($file),
                    'size' => filesize($file),
                    'modified' => date('Y-m-d H:i:s', filemtime($file))
                ];
            }
            
            echo json_encode([
                'success' => true,
                'files' => $fileList
            ]);
        }
        break;
        
    case 'POST':
        if ($action === 'upload') {
            // Receive sync data
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid data']);
                exit;
            }
            
            // Create filename with timestamp
            $filename = 'khs-sync-' . date('Y-m-d-His') . '.json';
            $filepath = $SYNC_DIR . '/' . $filename;
            
            // Save the file
            file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT));
            
            // Clean up old files (keep last 10)
            $files = glob($SYNC_DIR . '/khs-sync-*.json');
            if (count($files) > 10) {
                usort($files, function($a, $b) {
                    return filemtime($a) - filemtime($b);
                });
                
                $filesToDelete = array_slice($files, 0, count($files) - 10);
                foreach ($filesToDelete as $file) {
                    unlink($file);
                }
            }
            
            echo json_encode([
                'success' => true,
                'filename' => $filename,
                'message' => 'Sync data uploaded successfully'
            ]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>