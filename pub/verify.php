<?php
include_once '../.config';

$http_origin = $_SERVER['HTTP_ORIGIN'];
header("Access-Control-Allow-Origin: $http_origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Authorization, Content-Type,Accept, Origin");
    exit(0);
}

if($_SERVER['REQUEST_METHOD']!='POST'){
    http_response_code(404); 
    exit;
}

$rawInput = fopen('php://input', 'r');
$tempStream = fopen('php://temp', 'r+');
stream_copy_to_stream($rawInput, $tempStream);
rewind($tempStream);

$lines = array();
$pks = array();

if ($tempStream) {
    while (($line = fgets($tempStream)) !== false) {
        $parsed = str_getcsv($line);
        array_push($lines, $parsed[1]);
        array_push($pks, $parsed[2]);
    }
    fclose($tempStream);
}

try {
  $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  
  $stmt = $conn->prepare("SELECT DISTINCT id FROM address_1 WHERE id IN (:"
        . implode(',:', array_keys($lines)) . ") limit " . count($lines)) ;

  foreach ($lines as $k => $id) {
    $stmt->bindValue(":". $k, $id);
  }  

   $stmt->execute();
   $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
   $data = array();
   foreach($results as $row) {
        $id = $row['id'];
        $address = array_search($id, $lines);
        array_push($data, (object)[$id =>  $pks[$address]]);
    }
   header('Content-Type: application/json; charset=utf-8');
   echo json_encode($data);

} catch(PDOException $e) {
  echo "Connection failed: " . $e->getMessage();
  http_response_code(500); 
  exit;
}

?>
