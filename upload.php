<?php

// read contents from the input stream
$inputHandler = fopen('php://input', "r");
// create a temp file where to save data from the input stream
$path = realpath(dirname(__FILE__) . '/upload');

if (!function_exists('getallheaders')) 
{ 
    function getallheaders() 
    { 
           $headers = ''; 
       foreach ($_SERVER as $name => $value) 
       { 
           if (substr($name, 0, 5) == 'HTTP_') 
           { 
               $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value; 
           } 
       } 
       return $headers; 
    } 
}

$headers = getallheaders();
$fileName = '';
$data = array();
$fileHandler = null;


if (isset($headers['X-File-Start']) and $headers['X-File-Start'] == 0) {    
    $ext = '';
    if (isset($headers['X-File-Name'])) {
        $info = pathinfo($headers['X-File-Name']);
        $ext = $info['extension'];
    }

    $fileName = uniqid() . '.' . $ext;
    $fileHandler = fopen($path . '/' . $fileName, "w+");
    
} else if (isset($headers['X-File-Target']) and $headers['X-File-Target']) {
    $fileName = $headers['X-File-Target'];
    $fileHandler = fopen($path . '/' . $headers['X-File-Target'], "a+");
}

$mime = isset($headers['X-File-Type']) ? $headers['X-File-Type'] : 'application/octet-stream';

$data['filename'] = $fileName;
if (isset($headers['X-File-End']) and isset($headers['X-File-Size']) and ($headers['X-File-End'] < $headers['X-File-Size'])) {
    $data['next'] = $headers['X-File-End'];
} else if ($headers['X-File-End'] > $headers['X-File-Size']) {
    $data['url'] = 'upload/' . $fileName;
}

// save data from the input stream
while(true) {
    $buffer = fgets($inputHandler, 4096);
    if (strlen($buffer) == 0) {
        fclose($inputHandler);
        fclose($fileHandler);
        break;
    }

    fwrite($fileHandler,$buffer);
}

header('Content-Type: application/json');
echo json_encode($data);
exit;
