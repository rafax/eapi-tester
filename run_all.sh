npm run bundle
for env in cf-cg-triton direct-cg-triton direct-cg-triton-https cf-triton https-triton http-triton; do
    echo $env
    k6 run -e BACKEND=$env dist/load_test.js
done
