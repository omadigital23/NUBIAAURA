# Test script for delivery API fix

# 1. Login to get admin token
Write-Host "1. Logging in to get admin token..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (ConvertTo-Json @{
    username = $env:ADMIN_USERNAME
    password = $env:ADMIN_PASS
  })

$token = $loginResponse.token
Write-Host "✓ Got token: $($token.Substring(0, 10))..." -ForegroundColor Green

# 2. Get list of orders
Write-Host "`n2. Fetching orders..." -ForegroundColor Cyan
$ordersResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/orders/list" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
  }

if ($ordersResponse.orders.Count -gt 0) {
  $orderId = $ordersResponse.orders[0].id
  Write-Host "✓ Got orders. Testing with order ID: $orderId" -ForegroundColor Green
  
  # 3. Test PUT endpoint to update delivery
  Write-Host "`n3. Testing PUT /api/admin/orders/[id]/delivery..." -ForegroundColor Cyan
  try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/orders/$orderId/delivery" `
      -Method PUT `
      -ContentType "application/json" `
      -Headers @{
        "Authorization" = "Bearer $token"
      } `
      -Body (ConvertTo-Json @{
        delivery_duration_days = 5
        status = "processing"
      })
    
    Write-Host "✓ PUT request successful!" -ForegroundColor Green
    Write-Host "Response: $($updateResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Green
  } catch {
    Write-Host "✗ PUT request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  }
} else {
  Write-Host "✗ No orders found" -ForegroundColor Red
}
