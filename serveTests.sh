mkdir -p /tmp/gridrTestBuild


echo '<!doctype html ><html><head><title>Gridr Test</title><style>*{-webkit-user-select: none; -moz-user-select: none;-ms-user-select: none;}</style></head><body><script src=bundle.js></script></body></html>' > /tmp/gridrTestBuild/index.html
echo 'Created index.html'
browserify test/test.js > /tmp/gridrTestBuild/bundle.js
echo 'Built browserify bundle'
serve /tmp/gridrTestBuild/
