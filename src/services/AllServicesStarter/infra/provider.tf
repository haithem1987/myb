provider "azurerm" {
  features {}
}

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "myb-infra-rg"
    storage_account_name = "mybterraformstate"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}
