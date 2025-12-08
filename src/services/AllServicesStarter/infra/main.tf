resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-rg"
  location = var.location
}

resource "azurerm_app_service_plan" "app_plan" {
  name                = "${var.project_name}-plan"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku {
    tier = "Basic"
    size = "B1"
  }
}

resource "azurerm_app_service" "app" {
  name                = "${var.project_name}-web"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  app_service_plan_id = azurerm_app_service_plan.app_plan.id
}
