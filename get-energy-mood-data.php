<?php
// --- Configuration ---
// !!!!! IMPORTANT: Point to your V3 data file !!!!!
$csvFilePath = './energy_mood_data_v3.csv';

// --- Set Header ---
header('Content-Type: application/json; charset=utf-8');

// --- Basic File Check ---
if (!file_exists($csvFilePath) || !is_readable($csvFilePath)) {
    echo json_encode(['error' => 'Data file not found or not readable. Path: ' . $csvFilePath]);
    http_response_code(404);
    exit;
}

// --- Read and Parse CSV ---
$data = [];
$header = [];
$fileHandle = @fopen($csvFilePath, 'r');

if ($fileHandle === false) {
    echo json_encode(['error' => 'Could not open data file.']);
    http_response_code(500);
    exit;
}

// Read header to determine column indices (more robust)
$header = fgetcsv($fileHandle);
if ($header === false) { fclose($fileHandle); echo json_encode([]); exit; }

$timestampIndex = array_search('Timestamp', $header);
$energyIndex = array_search('EnergyValue_0_100', $header);
$moodIndex = array_search('MoodValue_0_100', $header);

// Check if essential columns were found
if ($timestampIndex === false || $energyIndex === false || $moodIndex === false) {
     fclose($fileHandle);
     echo json_encode(['error' => 'Required columns (Timestamp, EnergyValue_0_100, MoodValue_0_100) not found in CSV header.']);
     http_response_code(500);
     exit;
}

// Read data rows
while (($row = fgetcsv($fileHandle)) !== false) {
     // Ensure row has enough columns based on indices found
    if (isset($row[$timestampIndex]) && isset($row[$energyIndex]) && isset($row[$moodIndex])) {
        $data[] = [
            // Send only necessary columns
            'Timestamp' => $row[$timestampIndex],
            'EnergyValue_0_100' => $row[$energyIndex],
            'MoodValue_0_100' => $row[$moodIndex]
        ];
    }
}
fclose($fileHandle);

// --- Output Data as JSON ---
echo json_encode($data, JSON_PRETTY_PRINT | JSON_NUMERIC_CHECK);
exit;
?>