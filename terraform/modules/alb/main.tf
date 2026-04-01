################################################################################
# ALB Module - MYB Platform
# Application Load Balancer with path-based routing to microservices
################################################################################

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "prod"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-alb"
  })
}

################################################################################
# Default Target Group (Frontend)
################################################################################

resource "aws_lb_target_group" "frontend" {
  name        = "${var.project_name}-${var.environment}-frontend"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = merge(var.tags, {
    Name    = "${var.project_name}-${var.environment}-frontend-tg"
    Service = "frontend"
  })
}

################################################################################
# API Target Groups (one per microservice)
################################################################################

resource "aws_lb_target_group" "services" {
  for_each    = { for svc in var.services : svc.name => svc }
  name        = "${var.project_name}-${var.environment}-${substr(each.key, 0, min(length(each.key), 18))}"
  port        = each.value.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = each.value.health_check_path
    port                = "traffic-port"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = merge(var.tags, {
    Name    = "${var.project_name}-${var.environment}-${each.key}-tg"
    Service = each.key
  })
}

################################################################################
# HTTP Listener (redirect to HTTPS in prod, direct in dev)
################################################################################

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    # For dev without SSL, forward to frontend
    target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.frontend.arn : null
  }
}

################################################################################
# HTTPS Listener (only when certificate is provided)
################################################################################

resource "aws_lb_listener" "https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

################################################################################
# Path-based Routing Rules for API services
################################################################################

locals {
  listener_arn = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
}

resource "aws_lb_listener_rule" "api_routes" {
  for_each     = { for svc in var.services : svc.name => svc }
  listener_arn = local.listener_arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }

  tags = merge(var.tags, {
    Service = each.key
  })
}

################################################################################
# Keycloak routing rule (special - needs its own path)
################################################################################

resource "aws_lb_listener_rule" "keycloak" {
  listener_arn = local.listener_arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["keycloak"].arn
  }

  condition {
    path_pattern {
      values = ["/auth/*", "/realms/*", "/resources/*", "/js/*"]
    }
  }

  tags = merge(var.tags, {
    Service = "keycloak"
  })
}
