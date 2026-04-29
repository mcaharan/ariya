<?php
$html = file_get_contents(__DIR__ . '/../response_child.html');
if (! $html) {
    echo "ERROR: response_child.html not found\n";
    exit(1);
}

if (! preg_match('/id="app"[^>]*data-page="([^"]+)"/s', $html, $m)) {
    echo "ERROR: data-page attribute not found\n";
    exit(1);
}

$enc = $m[1];
// Decode HTML entities
$jsonStr = html_entity_decode($enc, ENT_QUOTES | ENT_HTML5);
// The attribute may contain escaped quotes; ensure valid JSON
$page = json_decode($jsonStr, true);
if ($page === null) {
    echo "ERROR: JSON decode failed\n";
    echo "Decoded string:\n";
    echo $jsonStr . "\n";
    exit(1);
}

if (! isset($page['props']['page'])) {
    echo "ERROR: props.page not found in Inertia payload\n";
    echo json_encode(array_keys($page['props'] ?? []), JSON_PRETTY_PRINT) . "\n";
    exit(1);
}

echo json_encode($page['props']['page'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
