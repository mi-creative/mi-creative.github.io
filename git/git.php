<?php

$objCurl = curl_init();

//The repo we want to get
curl_setopt($objCurl, CURLOPT_URL, "https://api.github.com/repos/google/blueprint/commits");

//To comply with https://developer.github.com/v3/#user-agent-required
curl_setopt($objCurl, CURLOPT_USERAGENT, "mi-creative");

//Skip verification (kinda insecure)
curl_setopt($objCurl, CURLOPT_SSL_VERIFYPEER, false);

//Get the response
$response = curl_exec($objCurl);
print_r( json_decode($response, true) );

?>
